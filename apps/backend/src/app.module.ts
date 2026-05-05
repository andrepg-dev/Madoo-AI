import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerModule } from "@nestjs/throttler";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { PromptsModule } from "./prompts/prompts.module";
import { WorkspacesModule } from "./workspaces/workspaces.module";
import { EmailsModule } from "./emails/emails.module";
import { TemplatesModule } from "./templates/templates.module";
import { ContactsModule } from "./contacts/contacts.module";
import { TagsModule } from "./tags/tags.module";
import { SegmentsModule } from "./segments/segments.module";
import { DomainsModule } from "./domains/domains.module";
import { CampaignsModule } from "./campaigns/campaigns.module";
import { UnsubscribeModule } from "./unsubscribe/unsubscribe.module";
import { AuditLogsModule } from "./audit-logs/audit-logs.module";
import { TrackingModule } from "./tracking/tracking.module";
import { AnalyticsModule } from "./analytics/analytics.module";
import { WebhooksModule } from "./webhooks/webhooks.module";
import { HealthController } from "./health.controller";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.SEND_THROTTLE_TTL_MS ?? "1000"),
        limit: Number(process.env.SEND_THROTTLE_LIMIT ?? "5"),
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    WorkspacesModule,
    PromptsModule,
    EmailsModule,
    TemplatesModule,
    ContactsModule,
    TagsModule,
    SegmentsModule,
    DomainsModule,
    CampaignsModule,
    UnsubscribeModule,
    AuditLogsModule,
    TrackingModule,
    AnalyticsModule,
    WebhooksModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
