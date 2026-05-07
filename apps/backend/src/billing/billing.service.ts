import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  PLAN_DISPLAY_NAMES,
  PLAN_LIMITS,
  type BillingOverviewDto,
  type Plan,
  type SubscriptionStatus,
} from "@madoo/shared";
import type { BillingSubscription, Plan as PrismaPlan } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { WorkspacesService } from "../workspaces/workspaces.service";
import { StripeService } from "./stripe.service";
import type {
  StripeCheckoutSession,
  StripeEvent,
  StripeInvoice,
  StripeSubscription,
  StripeSubscriptionStatus,
} from "./stripe-types";

const PLAN_TO_PRICE_ENV: Record<Exclude<Plan, "FREE">, Record<"MONTHLY" | "ANNUAL", string>> = {
  STARTER: { MONTHLY: "STRIPE_PRICE_STARTER", ANNUAL: "STRIPE_PRICE_STARTER_ANNUAL" },
  GROWTH: { MONTHLY: "STRIPE_PRICE_GROWTH", ANNUAL: "STRIPE_PRICE_GROWTH_ANNUAL" },
};

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaces: WorkspacesService,
    private readonly stripe: StripeService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Returns the current subscription for a workspace, lazily creating a
   * default FREE row if it does not exist yet (workspaces created before
   * billing landed).
   */
  async ensureSubscription(workspaceId: string): Promise<BillingSubscription> {
    const existing = await this.prisma.billingSubscription.findUnique({
      where: { workspaceId },
    });
    if (existing) return existing;
    return this.prisma.billingSubscription.create({
      data: { workspaceId, plan: "FREE", status: "ACTIVE" },
    });
  }

  async getOverview(
    workspaceId: string,
    userId: string,
  ): Promise<BillingOverviewDto> {
    await this.workspaces.assertMembership(userId, workspaceId);
    const subscription = await this.ensureSubscription(workspaceId);
    const plan = subscription.plan as Plan;
    const limits = PLAN_LIMITS[plan];

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [contactsUsed, generationsUsed] = await Promise.all([
      this.prisma.contact.count({ where: { workspaceId } }),
      this.prisma.emailGenerationRun.count({
        where: {
          workspaceId,
          kind: "INITIAL",
          status: { not: "FAILED" },
          createdAt: { gte: startOfMonth },
        },
      }),
    ]);

    return {
      subscription: {
        plan,
        status: subscription.status as SubscriptionStatus,
        currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        hasStripeCustomer: Boolean(subscription.stripeCustomerId),
      },
      usage: {
        contacts: { used: contactsUsed, limit: limits.contacts },
        aiGenerations: { used: generationsUsed, limit: limits.aiGenerations },
      },
      limits: { contacts: limits.contacts, aiGenerations: limits.aiGenerations },
    };
  }

  async assertCanGenerate(workspaceId: string): Promise<void> {
    const subscription = await this.ensureSubscription(workspaceId);
    const plan = subscription.plan as Plan;
    const limit = PLAN_LIMITS[plan].aiGenerations;
    if (limit === -1) return;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const used = await this.prisma.emailGenerationRun.count({
      where: {
        workspaceId,
        kind: "INITIAL",
        status: { not: "FAILED" },
        createdAt: { gte: startOfMonth },
      },
    });

    if (used >= limit) {
      throw new ForbiddenException(
        `AI generation limit reached: ${PLAN_DISPLAY_NAMES[plan]} plan allows ${limit} generations per month (used ${used}). Upgrade to generate more.`,
      );
    }
  }

  /**
   * Creates a Stripe Checkout Session for the given plan upgrade. Reuses
   * the workspace's `stripeCustomerId` if it exists; otherwise Stripe will
   * mint a new customer and we'll record it via the webhook.
   */
  async createCheckoutSession(
    workspaceId: string,
    userId: string,
    targetPlan: Exclude<Plan, "FREE">,
    interval: "MONTHLY" | "ANNUAL" = "MONTHLY",
  ): Promise<{ url: string }> {
    await this.workspaces.assertOwner(userId, workspaceId);
    if (!this.stripe.isEnabled()) {
      throw new ServiceUnavailableException(
        "Billing is not configured on this server.",
      );
    }

    const priceEnvKey = PLAN_TO_PRICE_ENV[targetPlan][interval];
    const priceId = this.config.get<string>(priceEnvKey);
    if (!priceId) {
      throw new ServiceUnavailableException(
        `Stripe price id for ${targetPlan} (${interval}) is not configured.`,
      );
    }

    const subscription = await this.ensureSubscription(workspaceId);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    const appUrl =
      this.config.get<string>("APP_URL") ?? "http://localhost:3000";

    const session = (await this.stripe.getClient().checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/settings/billing?upgraded=1`,
      cancel_url: `${appUrl}/settings/billing?canceled=1`,
      ...(subscription.stripeCustomerId
        ? { customer: subscription.stripeCustomerId }
        : {
            customer_email: user?.email ?? undefined,
            customer_creation: "always",
          }),
      client_reference_id: workspaceId,
      metadata: { workspaceId, plan: targetPlan, interval },
      subscription_data: {
        metadata: { workspaceId, plan: targetPlan, interval },
      },
      allow_promotion_codes: true,
    })) as unknown as StripeCheckoutSession;

    if (!session.url) {
      throw new BadRequestException("Stripe did not return a checkout URL.");
    }
    return { url: session.url };
  }

  async createPortalSession(
    workspaceId: string,
    userId: string,
  ): Promise<{ url: string }> {
    await this.workspaces.assertOwner(userId, workspaceId);
    if (!this.stripe.isEnabled()) {
      throw new ServiceUnavailableException(
        "Billing is not configured on this server.",
      );
    }
    const subscription = await this.ensureSubscription(workspaceId);
    if (!subscription.stripeCustomerId) {
      throw new BadRequestException(
        "Workspace has no Stripe customer yet — start a checkout first.",
      );
    }
    const appUrl =
      this.config.get<string>("APP_URL") ?? "http://localhost:3000";
    const session = await this.stripe
      .getClient()
      .billingPortal.sessions.create({
        customer: subscription.stripeCustomerId,
        return_url: `${appUrl}/settings/billing`,
      });
    return { url: session.url };
  }

  /**
   * Plan-limit guard for adding contacts. Returns the slack so import jobs
   * can decide whether to short-circuit with a partial error.
   */
  async assertCanAddContacts(
    workspaceId: string,
    additional: number,
  ): Promise<void> {
    const subscription = await this.ensureSubscription(workspaceId);
    const plan = subscription.plan as Plan;
    const limit = PLAN_LIMITS[plan].contacts;
    const used = await this.prisma.contact.count({ where: { workspaceId } });
    if (used + additional > limit) {
      throw new ForbiddenException(
        `Plan limit reached: ${plan} allows ${limit} contacts (using ${used}). Upgrade to add more.`,
      );
    }
  }

  async assertCanSendCampaign(
    workspaceId: string,
    audienceCount: number,
  ): Promise<void> {
    const subscription = await this.ensureSubscription(workspaceId);
    const plan = subscription.plan as Plan;
    const limit = PLAN_LIMITS[plan].contacts;
    if (audienceCount > limit) {
      throw new ForbiddenException(
        `Audience (${audienceCount}) exceeds the ${plan} plan limit of ${limit} contacts. Upgrade to send to a larger audience.`,
      );
    }
  }

  /**
   * Webhook reducer: maps Stripe events to BillingSubscription state.
   * Idempotent — Stripe re-delivers events on transient failures.
   */
  async applyStripeEvent(event: StripeEvent): Promise<void> {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as StripeCheckoutSession;
        await this.handleCheckoutCompleted(session);
        return;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as StripeSubscription;
        await this.handleSubscriptionUpdated(sub);
        return;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as StripeInvoice;
        const subRef = invoice.parent?.subscription_details?.subscription;
        const subId =
          typeof subRef === "string" ? subRef : (subRef?.id ?? null);
        if (subId) {
          const sub = (await this.stripe
            .getClient()
            .subscriptions.retrieve(subId)) as unknown as StripeSubscription;
          await this.handleSubscriptionUpdated(sub);
        }
        return;
      }
      default:
        this.logger.debug(`stripe event ${event.type} ignored`);
    }
  }

  private async handleCheckoutCompleted(
    session: StripeCheckoutSession,
  ): Promise<void> {
    const workspaceId =
      session.client_reference_id ??
      (typeof session.metadata?.workspaceId === "string"
        ? session.metadata.workspaceId
        : null);
    if (!workspaceId) {
      this.logger.warn("checkout.session.completed without workspaceId");
      return;
    }
    const customerId =
      typeof session.customer === "string"
        ? session.customer
        : session.customer?.id;
    if (!customerId) return;
    await this.prisma.billingSubscription.upsert({
      where: { workspaceId },
      create: {
        workspaceId,
        stripeCustomerId: customerId,
        plan: "FREE",
        status: "ACTIVE",
      },
      update: { stripeCustomerId: customerId },
    });
  }

  private async handleSubscriptionUpdated(
    sub: StripeSubscription,
  ): Promise<void> {
    const customerId =
      typeof sub.customer === "string" ? sub.customer : sub.customer.id;
    const fromMetadataPlan = parsePlanFromMetadata(sub.metadata?.plan);
    const fromPricePlan = parsePlanFromPrice(
      sub,
      this.config.get<string>("STRIPE_PRICE_STARTER"),
      this.config.get<string>("STRIPE_PRICE_GROWTH"),
      this.config.get<string>("STRIPE_PRICE_STARTER_ANNUAL"),
      this.config.get<string>("STRIPE_PRICE_GROWTH_ANNUAL"),
    );
    const plan: Plan =
      sub.status === "canceled" || sub.status === "incomplete_expired"
        ? "FREE"
        : (fromMetadataPlan ?? fromPricePlan ?? "FREE");

    const status = mapStripeStatus(sub.status);

    const workspaceFromMetadata =
      typeof sub.metadata?.workspaceId === "string"
        ? sub.metadata.workspaceId
        : null;

    const target =
      (await this.prisma.billingSubscription.findUnique({
        where: { stripeCustomerId: customerId },
      })) ??
      (workspaceFromMetadata
        ? await this.prisma.billingSubscription.findUnique({
            where: { workspaceId: workspaceFromMetadata },
          })
        : null);

    if (!target) {
      this.logger.warn(
        `subscription update for unknown customer ${customerId}`,
      );
      return;
    }

    const periodEndSeconds = extractPeriodEnd(sub);
    await this.prisma.billingSubscription.update({
      where: { id: target.id },
      data: {
        plan: plan as PrismaPlan,
        status,
        stripeCustomerId: customerId,
        stripeSubscriptionId: sub.id,
        currentPeriodEnd: periodEndSeconds
          ? new Date(periodEndSeconds * 1000)
          : null,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      },
    });
  }
}

/**
 * In the dahlia API, `current_period_end` moved off Subscription onto each
 * SubscriptionItem. We pick the latest one as the renewal anchor.
 */
function extractPeriodEnd(sub: StripeSubscription): number | null {
  let max = 0;
  for (const item of sub.items.data) {
    if (typeof item.current_period_end === "number") {
      max = Math.max(max, item.current_period_end);
    }
  }
  return max > 0 ? max : null;
}

function parsePlanFromMetadata(value: string | undefined): Plan | null {
  if (value === "STARTER" || value === "GROWTH" || value === "FREE") {
    return value;
  }
  return null;
}

function parsePlanFromPrice(
  sub: StripeSubscription,
  starter: string | undefined,
  growth: string | undefined,
  starterAnnual?: string | undefined,
  growthAnnual?: string | undefined,
): Plan | null {
  for (const item of sub.items.data) {
    const id = item.price.id;
    if (starter && id === starter) return "STARTER";
    if (growth && id === growth) return "GROWTH";
    if (starterAnnual && id === starterAnnual) return "STARTER";
    if (growthAnnual && id === growthAnnual) return "GROWTH";
  }
  return null;
}

function mapStripeStatus(status: StripeSubscriptionStatus): SubscriptionStatus {
  switch (status) {
    case "active":
      return "ACTIVE";
    case "trialing":
      return "TRIALING";
    case "past_due":
      return "PAST_DUE";
    case "canceled":
    case "incomplete_expired":
      return "CANCELED";
    case "incomplete":
      return "INCOMPLETE";
    case "unpaid":
      return "UNPAID";
    case "paused":
      return "PAST_DUE";
    default:
      return "INCOMPLETE";
  }
}
