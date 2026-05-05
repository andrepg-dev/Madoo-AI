import { Injectable, NotFoundException } from "@nestjs/common";
import type {
  CampaignAnalyticsDto,
  CampaignStatsDto,
  DeliveryBreakdown,
  OpensTimeseriesPoint,
  TopLink,
  WorkspaceOverviewDto,
} from "@madoo/shared";
import { PrismaService } from "../prisma/prisma.service";

const DEFAULT_TIMESERIES_BUCKETS_HOURS = [0, 1, 2, 4, 8, 12, 24, 48, 72, 120, 168];

function safeRate(numerator: number, denominator: number): number {
  if (!denominator) return 0;
  const value = numerator / denominator;
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getCampaignAnalytics(
    workspaceId: string,
    campaignId: string,
  ): Promise<CampaignAnalyticsDto> {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, workspaceId },
      select: { id: true, sentAt: true },
    });
    if (!campaign) throw new NotFoundException("Campaign not found.");

    const [stats, opensTimeseries, topLinks, deliveryBreakdown] = await Promise.all([
      this.computeCampaignStats(workspaceId, campaignId, campaign.sentAt),
      this.computeOpensTimeseries(campaignId, campaign.sentAt),
      this.computeTopLinks(workspaceId, campaignId),
      this.computeDeliveryBreakdown(campaignId),
    ]);

    return { stats, opensTimeseries, topLinks, deliveryBreakdown };
  }

  async getWorkspaceOverview(workspaceId: string): Promise<WorkspaceOverviewDto> {
    const campaigns = await this.prisma.campaign.findMany({
      where: { workspaceId, status: "SENT" },
      orderBy: { sentAt: "desc" },
      select: {
        id: true,
        sentAt: true,
        email: { select: { title: true, prompt: true, variants: { orderBy: { seq: "desc" }, take: 1, select: { subject: true } } } },
      },
    });

    const recentStats = await Promise.all(
      campaigns.slice(0, 10).map(async (c) => {
        const stats = await this.computeCampaignStats(workspaceId, c.id, c.sentAt);
        return { campaign: c, stats };
      }),
    );

    const allCampaignIds = campaigns.map((c) => c.id);
    const [eventCounts, deliveryAggregate] = await Promise.all([
      this.prisma.event.groupBy({
        by: ["type"],
        where: { workspaceId, campaignId: { in: allCampaignIds } },
        _count: { _all: true },
      }),
      this.prisma.campaignDelivery.groupBy({
        by: ["status"],
        where: { campaignId: { in: allCampaignIds } },
        _count: { _all: true },
      }),
    ]);

    const eventCountByType = new Map<string, number>();
    for (const row of eventCounts) eventCountByType.set(row.type, row._count._all);
    const deliveryByStatus = new Map<string, number>();
    for (const row of deliveryAggregate) deliveryByStatus.set(row.status, row._count._all);

    const totalRecipients = sumValues(deliveryByStatus, [
      "PENDING",
      "SENT",
      "OPENED",
      "CLICKED",
      "BOUNCED",
      "UNSUBSCRIBED",
      "COMPLAINED",
    ]);
    const totalSent = sumValues(deliveryByStatus, ["SENT", "OPENED", "CLICKED", "BOUNCED", "UNSUBSCRIBED", "COMPLAINED"]);
    const totalDelivered = eventCountByType.get("DELIVERED") ?? totalSent - (eventCountByType.get("BOUNCED") ?? 0);
    const totalOpened = (deliveryByStatus.get("OPENED") ?? 0) + (deliveryByStatus.get("CLICKED") ?? 0);
    const totalClicked = deliveryByStatus.get("CLICKED") ?? 0;
    const totalUnsubscribed = deliveryByStatus.get("UNSUBSCRIBED") ?? 0;
    const totalBounced = deliveryByStatus.get("BOUNCED") ?? 0;

    const [topLinks, deliveryBreakdown] = await Promise.all([
      this.computeWorkspaceTopLinks(workspaceId, allCampaignIds),
      this.computeWorkspaceDeliveryBreakdown(allCampaignIds),
    ]);

    return {
      totals: {
        campaignsSent: campaigns.length,
        delivered: Math.max(0, totalDelivered),
        opened: totalOpened,
        clicked: totalClicked,
        unsubscribed: totalUnsubscribed,
        bounced: totalBounced,
        totalRecipients,
      },
      averages: {
        openRate: safeRate(totalOpened, Math.max(totalDelivered, totalSent)),
        clickRate: safeRate(totalClicked, Math.max(totalDelivered, totalSent)),
        bounceRate: safeRate(totalBounced, totalSent),
        unsubscribeRate: safeRate(totalUnsubscribed, totalSent),
      },
      topLinks,
      deliveryBreakdown,
      recentCampaigns: recentStats.map(({ campaign, stats }) => {
        const headline = campaign.email.title?.trim() || campaign.email.prompt.slice(0, 80);
        const subject = campaign.email.variants[0]?.subject ?? null;
        return {
          campaignId: campaign.id,
          emailTitle: headline || null,
          subject,
          sentAt: campaign.sentAt ? campaign.sentAt.toISOString() : null,
          totalRecipients: stats.totalRecipients,
          openRate: stats.openRate,
          clickRate: stats.clickRate,
        };
      }),
    };
  }

  async computeCampaignStats(
    workspaceId: string,
    campaignId: string,
    sentAt: Date | null,
  ): Promise<CampaignStatsDto> {
    const [deliveryAggregate, eventAggregate, uniqueOpens, uniqueClicks] = await Promise.all([
      this.prisma.campaignDelivery.groupBy({
        by: ["status"],
        where: { campaignId },
        _count: { _all: true },
      }),
      this.prisma.event.groupBy({
        by: ["type"],
        where: { workspaceId, campaignId },
        _count: { _all: true },
      }),
      this.prisma.campaignDelivery.count({
        where: { campaignId, openedAt: { not: null } },
      }),
      this.prisma.campaignDelivery.count({
        where: { campaignId, clickedAt: { not: null } },
      }),
    ]);

    const deliveryByStatus = new Map<string, number>();
    for (const row of deliveryAggregate) deliveryByStatus.set(row.status, row._count._all);
    const eventByType = new Map<string, number>();
    for (const row of eventAggregate) eventByType.set(row.type, row._count._all);

    const totalRecipients = sumValues(deliveryByStatus, [
      "PENDING",
      "SENT",
      "OPENED",
      "CLICKED",
      "BOUNCED",
      "UNSUBSCRIBED",
      "COMPLAINED",
    ]);
    const sent = sumValues(deliveryByStatus, [
      "SENT",
      "OPENED",
      "CLICKED",
      "BOUNCED",
      "UNSUBSCRIBED",
      "COMPLAINED",
    ]);
    const bounced = deliveryByStatus.get("BOUNCED") ?? 0;
    const delivered = Math.max(0, (eventByType.get("DELIVERED") ?? sent) - bounced);
    const opened = eventByType.get("OPENED") ?? 0;
    const clicked = eventByType.get("CLICKED") ?? 0;
    const complained = eventByType.get("COMPLAINED") ?? deliveryByStatus.get("COMPLAINED") ?? 0;
    const unsubscribed = eventByType.get("UNSUBSCRIBED") ?? deliveryByStatus.get("UNSUBSCRIBED") ?? 0;

    const denom = Math.max(delivered, sent);
    return {
      campaignId,
      totalRecipients,
      delivered,
      opened,
      uniqueOpens,
      clicked,
      uniqueClicks,
      bounced,
      complained,
      unsubscribed,
      deliveryRate: safeRate(delivered, sent),
      openRate: safeRate(uniqueOpens, denom),
      clickRate: safeRate(uniqueClicks, denom),
      clickToOpenRate: safeRate(uniqueClicks, uniqueOpens),
      bounceRate: safeRate(bounced, sent),
      unsubscribeRate: safeRate(unsubscribed, sent),
      sentAt: sentAt ? sentAt.toISOString() : null,
    };
  }

  private async computeOpensTimeseries(
    campaignId: string,
    sentAt: Date | null,
  ): Promise<OpensTimeseriesPoint[]> {
    if (!sentAt) return [];

    const totalDeliveries = await this.prisma.campaignDelivery.count({
      where: { campaignId, sentAt: { not: null } },
    });

    const opens = await this.prisma.event.findMany({
      where: { campaignId, type: "OPENED" },
      select: { createdAt: true, deliveryId: true },
      orderBy: { createdAt: "asc" },
    });

    const seenDeliveries = new Set<string>();
    const uniqueOpens: Date[] = [];
    for (const opn of opens) {
      const id = opn.deliveryId ?? "";
      if (id && seenDeliveries.has(id)) continue;
      if (id) seenDeliveries.add(id);
      uniqueOpens.push(opn.createdAt);
    }

    const sentMs = sentAt.getTime();
    return DEFAULT_TIMESERIES_BUCKETS_HOURS.map((hours) => {
      const cutoff = sentMs + hours * 3_600_000;
      const cumulative = uniqueOpens.filter((d) => d.getTime() <= cutoff).length;
      return {
        bucket: new Date(cutoff).toISOString(),
        cumulativeOpens: cumulative,
        cumulativeOpenRate: safeRate(cumulative, totalDeliveries),
        hoursSinceSend: hours,
      };
    });
  }

  private async computeTopLinks(workspaceId: string, campaignId: string): Promise<TopLink[]> {
    const links = await this.prisma.trackedLink.findMany({
      where: { workspaceId, campaignId },
      orderBy: { clicks: "desc" },
      take: 10,
    });
    if (links.length === 0) return [];

    const linkIds = links.map((l) => l.id);
    const uniqueByLink = new Map<string, Set<string>>();
    const events = await this.prisma.event.findMany({
      where: {
        campaignId,
        type: "CLICKED",
        deliveryId: { not: null },
      },
      select: { deliveryId: true, data: true },
    });
    for (const ev of events) {
      const data = ev.data as { trackedLinkId?: string } | null;
      const linkId = data?.trackedLinkId;
      if (!linkId || !linkIds.includes(linkId)) continue;
      const set = uniqueByLink.get(linkId) ?? new Set<string>();
      if (ev.deliveryId) set.add(ev.deliveryId);
      uniqueByLink.set(linkId, set);
    }

    const totalClicks = links.reduce((acc, l) => acc + l.clicks, 0);
    return links
      .filter((l) => l.clicks > 0)
      .map((l) => ({
        url: l.url,
        clicks: l.clicks,
        uniqueClicks: uniqueByLink.get(l.id)?.size ?? 0,
        share: safeRate(l.clicks, totalClicks),
      }));
  }

  private async computeWorkspaceTopLinks(
    workspaceId: string,
    campaignIds: string[],
  ): Promise<TopLink[]> {
    if (campaignIds.length === 0) return [];
    const links = await this.prisma.trackedLink.findMany({
      where: { workspaceId, campaignId: { in: campaignIds } },
      orderBy: { clicks: "desc" },
      take: 50,
    });
    if (links.length === 0) return [];

    const aggByUrl = new Map<string, { clicks: number; ids: string[] }>();
    for (const l of links) {
      const entry = aggByUrl.get(l.url) ?? { clicks: 0, ids: [] };
      entry.clicks += l.clicks;
      entry.ids.push(l.id);
      aggByUrl.set(l.url, entry);
    }

    const allIds = links.map((l) => l.id);
    const events = await this.prisma.event.findMany({
      where: {
        workspaceId,
        type: "CLICKED",
        deliveryId: { not: null },
        campaignId: { in: campaignIds },
      },
      select: { deliveryId: true, data: true },
    });
    const idToUrl = new Map<string, string>();
    for (const l of links) idToUrl.set(l.id, l.url);
    const uniqueByUrl = new Map<string, Set<string>>();
    for (const ev of events) {
      const data = ev.data as { trackedLinkId?: string } | null;
      const linkId = data?.trackedLinkId;
      if (!linkId || !allIds.includes(linkId)) continue;
      const url = idToUrl.get(linkId);
      if (!url || !ev.deliveryId) continue;
      const set = uniqueByUrl.get(url) ?? new Set<string>();
      set.add(ev.deliveryId);
      uniqueByUrl.set(url, set);
    }

    const totalClicks = Array.from(aggByUrl.values()).reduce((acc, v) => acc + v.clicks, 0);
    return Array.from(aggByUrl.entries())
      .filter(([, v]) => v.clicks > 0)
      .sort((a, b) => b[1].clicks - a[1].clicks)
      .slice(0, 10)
      .map(([url, v]) => ({
        url,
        clicks: v.clicks,
        uniqueClicks: uniqueByUrl.get(url)?.size ?? 0,
        share: safeRate(v.clicks, totalClicks),
      }));
  }

  private async computeWorkspaceDeliveryBreakdown(
    campaignIds: string[],
  ): Promise<DeliveryBreakdown> {
    if (campaignIds.length === 0) {
      return { pending: 0, sent: 0, opened: 0, clicked: 0, bounced: 0, unsubscribed: 0, complained: 0 };
    }
    const rows = await this.prisma.campaignDelivery.groupBy({
      by: ["status"],
      where: { campaignId: { in: campaignIds } },
      _count: { _all: true },
    });
    const map = new Map<string, number>();
    for (const row of rows) map.set(row.status, row._count._all);
    return {
      pending: map.get("PENDING") ?? 0,
      sent: map.get("SENT") ?? 0,
      opened: map.get("OPENED") ?? 0,
      clicked: map.get("CLICKED") ?? 0,
      bounced: map.get("BOUNCED") ?? 0,
      unsubscribed: map.get("UNSUBSCRIBED") ?? 0,
      complained: map.get("COMPLAINED") ?? 0,
    };
  }

  private async computeDeliveryBreakdown(campaignId: string): Promise<DeliveryBreakdown> {
    const rows = await this.prisma.campaignDelivery.groupBy({
      by: ["status"],
      where: { campaignId },
      _count: { _all: true },
    });
    const map = new Map<string, number>();
    for (const row of rows) map.set(row.status, row._count._all);
    return {
      pending: map.get("PENDING") ?? 0,
      sent: map.get("SENT") ?? 0,
      opened: map.get("OPENED") ?? 0,
      clicked: map.get("CLICKED") ?? 0,
      bounced: map.get("BOUNCED") ?? 0,
      unsubscribed: map.get("UNSUBSCRIBED") ?? 0,
      complained: map.get("COMPLAINED") ?? 0,
    };
  }
}

function sumValues(map: Map<string, number>, keys: string[]): number {
  let acc = 0;
  for (const key of keys) acc += map.get(key) ?? 0;
  return acc;
}
