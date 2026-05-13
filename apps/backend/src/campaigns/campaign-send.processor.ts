import { Processor, WorkerHost } from "@nestjs/bullmq";
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SegmentQuerySchema, parseVariableSchemaJson } from "@madoo/shared";
import type { Job } from "bullmq";
import { PrismaService } from "../prisma/prisma.service";
import { ReactToHtmlService } from "../generation/react-to-html.service";
import { buildPrismaWhere } from "../segments/segment-query";
import { buildComplianceFooter } from "../sending/footer";
import { encodeUnsubscribeToken } from "../sending/unsubscribe-token";
import {
  SENDING_PROVIDER,
  type SendBatchItem,
  type SendingProvider,
} from "../sending/sending-provider.interface";
import {
  collectTrackableHrefs,
  rewriteAnchorsAndInjectPixel,
} from "../tracking/html-tracking";
import { CAMPAIGN_SEND_JOB, CAMPAIGN_SEND_QUEUE, type CampaignSendJobPayload } from "./campaign-send.types";

const CHUNK_SIZE = 200;

@Injectable()
@Processor(CAMPAIGN_SEND_QUEUE)
export class CampaignSendProcessor extends WorkerHost {
  private readonly logger = new Logger(CampaignSendProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly reactToHtml: ReactToHtmlService,
    @Inject(SENDING_PROVIDER) private readonly sender: SendingProvider,
  ) {
    super();
  }

