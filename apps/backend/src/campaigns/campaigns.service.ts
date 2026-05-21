import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { ConfigService } from "@nestjs/config";
import { SegmentQuerySchema, parseVariableSchemaJson, type CampaignRecipient } from "@madoo/shared";
import type { Queue } from "bullmq";
import { PrismaService } from "../prisma/prisma.service";
import { WorkspacesService } from "../workspaces/workspaces.service";
import { BillingService } from "../billing/billing.service";
import { ReactToHtmlService } from "../generation/react-to-html.service";
import {
  SENDING_PROVIDER,
  type SendingProvider,
} from "../sending/sending-provider.interface";
import { buildComplianceFooter } from "../sending/footer";
import { encodeUnsubscribeToken } from "../sending/unsubscribe-token";
import { buildPrismaWhere } from "../segments/segment-query";
import {
  CAMPAIGN_SEND_JOB,
  CAMPAIGN_SEND_QUEUE,
  type CampaignSendJobPayload,
} from "./campaign-send.types";
import type { CreateCampaignDto } from "./dto/create-campaign.dto";
import type { UpdateCampaignDto } from "./dto/update-campaign.dto";
import { toCampaignRecipientDto } from "./dto/campaign-recipient.dto";
import { toCampaignDto, type CampaignDto } from "./dto/campaign.dto";
import {
  resolveVariableValue,
  sanitizeVariableMapping,
  toStringMap,
} from "./variable-mapping";

