import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Logger,
  Post,
  RawBodyRequest,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request } from "express";
import { verifyResendSignature } from "./resend-signature";
import { ResendWebhookService } from "./resend-webhook.service";

@Controller({ path: "webhooks/resend", version: "1" })
export class ResendWebhookController {
  private readonly logger = new Logger(ResendWebhookController.name);

  constructor(
    private readonly config: ConfigService,
    private readonly service: ResendWebhookService,
  ) {}

  @Post()
  @HttpCode(200)
  async handle(
    @Req() req: RawBodyRequest<Request>,
    @Headers("svix-id") svixId: string,
    @Headers("svix-timestamp") svixTimestamp: string,
    @Headers("svix-signature") svixSignature: string,
    @Body() body: unknown,
  ): Promise<{ ok: true }> {
    const secret = this.config.get<string>("RESEND_WEBHOOK_SECRET");
    if (secret) {
      const rawBody = req.rawBody?.toString("utf8") ?? "";
      const ok = verifyResendSignature({
        rawBody,
        svixId: svixId ?? null,
        svixTimestamp: svixTimestamp ?? null,
        svixSignature: svixSignature ?? null,
        secret,
      });
      if (!ok) {
        this.logger.warn("rejected resend webhook with invalid signature");
        throw new UnauthorizedException("Invalid webhook signature.");
      }
    } else {
      this.logger.warn("RESEND_WEBHOOK_SECRET not set — accepting webhook without verification");
    }

    await this.service.handle(body);
    return { ok: true };
  }
}
