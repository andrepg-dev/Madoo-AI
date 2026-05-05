import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

const PIXEL_BUFFER = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  constructor(private readonly prisma: PrismaService) {}

  pixelBytes(): Buffer {
    return PIXEL_BUFFER;
  }

  async recordOpen(deliveryId: string): Promise<void> {
    const delivery = await this.prisma.campaignDelivery.findUnique({
      where: { id: deliveryId },
      select: {
        id: true,
        campaignId: true,
        contactId: true,
        openedAt: true,
        status: true,
        campaign: { select: { workspaceId: true } },
      },
    });
    if (!delivery) return;

    try {
      await this.prisma.event.create({
        data: {
          workspaceId: delivery.campaign.workspaceId,
          campaignId: delivery.campaignId,
          contactId: delivery.contactId,
          deliveryId: delivery.id,
          type: "OPENED",
        },
      });
    } catch (error) {
      this.logger.warn(`recordOpen event create failed: ${(error as Error).message}`);
    }

    if (!delivery.openedAt) {
      await this.prisma.campaignDelivery.update({
        where: { id: delivery.id },
        data: {
          openedAt: new Date(),
          status: delivery.status === "CLICKED" ? "CLICKED" : "OPENED",
        },
      });
    }
  }

  async resolveClick(
    deliveryId: string,
    trackedLinkId: string,
  ): Promise<{ url: string } | null> {
    const link = await this.prisma.trackedLink.findUnique({
      where: { id: trackedLinkId },
      select: { id: true, url: true, campaignId: true, workspaceId: true },
    });
    if (!link) return null;

    const delivery = await this.prisma.campaignDelivery.findUnique({
      where: { id: deliveryId },
      select: {
        id: true,
        campaignId: true,
        contactId: true,
        clickedAt: true,
      },
    });
    if (!delivery || delivery.campaignId !== link.campaignId) {
      return { url: link.url };
    }

    try {
      await this.prisma.$transaction([
        this.prisma.event.create({
          data: {
            workspaceId: link.workspaceId,
            campaignId: link.campaignId,
            contactId: delivery.contactId,
            deliveryId: delivery.id,
            type: "CLICKED",
            data: { trackedLinkId: link.id, url: link.url },
          },
        }),
        this.prisma.trackedLink.update({
          where: { id: link.id },
          data: { clicks: { increment: 1 } },
        }),
      ]);
    } catch (error) {
      this.logger.warn(`resolveClick event create failed: ${(error as Error).message}`);
    }

    if (!delivery.clickedAt) {
      await this.prisma.campaignDelivery.update({
        where: { id: delivery.id },
        data: { clickedAt: new Date(), status: "CLICKED" },
      });
    }

    return { url: link.url };
  }
}
