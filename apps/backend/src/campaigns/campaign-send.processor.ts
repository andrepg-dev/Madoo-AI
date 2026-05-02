import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
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
          select: { name: true, postalAddress: true },
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

      const batch: SendBatchItem[] = chunk.map((contact, idx) => {
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

        // TODO(phase4): Inject tracking pixel before provider send.
        // TODO(phase4): Rewrite anchor hrefs to tracking redirect endpoints.
        const html = `${renderedHtml}${buildComplianceFooter(campaign.workspace, contact, delivery.id)}`;

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
      await this.prisma.$transaction(
        deliveries.map((delivery, idx) =>
          this.prisma.campaignDelivery.update({
            where: { id: delivery.id },
            data: {
              messageId: result.messageIds[idx] ?? null,
              status: "SENT",
              sentAt: new Date(),
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

  private async applyRateLimit(maxPerSecond: number, batchSize: number): Promise<void> {
    if (maxPerSecond <= 0 || batchSize <= maxPerSecond) return;
    const minDurationMs = Math.ceil((batchSize / maxPerSecond) * 1000);
    await new Promise((resolve) => setTimeout(resolve, minDurationMs));
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
