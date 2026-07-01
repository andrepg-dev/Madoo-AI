import { Module } from "@nestjs/common";
import { AdminGuard } from "../auth/admin.guard";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { AdminAnalyticsController } from "./admin-analytics.controller";
import { AdminAnalyticsService } from "./admin-analytics.service";
import { AdminEmailsController } from "./admin-emails.controller";
import { AdminEmailsService } from "./admin-emails.service";
import { AdminRetentionService } from "./admin-retention.service";

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [AdminAnalyticsController, AdminEmailsController],
  providers: [
    AdminAnalyticsService,
    AdminEmailsService,
    AdminRetentionService,
    AdminGuard,
  ],
})
export class AdminAnalyticsModule {}
