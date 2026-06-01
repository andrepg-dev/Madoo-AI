import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { LoggerModule } from "nestjs-pino";
import { AssistantModule } from "./assistant/assistant.module";
import { AuditLogsModule } from "./audit-logs/audit-logs.module";
import { AuthModule } from "./auth/auth.module";
import { BillingModule } from "./billing/billing.module";
import { EmailsModule } from "./emails/emails.module";
import { HealthController } from "./health.controller";
import { PrismaModule } from "./prisma/prisma.module";
import { PromptsModule } from "./prompts/prompts.module";
import { TemplatesModule } from "./templates/templates.module";
import { UsersModule } from "./users/users.module";
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
    PrismaModule,
    AuthModule,
    UsersModule,
    WorkspacesModule,
    PromptsModule,
    EmailsModule,
    TemplatesModule,
    AuditLogsModule,
    AssistantModule,
    BillingModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