  async process(job: Job<CampaignSendJobPayload>): Promise<void> {
    if (job.name !== CAMPAIGN_SEND_JOB) return;

    const campaign = await this.prisma.campaign.findFirst({
      where: { id: job.data.campaignId, workspaceId: job.data.workspaceId },
      include: {
        segment: { select: { query: true } },
        email: {
          include: {
            variants: {
              orderBy: { seq: "desc" },
              take: 1,
            },
          },
        },
        workspace: {
          select: {
            name: true,
            postalAddress: true,
            billingSubscription: { select: { plan: true } },
          },
        },
      },
    });
    if (!campaign) throw new NotFoundException("Campaign not found.");

    const variant = campaign.email.variants[0];
    if (!variant) throw new NotFoundException("Email variant not found.");

    try {
      const segmentQuery = SegmentQuerySchema.parse(campaign.segment.query);
      const where = buildPrismaWhere(job.data.workspaceId, segmentQuery);
      const suppressionRows = await this.prisma.suppressionEntry.findMany({
        where: { workspaceId: job.data.workspaceId },
        select: { email: true },
      });
      const suppressedEmails = suppressionRows.map((entry) => entry.email);

      const audienceAnd = [
        where,
        { status: "ACTIVE" as const },
        ...(suppressedEmails.length > 0 ? [{ NOT: { email: { in: suppressedEmails } } }] : []),
      ];
      const audience = await this.prisma.contact.findMany({
        where: {
          AND: audienceAnd,
        },
        orderBy: { createdAt: "desc" },
      });
      if (audience.length === 0) {
        await this.prisma.campaign.update({
          where: { id: campaign.id },
          data: { status: "DRAFT" },
        });
        throw new NotFoundException("Campaign audience is empty.");
      }

      const component = this.reactToHtml.compileComponent(variant.componentCode);
      const variableSchema = parseVariableSchemaJson(variant.variableSchema).variables;
      const appUrl = this.config.get<string>("APP_URL") ?? "http://localhost:3000";
      const secret = this.config.get<string>("JWT_SECRET") ?? "";
      const senderDomain = this.config.get<string>("SENDING_DOMAIN") ?? "madooai.com";
      const fromEmail = campaign.fromEmail || `hello@${senderDomain}`;
      const trackingBaseUrl = this.resolveTrackingBaseUrl();

      const trackedLinkCache = await this.loadTrackedLinkCache(
        job.data.workspaceId,
        campaign.id,
      );

      const maxPerSecond = Number(
        this.config.get<string>("CAMPAIGN_SEND_RATE_PER_SECOND") ??
          this.config.get<string>("SEND_THROTTLE_LIMIT") ??
          "5",
      );

      for (let i = 0; i < audience.length; i += CHUNK_SIZE) {
        const chunk = audience.slice(i, i + CHUNK_SIZE);

      const deliveries = await this.prisma.$transaction(
        chunk.map((contact) =>
          this.prisma.campaignDelivery.create({
            data: {
              campaignId: campaign.id,
              contactId: contact.id,
              status: "PENDING",
            },
          }),
        ),
      );

      const prepared = chunk.map((contact, idx) => {
        const delivery = deliveries[idx];
        const customFields = toStringMap(contact.customFields);
        const variables = variableSchema.reduce<Record<string, string>>((acc, variable) => {
          const fromCustom = customFields[variable.name];
          if (typeof fromCustom === "string" && fromCustom.trim().length > 0) {
            acc[variable.name] = fromCustom;
            return acc;
          }
          if (variable.name === "email") {
            acc[variable.name] = contact.email;
            return acc;
          }
          if (variable.name === "firstName") {
            acc[variable.name] = contact.firstName ?? variable.default;
            return acc;
          }
          if (variable.name === "lastName") {
            acc[variable.name] = contact.lastName ?? variable.default;
            return acc;
          }
          acc[variable.name] = variable.default;
          return acc;
        }, {});

        const renderedHtml = this.reactToHtml.renderComponent(component, variables);
        const plan = campaign.workspace.billingSubscription?.plan ?? "FREE";
        const composedHtml = `${renderedHtml}${buildComplianceFooter(campaign.workspace, contact, delivery.id, plan === "FREE")}`;
        return { contact, delivery, composedHtml };
      });

      const newUrls = new Set<string>();
      for (const item of prepared) {
        for (const href of collectTrackableHrefs(item.composedHtml)) {
          if (!trackedLinkCache.has(href)) newUrls.add(href);
        }
      }
      if (newUrls.size > 0) {
        for (const url of newUrls) {
          const created = await this.prisma.trackedLink.create({
            data: {
              workspaceId: job.data.workspaceId,
              campaignId: campaign.id,
              url,
            },
            select: { id: true, url: true },
          });
          trackedLinkCache.set(created.url, created.id);
        }
      }

      const batch: SendBatchItem[] = prepared.map(({ contact, delivery, composedHtml }) => {
        const deliveryId = delivery.id;
        const unsubscribeToken = encodeUnsubscribeToken(
          {
            contactId: contact.id,
            campaignId: campaign.id,
            deliveryId,
          },
          secret,
        );
        const unsubscribeUrl = `${appUrl}/unsubscribe/${unsubscribeToken}`;

        const html = rewriteAnchorsAndInjectPixel(composedHtml, {
          deliveryId,
          secret,
          trackingBaseUrl,
          resolveLinkId: (url) => trackedLinkCache.get(url) ?? null,
        });

        return {
          from: `${campaign.fromName} <${fromEmail}>`,
          to: contact.email,
          subject: variant.subject,
          html,
          replyTo: campaign.replyTo ?? undefined,
          headers: {
            "List-Unsubscribe": `<${unsubscribeUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        };
      });

      await this.applyRateLimit(maxPerSecond, batch.length);

      const result = await this.sender.sendBatch(batch);
      const sentAt = new Date();
      await this.prisma.$transaction(
        deliveries.map((delivery, idx) =>
          this.prisma.campaignDelivery.update({
            where: { id: delivery.id },
            data: {
              messageId: result.messageIds[idx] ?? null,
              status: "SENT",
              sentAt,
            },
          }),
        ),
      );

        this.logger.log(`campaign ${campaign.id} sent chunk ${i / CHUNK_SIZE + 1}`);
      }

      await this.prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: "SENT", sentAt: new Date() },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `campaign ${campaign.id} send failed: ${message}`,
        error instanceof Error ? error.stack : undefined,
      );
      await this.prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: "DRAFT" },
      });
      throw error;
    }
  }

  private async loadTrackedLinkCache(
    workspaceId: string,
    campaignId: string,
  ): Promise<Map<string, string>> {
    const rows = await this.prisma.trackedLink.findMany({
      where: { workspaceId, campaignId },
      select: { id: true, url: true },
    });
    const map = new Map<string, string>();
    for (const row of rows) map.set(row.url, row.id);
    return map;
  }

  private async applyRateLimit(maxPerSecond: number, batchSize: number): Promise<void> {
    if (maxPerSecond <= 0 || batchSize <= maxPerSecond) return;
    const minDurationMs = Math.ceil((batchSize / maxPerSecond) * 1000);
    await new Promise((resolve) => setTimeout(resolve, minDurationMs));
  }

  private resolveTrackingBaseUrl(): string {
    const nodeEnv = this.config.get<string>("NODE_ENV") ?? "development";
    const explicitTrackingUrl = trimTrailingSlash(this.config.get<string>("TRACKING_URL"));
    if (explicitTrackingUrl) {
      this.assertPublicTrackingUrl(explicitTrackingUrl, nodeEnv);
      return explicitTrackingUrl;
    }

    const backendUrl = trimTrailingSlash(this.config.get<string>("BACKEND_URL"));
    if (backendUrl) {
      this.assertPublicTrackingUrl(backendUrl, nodeEnv);
      return `${backendUrl}/api/v1`;
    }

    if (nodeEnv !== "development" && nodeEnv !== "test") {
      throw new InternalServerErrorException(
        "TRACKING_URL or BACKEND_URL must be configured before sending campaigns. Refusing to send localhost tracking links.",
      );
    }

    const localUrl = `http://localhost:${this.config.get<string>("PORT") ?? "4000"}/api/v1`;
    this.logger.warn(
      `TRACKING_URL/BACKEND_URL is not configured. Campaign links will use ${localUrl}. This only works for local testing.`,
    );
    return localUrl;
  }

  private assertPublicTrackingUrl(url: string, nodeEnv: string): void {
    if ((nodeEnv === "development" || nodeEnv === "test") && isLocalUrl(url)) return;
    if (!isLocalUrl(url)) return;
    throw new InternalServerErrorException(
      "TRACKING_URL/BACKEND_URL cannot point to localhost outside development. Use the public backend URL that exposes /api/v1/t/*.",
    );
  }
}

function toStringMap(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (typeof entry === "string") result[key] = entry;
  }
  return result;
}

function trimTrailingSlash(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return trimmed.replace(/\/+$/, "");
}

function isLocalUrl(value: string): boolean {
  try {
    const hostname = new URL(value).hostname;
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0" || hostname === "::1";
  } catch {
    return false;
  }
}
