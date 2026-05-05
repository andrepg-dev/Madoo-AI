import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "../prisma/prisma.module";
import { ResendWebhookController } from "./resend-webhook.controller";
import { ResendWebhookService } from "./resend-webhook.service";

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [ResendWebhookController],
  providers: [ResendWebhookService],
})
export class WebhooksModule {}
