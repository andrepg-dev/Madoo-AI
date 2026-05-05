import {
  CampaignAnalyticsSchema,
  WorkspaceOverviewSchema,
  type CampaignAnalyticsDto,
  type WorkspaceOverviewDto,
} from "@madoo/shared";
import { fetcher } from "@/lib/fetch";

export const analyticsKeys = {
  all: ["analytics"] as const,
  overview: () => [...analyticsKeys.all, "overview"] as const,
  campaign: (campaignId: string) => [...analyticsKeys.all, "campaign", campaignId] as const,
};

export type { CampaignAnalyticsDto, WorkspaceOverviewDto };

export const analyticsApi = {
  overview: async (): Promise<WorkspaceOverviewDto> => {
    const raw = await fetcher.get<unknown>("/analytics/overview");
    return WorkspaceOverviewSchema.parse(raw);
  },
  campaign: async (campaignId: string): Promise<CampaignAnalyticsDto> => {
    const raw = await fetcher.get<unknown>(`/analytics/campaigns/${campaignId}`);
    return CampaignAnalyticsSchema.parse(raw);
  },
};