@Injectable()
export class CampaignsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaces: WorkspacesService,
    private readonly billing: BillingService,
    private readonly reactToHtml: ReactToHtmlService,
    private readonly config: ConfigService,
    @Inject(SENDING_PROVIDER) private readonly sender: SendingProvider,
    @InjectQueue(CAMPAIGN_SEND_QUEUE) private readonly sendQueue: Queue,
  ) {}

  async create(workspaceId: string, userId: string, dto: CreateCampaignDto): Promise<CampaignDto> {
    await this.workspaces.assertMembership(userId, workspaceId);
    await this.assertEmailInWorkspace(workspaceId, dto.emailId);
    await this.assertSegmentInWorkspace(workspaceId, dto.segmentId);
    const row = await this.prisma.campaign.create({
      data: {
        workspaceId,
        emailId: dto.emailId,
        segmentId: dto.segmentId,
        fromName: dto.fromName.trim(),
        fromEmail: dto.fromEmail.trim().toLowerCase(),
        replyTo: dto.replyTo?.trim().toLowerCase() || null,
        abTest: dto.abTest ?? false,
        scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : null,
        variableMapping: sanitizeVariableMapping(dto.variableMapping),
        status: dto.scheduledFor ? "SCHEDULED" : "DRAFT",
      },
    });
    return toCampaignDto(row);
  }

  async list(workspaceId: string, userId: string): Promise<CampaignDto[]> {
    await this.workspaces.assertMembership(userId, workspaceId);
    const rows = await this.prisma.campaign.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((row) => toCampaignDto(row));
  }

  async getById(workspaceId: string, userId: string, campaignId: string): Promise<CampaignDto> {
    await this.workspaces.assertMembership(userId, workspaceId);
    const row = await this.prisma.campaign.findFirst({
      where: { id: campaignId, workspaceId },
    });
    if (!row) throw new NotFoundException("Campaign not found.");
    return toCampaignDto(row);
  }

  async listRecipients(
    workspaceId: string,
    userId: string,
    campaignId: string,
  ): Promise<CampaignRecipient[]> {
    await this.workspaces.assertMembership(userId, workspaceId);
    const exists = await this.prisma.campaign.findFirst({
      where: { id: campaignId, workspaceId },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException("Campaign not found.");

    const rows = await this.prisma.campaignDelivery.findMany({
      where: {
        campaignId,
        campaign: { workspaceId },
      },
      include: {
        contact: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            workspaceId: true,
          },
        },
      },
      orderBy: [{ sentAt: "desc" }, { createdAt: "asc" }],
    });

    return rows
      .filter((row) => row.contact.workspaceId === workspaceId)
      .map((row) => toCampaignRecipientDto(row));
  }

  async update(
    workspaceId: string,
    userId: string,
    campaignId: string,
    dto: UpdateCampaignDto,
  ): Promise<CampaignDto> {
    await this.workspaces.assertMembership(userId, workspaceId);
    await this.assertCampaign(workspaceId, campaignId);
    if (dto.emailId) await this.assertEmailInWorkspace(workspaceId, dto.emailId);
    if (dto.segmentId) await this.assertSegmentInWorkspace(workspaceId, dto.segmentId);

    const row = await this.prisma.campaign.update({
      where: { id: campaignId },
      data: {
        emailId: dto.emailId,
        segmentId: dto.segmentId,
        fromName: dto.fromName?.trim(),
        fromEmail: dto.fromEmail?.trim().toLowerCase(),
        replyTo: dto.replyTo !== undefined ? dto.replyTo.trim().toLowerCase() : undefined,
        abTest: dto.abTest,
        scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : undefined,
        variableMapping:
          dto.variableMapping !== undefined ? sanitizeVariableMapping(dto.variableMapping) : undefined,
      },
    });
    return toCampaignDto(row);
  }

  async remove(workspaceId: string, userId: string, campaignId: string): Promise<void> {
    await this.workspaces.assertMembership(userId, workspaceId);
    await this.assertCampaign(workspaceId, campaignId);
    await this.prisma.campaign.delete({ where: { id: campaignId } });
  }

  async sendTest(workspaceId: string, userId: string, campaignId: string, userEmail: string) {
    await this.workspaces.assertMembership(userId, workspaceId);
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, workspaceId },
    });
    if (!campaign) throw new NotFoundException("Campaign not found.");
    await this.assertWorkspacePostalAddress(workspaceId);
    await this.assertCampaignFromEmailUsesVerifiedDomain(workspaceId, campaign.fromEmail);

    const email = await this.prisma.email.findFirst({
      where: { id: campaign.emailId, workspaceId },
      include: {
        variants: {
          orderBy: { seq: "desc" },
          take: 1,
        },
      },
    });
    if (!email) throw new NotFoundException("Email not found.");
    const variant = email.variants[0];
    if (!variant) throw new NotFoundException("Email has no generated variant.");

    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { name: true, postalAddress: true },
    });
    if (!workspace) throw new NotFoundException("Workspace not found.");

    const testContact = await this.prisma.contact.upsert({
      where: {
        workspaceId_email: {
          workspaceId,
          email: userEmail.toLowerCase(),
        },
      },
      update: {},
      create: {
        workspaceId,
        email: userEmail.toLowerCase(),
        firstName: "Test",
        lastName: "Recipient",
      },
    });

    const component = this.reactToHtml.compileComponent(variant.componentCode);
    const variableMapping = sanitizeVariableMapping(campaign.variableMapping);
    const customFields = toStringMap(testContact.customFields);
    const variables = parseVariableSchemaJson(variant.variableSchema).variables.reduce<Record<string, string>>(
      (acc, variable) => {
        acc[variable.name] = resolveVariableValue(testContact, customFields, variable, variableMapping);
        return acc;
      },
      {},
    );

    const deliveryId = `${campaign.id}:test:${Date.now()}`;
    const unsubscribeToken = encodeUnsubscribeToken(
      {
        contactId: testContact.id,
        campaignId: campaign.id,
        deliveryId,
      },
      this.config.get<string>("JWT_SECRET") ?? "",
    );
    const unsubscribeUrl = `${this.config.get<string>("APP_URL") ?? "http://localhost:3000"}/unsubscribe/${unsubscribeToken}`;
    const htmlBody = this.reactToHtml.renderComponent(component, {
      ...variables,
      recipientName: "Test Recipient",
      appUrl: this.config.get<string>("APP_URL") ?? "http://localhost:3000",
    });
    const html = `${htmlBody}${buildComplianceFooter(workspace, testContact, deliveryId)}`;

    const senderDomain = this.config.get<string>("SENDING_DOMAIN") ?? "madooai.com";
    const fromEmail = campaign.fromEmail || `hello@${senderDomain}`;
    const result = await this.sender.sendBatch([
      {
        from: `${campaign.fromName} <${fromEmail}>`,
        to: userEmail,
        subject: variant.subject,
        html,
        replyTo: campaign.replyTo ?? undefined,
        headers: {
          "List-Unsubscribe": `<${unsubscribeUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      },
    ]);

    return {
      ok: true as const,
      messageId: result.messageIds[0] ?? null,
    };
  }

  async send(workspaceId: string, userId: string, campaignId: string) {
    await this.workspaces.assertMembership(userId, workspaceId);
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, workspaceId },
      include: {
        email: {
          include: {
            variants: {
              orderBy: { seq: "desc" },
              take: 1,
            },
          },
        },
        segment: {
          select: { query: true },
        },
      },
    });
    if (!campaign) throw new NotFoundException("Campaign not found.");
    if (campaign.status === "SENT") {
      throw new BadRequestException("This campaign has already been sent.");
    }
    if (campaign.status === "SENDING") {
      throw new BadRequestException("This campaign is already being sent.");
    }
    await this.assertWorkspacePostalAddress(workspaceId);
    await this.assertCampaignFromEmailUsesVerifiedDomain(workspaceId, campaign.fromEmail);

    const variant = campaign.email.variants[0];
    if (!variant) throw new BadRequestException("Email has no generated variant.");

    const where = buildPrismaWhere(workspaceId, SegmentQuerySchema.parse(campaign.segment.query));
    const suppressionEntries = await this.prisma.suppressionEntry.findMany({
      where: { workspaceId },
      select: { email: true },
    });
    const suppressedEmails = suppressionEntries.map((entry) => entry.email);
    const audienceCount = await this.prisma.contact.count({
      where: {
        AND: [
          where,
          { status: "ACTIVE" },
          ...(suppressedEmails.length > 0 ? [{ NOT: { email: { in: suppressedEmails } } }] : []),
        ],
      },
    });
    if (audienceCount <= 0) {
      throw new BadRequestException("Campaign audience is empty.");
    }
    await this.billing.assertCanSendCampaign(workspaceId, audienceCount);

    const payload: CampaignSendJobPayload = {
      workspaceId,
      campaignId,
      actorUserId: userId,
    };
    await this.sendQueue.add(CAMPAIGN_SEND_JOB, payload, {
      jobId: `${workspaceId}-${campaignId}`,
      removeOnComplete: true,
      removeOnFail: 20,
    });
    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: { status: "SENDING" },
    });
    await this.prisma.auditLog.create({
      data: {
        workspaceId,
        action: "campaign.send",
        actorUserId: userId,
        payload: { campaignId },
      },
    });

    return { ok: true as const, queued: true as const };
  }

  private async assertCampaign(workspaceId: string, campaignId: string): Promise<void> {
    const row = await this.prisma.campaign.findFirst({
      where: { id: campaignId, workspaceId },
      select: { id: true },
    });
    if (!row) throw new NotFoundException("Campaign not found.");
  }

  private async assertEmailInWorkspace(workspaceId: string, emailId: string): Promise<void> {
    const row = await this.prisma.email.findFirst({
      where: { id: emailId, workspaceId },
      select: { id: true },
    });
    if (!row) throw new NotFoundException("Email not found.");
  }

  private async assertSegmentInWorkspace(workspaceId: string, segmentId: string): Promise<void> {
    const row = await this.prisma.segment.findFirst({
      where: { id: segmentId, workspaceId },
      select: { id: true },
    });
    if (!row) throw new NotFoundException("Segment not found.");
  }

  private async assertWorkspacePostalAddress(workspaceId: string): Promise<void> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { postalAddress: true },
    });
    if (!workspace || !workspace.postalAddress?.trim()) {
      throw new BadRequestException("Workspace postal address is required before sending.");
    }
  }

  async enqueueScheduledCampaigns(): Promise<void> {
    const due = await this.prisma.campaign.findMany({
      where: { status: "SCHEDULED", scheduledFor: { lte: new Date() } },
      select: { id: true, workspaceId: true },
    });
    for (const campaign of due) {
      const updated = await this.prisma.campaign.updateMany({
        where: { id: campaign.id, status: "SCHEDULED" },
        data: { status: "SENDING" },
      });
      if (updated.count === 0) continue;
      const payload: CampaignSendJobPayload = {
        workspaceId: campaign.workspaceId,
        campaignId: campaign.id,
        actorUserId: "scheduler",
      };
      await this.sendQueue.add(CAMPAIGN_SEND_JOB, payload, {
        jobId: `${campaign.workspaceId}-${campaign.id}`,
        removeOnComplete: true,
        removeOnFail: 20,
      });
    }
  }

  private async assertCampaignFromEmailUsesVerifiedDomain(
    workspaceId: string,
    fromEmail: string,
  ): Promise<void> {
    const madooDomain = (this.config.get<string>("SENDING_DOMAIN") ?? "madooai.com").toLowerCase();
    const fromDomain = fromEmail.split("@")[1]?.toLowerCase();
    if (fromDomain === madooDomain) return;

    const verified = await this.prisma.domain.findMany({
      where: { workspaceId, status: "VERIFIED" },
      select: { hostname: true },
    });
    const allowed = new Set(verified.map((d) => d.hostname.toLowerCase()));
    if (!fromDomain || !allowed.has(fromDomain)) {
      const list = verified.map((d) => d.hostname).join(", ");
      throw new BadRequestException(
        list
          ? `Campaign "From" address (${fromEmail}) must use a verified domain. Verified: ${list}.`
          : "A verified sending domain is required before sending. Verify a domain in Domains.",
      );
    }
  }
}
