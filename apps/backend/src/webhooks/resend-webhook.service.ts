import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

type ResendEventName =
  | "email.delivered"
  | "email.delivery_delayed"
  | "email.bounced"
  | "email.complained"
  | "email.opened"
  | "email.clicked";

type ResendWebhookPayload = {
  type?: string;
  created_at?: string;
  data?: {
    email_id?: string;
    bounce?: { type?: string };
    [key: string]: unknown;
  };
};

@Injectable()
export class ResendWebhookService {
  private readonly logger = new Logger(ResendWebhookService.name);

  constructor(private readonly prisma: PrismaService) {}

  async handle(body: unknown): Promise<void> {
    const payload = body as ResendWebhookPayload;
    const type = payload?.type as ResendEventName | undefined;
    const messageId = payload?.data?.email_id;
    if (!type || !messageId) {
      this.logger.warn(`resend webhook missing type or email_id: type=${type}`);
      return;
    }

    const delivery = await this.prisma.campaignDelivery.findFirst({
      where: { messageId },
      select: {
        id: true,
        campaignId: true,
        contactId: true,
        status: true,
        campaign: { select: { workspaceId: true } },
        contact: { select: { id: true, email: true, workspaceId: true } },
      },
    });
    if (!delivery) {
      this.logger.warn(`resend webhook for unknown messageId=${messageId}`);
      return;
    }

    const ctx = {
      workspaceId: delivery.campaign.workspaceId,
      campaignId: delivery.campaignId,
      contactId: delivery.contactId,
      deliveryId: delivery.id,
    };

    switch (type) {
      case "email.delivered":
        await this.prisma.event.create({
          data: { ...ctx, type: "DELIVERED", data: JSON.parse(JSON.stringify(payload.data ?? {}))},
        });
        return;
      case "email.bounced": {
        const bounceType = payload.data?.bounce?.type ?? "unknown";
        await this.prisma.event.create({
          data: { ...ctx, type: "BOUNCED", data: JSON.parse(JSON.stringify(payload.data ?? {}))},
        });
        await this.prisma.campaignDelivery.update({
          where: { id: delivery.id },
          data: { bouncedAt: new Date(), status: "BOUNCED" },
        });
        if (delivery.contact && bounceType.toLowerCase().includes("hard")) {
          await this.prisma.contact.update({
            where: { id: delivery.contact.id },
            data: { status: "BOUNCED" },
          });
          await this.prisma.suppressionEntry.upsert({
            where: {
              workspaceId_email: {
                workspaceId: delivery.contact.workspaceId,
                email: delivery.contact.email,
              },
            },
            update: { reason: "HARD_BOUNCE" },
            create: {
              workspaceId: delivery.contact.workspaceId,
              email: delivery.contact.email,
              reason: "HARD_BOUNCE",
            },
          });
        }
        return;
      }
      case "email.complained":
        await this.prisma.event.create({
          data: { ...ctx, type: "COMPLAINED", data: JSON.parse(JSON.stringify(payload.data ?? {}))},
        });
        await this.prisma.campaignDelivery.update({
          where: { id: delivery.id },
          data: { status: "COMPLAINED" },
        });
        if (delivery.contact) {
          await this.prisma.contact.update({
            where: { id: delivery.contact.id },
            data: { status: "COMPLAINED" },
          });
          await this.prisma.suppressionEntry.upsert({
            where: {
              workspaceId_email: {
                workspaceId: delivery.contact.workspaceId,
                email: delivery.contact.email,
              },
            },
            update: { reason: "COMPLAINED" },
            create: {
              workspaceId: delivery.contact.workspaceId,
              email: delivery.contact.email,
              reason: "COMPLAINED",
            },
          });
        }
        return;
      default:
        this.logger.log(`resend webhook ignored type=${type}`);
        return;
    }
  }
}
