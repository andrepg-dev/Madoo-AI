import { Module } from "@nestjs/common";
import { AdminGuard } from "../auth/admin.guard";
import { AuthModule } from "../auth/auth.module";
import { PrismaModule } from "../prisma/prisma.module";
import { AdminAnalyticsController } from "./admin-analytics.controller";
import { AdminAnalyticsService } from "./admin-analytics.service";

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [AdminAnalyticsController],
  providers: [AdminAnalyticsService, AdminGuard],
})
export class AdminAnalyticsModule {}
