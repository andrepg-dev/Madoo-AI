import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentWorkspace } from "../workspaces/current-workspace.decorator";
import { WorkspaceGuard, type WorkspaceContext } from "../workspaces/workspace.guard";
import { AnalyticsService } from "./analytics.service";

@Controller({ path: "analytics", version: "1" })
@UseGuards(JwtAuthGuard, WorkspaceGuard)
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get("overview")
  overview(@CurrentWorkspace() workspace: WorkspaceContext) {
    return this.analytics.getWorkspaceOverview(workspace.id);
  }

  @Get("campaigns/:campaignId")
  campaign(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Param("campaignId") campaignId: string,
  ) {
    return this.analytics.getCampaignAnalytics(workspace.id, campaignId);
  }
}
