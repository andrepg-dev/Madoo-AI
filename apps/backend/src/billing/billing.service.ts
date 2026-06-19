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
  PLAN_FEATURES,
  PLAN_LIMITS,
  type BillingOverviewDto,
  type Plan,
  type SubscriptionStatus,
} from "@madoo/shared";
import type { BillingSubscription, Plan as PrismaPlan } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { WorkspacesService } from "../workspaces/workspaces.service";
import { SEED_TEMPLATE_SLUGS } from "../templates/seed-templates";
import { StripeService } from "./stripe.service";
import {
  addUtcDays,
  addUtcMonths,
  buildCreditUsage,
  currentPeriodStart,
  startOfUtcDay,
} from "./credit-window";
import type {
  StripeCheckoutSession,
  StripeEvent,
  StripeInvoice,
  StripeSubscription,
  StripeSubscriptionStatus,
} from "./stripe-types";

const PLAN_TO_PRICE_ENV: Record<Exclude<Plan, "FREE">, Record<"MONTHLY" | "ANNUAL", string>> = {
  BASIC: { MONTHLY: "STRIPE_PRICE_BASIC", ANNUAL: "STRIPE_PRICE_BASIC_ANNUAL" },
  MEDIUM: { MONTHLY: "STRIPE_PRICE_MEDIUM", ANNUAL: "STRIPE_PRICE_MEDIUM_ANNUAL" },
  PRO: { MONTHLY: "STRIPE_PRICE_PRO", ANNUAL: "STRIPE_PRICE_PRO_ANNUAL" },
};

