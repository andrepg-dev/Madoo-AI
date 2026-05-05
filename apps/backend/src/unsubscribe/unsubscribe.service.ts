import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { decodeUnsubscribeToken } from "../sending/unsubscribe-token";

@Injectable()
export class UnsubscribeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async unsubscribe(token: string): Promise<{ ok: true }> {
    const secret = this.config.get<string>("JWT_SECRET") ?? "";
    const payload = decodeUnsubscribeToken(token, secret);
    if (!payload) throw new BadRequestException("Invalid unsubscribe token.");

    const campaign = await this.prisma.campaign.findUnique({
      where: { id: payload.campaignId },
      select: { workspaceId: true },
    });
    if (!campaign) throw new BadRequestException("Invalid unsubscribe token.");

    const contact = await this.prisma.contact.findFirst({
      where: { id: payload.contactId, workspaceId: campaign.workspaceId },
      select: { id: true, email: true, workspaceId: true },
    });
    if (!contact) throw new BadRequestException("Invalid unsubscribe token.");

    await this.prisma.$transaction([
      this.prisma.contact.update({
        where: { id: contact.id },
        data: { status: "UNSUBSCRIBED" },
      }),
      this.prisma.suppressionEntry.upsert({
        where: {
          workspaceId_email: {
            workspaceId: contact.workspaceId,
            email: contact.email,
          },
        },
        update: { reason: "UNSUBSCRIBED" },
        create: {
          workspaceId: contact.workspaceId,
          email: contact.email,
          reason: "UNSUBSCRIBED",
        },
      }),
      this.prisma.campaignDelivery.update({
        where: { id: payload.deliveryId },
        data: { status: "UNSUBSCRIBED", unsubscribedAt: new Date() },
      }),
      this.prisma.event.create({
        data: {
          workspaceId: contact.workspaceId,
          campaignId: payload.campaignId,
          contactId: contact.id,
          deliveryId: payload.deliveryId,
          type: "UNSUBSCRIBED",
        },
      }),
    ]);

    return { ok: true };
  }
}
