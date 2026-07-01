import { Controller, Get, UseGuards } from "@nestjs/common";
import { AdminGuard } from "../auth/admin.guard";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AdminAnalyticsService } from "./admin-analytics.service";
import { AdminRetentionService } from "./admin-retention.service";

@Controller({ path: "admin/analytics", version: "1" })
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminAnalyticsController {
  constructor(
    private readonly analytics: AdminAnalyticsService,
    private readonly retention: AdminRetentionService,
  ) {}

  @Get("dashboard")
  dashboard() {
    return this.analytics.dashboard();
  }

  @Get("retention")
  retentionOverview() {
    return this.retention.overview();
  }
}