/** Default free-trial length when STRIPE_TRIAL_PERIOD_DAYS is unset. */
const DEFAULT_TRIAL_PERIOD_DAYS = 7;

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

  /** Configured free-trial length in days (0 disables the trial). */
  private trialPeriodDays(): number {
    const raw = this.config.get<string>("STRIPE_TRIAL_PERIOD_DAYS");
    if (raw === undefined) return DEFAULT_TRIAL_PERIOD_DAYS;
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed >= 0
      ? parsed
      : DEFAULT_TRIAL_PERIOD_DAYS;
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
    const periodStart = currentPeriodStart(subscription.creditsAnchor, now);
    const periodEnd = addUtcMonths(periodStart, 1);
    const dayStart = startOfUtcDay(now);
    const nextDay = addUtcDays(dayStart, 1);

    const [monthlyUsed, dailyUsed, templatesUsed] = await Promise.all([
      this.countCreditsUsed(workspaceId, periodStart),
      this.countCreditsUsed(workspaceId, dayStart),
      this.prisma.template.count({
        where: { workspaceId, slug: { notIn: [...SEED_TEMPLATE_SLUGS] } },
      }),
    ]);

    const remaining = (used: number, limit: number) =>
      limit === -1 ? -1 : Math.max(0, limit - used);

    return {
      subscription: {
        plan,
        status: subscription.status as SubscriptionStatus,
        currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        hasStripeCustomer: Boolean(subscription.stripeCustomerId),
        trialEndsAt: subscription.trialEndsAt?.toISOString() ?? null,
      },
      usage: {
        aiGenerations: buildCreditUsage(
          monthlyUsed,
          limits.aiGenerations,
          periodEnd,
        ),
        dailyAiGenerations: buildCreditUsage(
          dailyUsed,
          limits.dailyAiGenerations,
          nextDay,
        ),
        storedTemplates: {
          used: templatesUsed,
          limit: limits.storedTemplates,
          remaining: remaining(templatesUsed, limits.storedTemplates),
        },
      },
      limits: { ...limits },
      features: PLAN_FEATURES[plan],
    };
  }

  async assertCanGenerate(workspaceId: string): Promise<void> {
    const subscription = await this.ensureSubscription(workspaceId);
    const plan = subscription.plan as Plan;
    const limits = PLAN_LIMITS[plan];
    const now = new Date();

    // Daily cap (free tier: 5 credits/day, resets at 00:00 UTC).
    if (limits.dailyAiGenerations !== -1) {
      const dayStart = startOfUtcDay(now);
      const usedToday = await this.countCreditsUsed(workspaceId, dayStart);
      if (usedToday >= limits.dailyAiGenerations) {
        throw new ForbiddenException(
          `Daily AI credit limit reached: ${PLAN_DISPLAY_NAMES[plan]} plan allows ${limits.dailyAiGenerations} credits per day (used ${usedToday}). Resets at 00:00 UTC.`,
        );
      }
    }

    // Monthly cap (rolling window from the credits anchor; resets on upgrade).
    if (limits.aiGenerations !== -1) {
      const periodStart = currentPeriodStart(subscription.creditsAnchor, now);
      const usedThisPeriod = await this.countCreditsUsed(
        workspaceId,
        periodStart,
      );
      if (usedThisPeriod >= limits.aiGenerations) {
        throw new ForbiddenException(
          `Monthly AI credit limit reached: ${PLAN_DISPLAY_NAMES[plan]} plan allows ${limits.aiGenerations} credits per month (used ${usedThisPeriod}). Upgrade to generate more.`,
        );
      }
    }
  }

  /**
   * Counts consumed AI credits since `since`. Every non-failed generation run —
   * an initial draft (INITIAL) or a chat/template edit (EDIT) — costs one credit.
   */
  private countCreditsUsed(workspaceId: string, since: Date): Promise<number> {
    return this.prisma.emailGenerationRun.count({
      where: {
        workspaceId,
        kind: { in: ["INITIAL", "EDIT"] },
        status: { not: "FAILED" },
        createdAt: { gte: since },
      },
    });
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

    // Grant the free trial only to workspaces that have never started one and
    // never had a Stripe subscription, so cancel-and-resubscribe can't farm
    // repeated trials. Stripe still collects a card up front and auto-charges
    // when the trial ends.
    const trialDays = this.trialPeriodDays();
    const grantTrial =
      trialDays > 0 &&
      !subscription.hasUsedTrial &&
      !subscription.stripeSubscriptionId;

    const session = (await this.stripe.getClient().checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/settings/billing?upgraded=1`,
      cancel_url: `${appUrl}/settings/billing?canceled=1`,
      ...(subscription.stripeCustomerId
        ? { customer: subscription.stripeCustomerId }
        : {
            customer_email: user?.email ?? undefined,
          }),
      client_reference_id: workspaceId,
      metadata: { workspaceId, plan: targetPlan, interval },
      subscription_data: {
        metadata: { workspaceId, plan: targetPlan, interval },
        ...(grantTrial ? { trial_period_days: trialDays } : {}),
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
   * Cancels (or resumes) the workspace's subscription at the end of the current
   * paid period. The user keeps paid access until then, after which Stripe's
   * `customer.subscription.deleted` webhook drops the plan back to FREE.
   */
  async setCancellation(
    workspaceId: string,
    userId: string,
    cancelAtPeriodEnd: boolean,
  ): Promise<{ cancelAtPeriodEnd: boolean; currentPeriodEnd: string | null }> {
    await this.workspaces.assertOwner(userId, workspaceId);
    if (!this.stripe.isEnabled()) {
      throw new ServiceUnavailableException(
        "Billing is not configured on this server.",
      );
    }
    const subscription = await this.ensureSubscription(workspaceId);
    if (!subscription.stripeSubscriptionId) {
      throw new BadRequestException(
        "No active paid subscription to update.",
      );
    }

    const updated = (await this.stripe
      .getClient()
      .subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: cancelAtPeriodEnd,
      })) as unknown as StripeSubscription;

    // Optimistically mirror the change; the subscription.updated webhook will
    // reconcile the authoritative state right after.
    const periodEndSeconds = extractPeriodEnd(updated);
    const row = await this.prisma.billingSubscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd,
        currentPeriodEnd: periodEndSeconds
          ? new Date(periodEndSeconds * 1000)
          : subscription.currentPeriodEnd,
      },
    });
    return {
      cancelAtPeriodEnd: row.cancelAtPeriodEnd,
      currentPeriodEnd: row.currentPeriodEnd?.toISOString() ?? null,
    };
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
    const fromPricePlan = parsePlanFromPrice(sub, {
      basic: this.config.get<string>("STRIPE_PRICE_BASIC"),
      medium: this.config.get<string>("STRIPE_PRICE_MEDIUM"),
      pro: this.config.get<string>("STRIPE_PRICE_PRO"),
      basicAnnual: this.config.get<string>("STRIPE_PRICE_BASIC_ANNUAL"),
      mediumAnnual: this.config.get<string>("STRIPE_PRICE_MEDIUM_ANNUAL"),
      proAnnual: this.config.get<string>("STRIPE_PRICE_PRO_ANNUAL"),
    });
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
    const trialEnd =
      typeof sub.trial_end === "number"
        ? new Date(sub.trial_end * 1000)
        : null;
    // Reset the AI-credit window the moment the plan changes (up or down) so
    // credits refresh immediately on upgrade.
    const planChanged = target.plan !== (plan as PrismaPlan);
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
        trialEndsAt: trialEnd,
        // Once a trial exists on a Stripe subscription, latch the flag so a
        // future resubscribe doesn't hand out a second free trial.
        ...(trialEnd ? { hasUsedTrial: true } : {}),
        ...(planChanged ? { creditsAnchor: new Date() } : {}),
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
  if (
    value === "BASIC" ||
    value === "MEDIUM" ||
    value === "PRO" ||
    value === "FREE"
  ) {
    return value;
  }
  if (value === "STARTER") return "BASIC";
  if (value === "GROWTH") return "MEDIUM";
  return null;
}

type PriceEnvIds = {
  basic: string | undefined;
  medium: string | undefined;
  pro: string | undefined;
  basicAnnual: string | undefined;
  mediumAnnual: string | undefined;
  proAnnual: string | undefined;
};

function parsePlanFromPrice(
  sub: StripeSubscription,
  ids: PriceEnvIds,
): Plan | null {
  for (const item of sub.items.data) {
    const id = item.price.id;
    if (id && (id === ids.basic || id === ids.basicAnnual)) return "BASIC";
    if (id && (id === ids.medium || id === ids.mediumAnnual)) return "MEDIUM";
    if (id && (id === ids.pro || id === ids.proAnnual)) return "PRO";
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
