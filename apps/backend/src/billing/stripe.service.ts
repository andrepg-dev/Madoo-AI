import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";
import type { StripeClient } from "./stripe-types";

/**
 * Thin wrapper around the Stripe SDK that keeps the rest of the code free
 * of `new Stripe(...)` calls and lets us treat Stripe as optional during
 * local development (when STRIPE_SECRET_KEY is missing the service surfaces
 * a clear error instead of crashing on boot).
 */
@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly client: StripeClient | null;

  constructor(private readonly config: ConfigService) {
    const key = this.config.get<string>("STRIPE_SECRET_KEY");
    if (!key) {
      this.logger.warn(
        "STRIPE_SECRET_KEY not set — billing endpoints will return 503 until configured",
      );
      this.client = null;
      return;
    }
    this.client = new Stripe(key, {
      apiVersion: "2026-04-22.dahlia",
      typescript: true,
    }) as unknown as StripeClient;
  }

  isEnabled(): boolean {
    return this.client !== null;
  }

  getClient(): StripeClient {
    if (!this.client) {
      throw new Error(
        "Stripe is not configured. Set STRIPE_SECRET_KEY to enable billing.",
      );
    }
    return this.client;
  }
}
