import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerModule } from "@nestjs/throttler";
import { LoggerModule } from "nestjs-pino";
import { AnalyticsModule } from "./analytics/analytics.module";
import { AssistantModule } from "./assistant/assistant.module";
import { AuditLogsModule } from "./audit-logs/audit-logs.module";
import { AuthModule } from "./auth/auth.module";
import { BillingModule } from "./billing/billing.module";
import { CampaignsModule } from "./campaigns/campaigns.module";
import { ContactsModule } from "./contacts/contacts.module";
import { DomainsModule } from "./domains/domains.module";
import { EmailsModule } from "./emails/emails.module";
import { HealthController } from "./health.controller";
import { PrismaModule } from "./prisma/prisma.module";
import { PromptsModule } from "./prompts/prompts.module";
import { SegmentsModule } from "./segments/segments.module";
import { TagsModule } from "./tags/tags.module";
import { TemplatesModule } from "./templates/templates.module";
import { TrackingModule } from "./tracking/tracking.module";
import { UnsubscribeModule } from "./unsubscribe/unsubscribe.module";
import { UsersModule } from "./users/users.module";
import { WebhooksModule } from "./webhooks/webhooks.module";
import { WorkspacesModule } from "./workspaces/workspaces.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? "info",
        autoLogging: { ignore: (req) => req.url === "/api/v1/health" },
        // Redact sensitive fields so they never end up in our logs.
        redact: {
          paths: [
            "req.headers.authorization",
            "req.headers.cookie",
            'req.headers["x-workspace-id"]',
            'req.headers["stripe-signature"]',
            'req.headers["svix-signature"]',
            "res.headers['set-cookie']",
          ],
          censor: "[redacted]",
        },
        serializers: {
          req: (req) => ({
            id: req.id,
            method: req.method,
            url: req.url,
          }),
          res: (res) => ({ statusCode: res.statusCode }),
        },
        // Pretty-print in dev only; structured JSON in production.
        ...(process.env.NODE_ENV !== "production"
          ? {
              transport: {
                target: "pino-pretty",
                options: { singleLine: true, translateTime: "HH:MM:ss" },
              },
            }
          : {}),
      },
    }),
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
    AssistantModule,
    WebhooksModule,
    BillingModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
