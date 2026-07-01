import { Module } from "@nestjs/common";
import { AdminGuard } from "../auth/admin.guard";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { AdminAnalyticsController } from "./admin-analytics.controller";
import { AdminAnalyticsService } from "./admin-analytics.service";
import { AdminEmailsController } from "./admin-emails.controller";
import { AdminEmailsService } from "./admin-emails.service";

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [AdminAnalyticsController, AdminEmailsController],
  providers: [AdminAnalyticsService, AdminEmailsService, AdminGuard],
})
export class AdminAnalyticsModule {}
