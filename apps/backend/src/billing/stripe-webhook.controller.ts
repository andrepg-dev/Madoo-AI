import {
  BadRequestException,
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
import { BillingService } from "./billing.service";
import { StripeService } from "./stripe.service";
import type { StripeEvent } from "./stripe-types";

@Controller({ path: "webhooks/stripe", version: "1" })
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(
    private readonly stripe: StripeService,
    private readonly billing: BillingService,
    private readonly config: ConfigService,
  ) {}

  @Post()
  @HttpCode(200)
  async handle(
    @Req() req: RawBodyRequest<Request>,
    @Headers("stripe-signature") signature: string,
  ): Promise<{ received: true }> {
    if (!this.stripe.isEnabled()) {
      this.logger.warn("stripe webhook hit but STRIPE_SECRET_KEY is unset");
      throw new BadRequestException("Stripe is not configured.");
    }
    const secret = this.config.get<string>("STRIPE_WEBHOOK_SECRET");
    if (!secret) {
      this.logger.warn(
        "STRIPE_WEBHOOK_SECRET unset — refusing to process webhook to avoid spoofing",
      );
      throw new BadRequestException("Stripe webhook is not configured.");
    }
    if (!signature) {
      throw new UnauthorizedException("Missing stripe-signature header.");
    }
    const raw = req.rawBody?.toString("utf8") ?? "";

    let event: StripeEvent;
    try {
      event = this.stripe
        .getClient()
        .webhooks.constructEvent(raw, signature, secret) as unknown as StripeEvent;
    } catch (err) {
      this.logger.warn(
        `rejected stripe webhook: ${err instanceof Error ? err.message : "unknown"}`,
      );
      throw new UnauthorizedException("Invalid webhook signature.");
    }

    try {
      await this.billing.applyStripeEvent(event);
    } catch (err) {
      this.logger.error(
        `stripe webhook handler failed for ${event.type}`,
        err instanceof Error ? err.stack : undefined,
      );
      // Return 200 so Stripe doesn't retry on logic errors that won't recover.
      // Persistent failures should be observed via Sentry / pino logs.
    }

    return { received: true };
  }
}
