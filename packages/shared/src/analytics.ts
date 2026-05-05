import { z } from "zod";

const IsoDateTimeSchema = z.string().datetime();

export const EventTypeSchema = z.enum([
  "DELIVERED",
  "OPENED",
  "CLICKED",
  "BOUNCED",
  "COMPLAINED",
  "UNSUBSCRIBED",
]);
export type EventType = z.infer<typeof EventTypeSchema>;

export const CampaignStatsSchema = z.object({
  campaignId: z.string().min(1),
  totalRecipients: z.number().int().nonnegative(),
  delivered: z.number().int().nonnegative(),
  opened: z.number().int().nonnegative(),
  uniqueOpens: z.number().int().nonnegative(),
  clicked: z.number().int().nonnegative(),
  uniqueClicks: z.number().int().nonnegative(),
  bounced: z.number().int().nonnegative(),
  complained: z.number().int().nonnegative(),
  unsubscribed: z.number().int().nonnegative(),
  deliveryRate: z.number().min(0).max(1),
  openRate: z.number().min(0).max(1),
  clickRate: z.number().min(0).max(1),
  clickToOpenRate: z.number().min(0).max(1),
  bounceRate: z.number().min(0).max(1),
  unsubscribeRate: z.number().min(0).max(1),
  sentAt: IsoDateTimeSchema.nullable(),
});
export type CampaignStatsDto = z.infer<typeof CampaignStatsSchema>;

export const OpensTimeseriesPointSchema = z.object({
  bucket: IsoDateTimeSchema,
  cumulativeOpens: z.number().int().nonnegative(),
  cumulativeOpenRate: z.number().min(0).max(1),
  hoursSinceSend: z.number().nonnegative(),
});
export type OpensTimeseriesPoint = z.infer<typeof OpensTimeseriesPointSchema>;

export const TopLinkSchema = z.object({
  url: z.string().min(1),
  clicks: z.number().int().nonnegative(),
  uniqueClicks: z.number().int().nonnegative(),
  share: z.number().min(0).max(1),
});
export type TopLink = z.infer<typeof TopLinkSchema>;

export const DeliveryBreakdownSchema = z.object({
  pending: z.number().int().nonnegative(),
  sent: z.number().int().nonnegative(),
  opened: z.number().int().nonnegative(),
  clicked: z.number().int().nonnegative(),
  bounced: z.number().int().nonnegative(),
  unsubscribed: z.number().int().nonnegative(),
  complained: z.number().int().nonnegative(),
});
export type DeliveryBreakdown = z.infer<typeof DeliveryBreakdownSchema>;

export const CampaignAnalyticsSchema = z.object({
  stats: CampaignStatsSchema,
  opensTimeseries: z.array(OpensTimeseriesPointSchema),
  topLinks: z.array(TopLinkSchema),
  deliveryBreakdown: DeliveryBreakdownSchema,
});
export type CampaignAnalyticsDto = z.infer<typeof CampaignAnalyticsSchema>;

export const WorkspaceOverviewCampaignSchema = z.object({
  campaignId: z.string().min(1),
  emailTitle: z.string().nullable(),
  subject: z.string().nullable(),
  sentAt: IsoDateTimeSchema.nullable(),
  totalRecipients: z.number().int().nonnegative(),
  openRate: z.number().min(0).max(1),
  clickRate: z.number().min(0).max(1),
});
export type WorkspaceOverviewCampaign = z.infer<typeof WorkspaceOverviewCampaignSchema>;

export const WorkspaceOverviewSchema = z.object({
  totals: z.object({
    campaignsSent: z.number().int().nonnegative(),
    delivered: z.number().int().nonnegative(),
    opened: z.number().int().nonnegative(),
    clicked: z.number().int().nonnegative(),
    unsubscribed: z.number().int().nonnegative(),
    bounced: z.number().int().nonnegative(),
    totalRecipients: z.number().int().nonnegative(),
  }),
  averages: z.object({
    openRate: z.number().min(0).max(1),
    clickRate: z.number().min(0).max(1),
    bounceRate: z.number().min(0).max(1),
    unsubscribeRate: z.number().min(0).max(1),
  }),
  topLinks: z.array(TopLinkSchema),
  deliveryBreakdown: DeliveryBreakdownSchema,
  recentCampaigns: z.array(WorkspaceOverviewCampaignSchema),
});
export type WorkspaceOverviewDto = z.infer<typeof WorkspaceOverviewSchema>;
