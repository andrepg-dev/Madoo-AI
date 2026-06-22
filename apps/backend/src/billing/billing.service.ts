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
import { ReferralsService } from "../referrals/referrals.service";
import { SEED_TEMPLATE_SLUGS } from "../templates/seed-templates";
import { StripeService } from "./stripe.service";
import {
  addUtcDays,
  addUtcMonths,
  buildCreditUsage,
  currentPeriodStart,
  startOfUtcDay,
} from "./credit-window";
import { accountUserIdForWorkspace, ownedWorkspaceIds } from "./account";
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
    private readonly referrals: ReferralsService,
  ) {}

  /**
   * Returns the account subscription for a user, lazily creating a default FREE
   * row if it does not exist yet. Billing is account-wide: one subscription per
   * user, shared across every workspace they own.
   */
  async ensureSubscription(userId: string): Promise<BillingSubscription> {
    const existing = await this.prisma.billingSubscription.findUnique({
      where: { userId },
    });
    if (existing) return existing;
    return this.prisma.billingSubscription.create({
      data: { userId, plan: "FREE", status: "ACTIVE" },
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
    // Credits are account-wide: resolve the requesting user's own subscription
    // and meter usage across every workspace they own, not just this one.
    const subscription = await this.ensureSubscription(userId);
    const plan = subscription.plan as Plan;
    const limits = PLAN_LIMITS[plan];

    const now = new Date();
    const periodStart = currentPeriodStart(subscription.creditsAnchor, now);
    const periodEnd = addUtcMonths(periodStart, 1);
    const dayStart = startOfUtcDay(now);
    const nextDay = addUtcDays(dayStart, 1);

    const scope = await ownedWorkspaceIds(this.prisma, userId);
    const [monthlyUsed, dailyUsed, templatesUsed] = await Promise.all([
      this.countCreditsUsed(scope, periodStart),
      this.countCreditsUsed(scope, dayStart),
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
        trialClaimed: subscription.trialClaimed,
        // Claimed AND still grantable — drives the "Start free trial" CTA.
        trialEligible:
          subscription.trialClaimed &&
          !subscription.hasUsedTrial &&
          !subscription.stripeSubscriptionId,
      },
      usage: {
        aiGenerations: {
          ...buildCreditUsage(monthlyUsed, limits.aiGenerations, periodEnd),
          // Referral bonus credits extend the monthly allowance only.
          bonus: subscription.bonusCredits,
        },
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
    // A workspace meters against its owning account's shared credit pool.
    const accountUserId = await accountUserIdForWorkspace(
      this.prisma,
      workspaceId,
    );
    if (!accountUserId) return; // orphan workspace with no owner — nothing to meter
    const subscription = await this.ensureSubscription(accountUserId);
    const plan = subscription.plan as Plan;
    const limits = PLAN_LIMITS[plan];
    const now = new Date();
    const scope = await ownedWorkspaceIds(this.prisma, accountUserId);

    // Daily cap (free tier: 5 credits/day, resets at 00:00 UTC).
    if (limits.dailyAiGenerations !== -1) {
      const dayStart = startOfUtcDay(now);
      const usedToday = await this.countCreditsUsed(scope, dayStart);
      if (usedToday >= limits.dailyAiGenerations) {
        throw new ForbiddenException(
          `Daily AI credit limit reached: ${PLAN_DISPLAY_NAMES[plan]} plan allows ${limits.dailyAiGenerations} credits per day (used ${usedToday}). Resets at 00:00 UTC.`,
        );
      }
    }

    // Monthly cap (rolling window from the credits anchor; resets on upgrade).
    if (limits.aiGenerations !== -1) {
      const periodStart = currentPeriodStart(subscription.creditsAnchor, now);
      const usedThisPeriod = await this.countCreditsUsed(scope, periodStart);
      if (usedThisPeriod >= limits.aiGenerations) {
        // Past the base monthly cap: allow only if referral bonus credits
        // remain, spending one for this generation. The daily cap above still
        // applies. `bonusCredits > 0` guards the balance from going negative.
        if (subscription.bonusCredits > 0) {
          await this.prisma.billingSubscription.updateMany({
            where: { id: subscription.id, bonusCredits: { gt: 0 } },
            data: { bonusCredits: { decrement: 1 } },
          });
          return;
        }
        throw new ForbiddenException(
          `Monthly AI credit limit reached: ${PLAN_DISPLAY_NAMES[plan]} plan allows ${limits.aiGenerations} credits per month (used ${usedThisPeriod}). Upgrade to generate more.`,
        );
      }
    }
  }

  /**
   * Counts consumed AI credits since `since` across the account's workspaces.
   * Every non-failed generation run — an initial draft (INITIAL) or a
   * chat/template edit (EDIT) — costs one credit, drawn from the shared pool.
   */
  private countCreditsUsed(
    workspaceIds: string[],
    since: Date,
  ): Promise<number> {
    if (workspaceIds.length === 0) return Promise.resolve(0);
    return this.prisma.emailGenerationRun.count({
      where: {
        workspaceId: { in: workspaceIds },
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
  /**
   * Records a pre-signup opt-in trial claim by email (landing FAQ). Idempotent.
   * Public — no auth; the email is reconciled to the user on their next login.
   */
  async recordTrialClaimEmail(email: string): Promise<{ claimed: boolean }> {
    const normalized = email.trim().toLowerCase();
    await this.prisma.trialClaim.upsert({
      where: { email: normalized },
      create: { email: normalized },
      update: {},
    });
    return { claimed: true };
  }

  /**
   * Marks the opt-in 7-day trial as claimed for the user's account. The claim
   * latches so the FAQ/landing flow can grant the trial at the next checkout.
   * Does not start a trial by itself.
   */
  async claimTrial(userId: string): Promise<{ trialClaimed: boolean }> {
    const subscription = await this.ensureSubscription(userId);
    if (subscription.trialClaimed) return { trialClaimed: true };
    const updated = await this.prisma.billingSubscription.update({
      where: { id: subscription.id },
      data: { trialClaimed: true },
    });
    return { trialClaimed: updated.trialClaimed };
  }

  async createCheckoutSession(
    userId: string,
    targetPlan: Exclude<Plan, "FREE">,
    interval: "MONTHLY" | "ANNUAL" = "MONTHLY",
    claimTrial = false,
  ): Promise<{ url: string }> {
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

    const subscription = await this.ensureSubscription(userId);

    // Opt-in trial: the trial is no longer granted by default. Persist the
    // claim when the caller asks for it so the FAQ/landing flow latches it.
    let trialClaimed = subscription.trialClaimed;
    if (claimTrial && !trialClaimed) {
      const updated = await this.prisma.billingSubscription.update({
        where: { id: subscription.id },
        data: { trialClaimed: true },
      });
      trialClaimed = updated.trialClaimed;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    const appUrl =
      this.config.get<string>("APP_URL") ?? "http://localhost:3000";

    // Grant the free trial only when it was explicitly claimed, the workspace
    // has never started one, and it never had a Stripe subscription — so
    // cancel-and-resubscribe can't farm repeated trials. Stripe still collects a
    // card up front and auto-charges when the trial ends.
    const trialDays = this.trialPeriodDays();
    const grantTrial =
      trialDays > 0 &&
      trialClaimed &&
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
      client_reference_id: userId,
      metadata: { userId, plan: targetPlan, interval },
      subscription_data: {
        metadata: { userId, plan: targetPlan, interval },
        ...(grantTrial ? { trial_period_days: trialDays } : {}),
      },
      allow_promotion_codes: true,
    })) as unknown as StripeCheckoutSession;

    if (!session.url) {
      throw new BadRequestException("Stripe did not return a checkout URL.");
    }
    return { url: session.url };
  }

  async createPortalSession(userId: string): Promise<{ url: string }> {
    if (!this.stripe.isEnabled()) {
      throw new ServiceUnavailableException(
        "Billing is not configured on this server.",
      );
    }
    const subscription = await this.ensureSubscription(userId);
    if (!subscription.stripeCustomerId) {
      throw new BadRequestException(
        "Account has no Stripe customer yet — start a checkout first.",
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
   * Cancels (or resumes) the account's subscription at the end of the current
   * paid period. The user keeps paid access until then, after which Stripe's
   * `customer.subscription.deleted` webhook drops the plan back to FREE.
   */
  async setCancellation(
    userId: string,
    cancelAtPeriodEnd: boolean,
  ): Promise<{ cancelAtPeriodEnd: boolean; currentPeriodEnd: string | null }> {
    if (!this.stripe.isEnabled()) {
      throw new ServiceUnavailableException(
        "Billing is not configured on this server.",
      );
    }
    const subscription = await this.ensureSubscription(userId);
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
    const userId =
      session.client_reference_id ??
      (typeof session.metadata?.userId === "string"
        ? session.metadata.userId
        : null);
    if (!userId) {
      this.logger.warn("checkout.session.completed without userId");
      return;
    }
    const customerId =
      typeof session.customer === "string"
        ? session.customer
        : session.customer?.id;
    if (!customerId) return;
    await this.prisma.billingSubscription.upsert({
      where: { userId },
      create: {
        userId,
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

    const userFromMetadata =
      typeof sub.metadata?.userId === "string" ? sub.metadata.userId : null;

    const target =
      (await this.prisma.billingSubscription.findUnique({
        where: { stripeCustomerId: customerId },
      })) ??
      (userFromMetadata
        ? await this.prisma.billingSubscription.findUnique({
            where: { userId: userFromMetadata },
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

    // Referral payout: only on a *real charge* — the account transitions INTO
    // a paid plan with status ACTIVE. A TRIALING subscription (no charge yet)
    // does not qualify; it pays out later if/when the trial converts. Idempotent
    // via the ReferralReward unique key, but gated on the transition to avoid
    // re-running on every routine webhook.
    const becamePaidActive =
      plan !== "FREE" &&
      status === "ACTIVE" &&
      (target.plan === "FREE" || target.status !== "ACTIVE");
    if (becamePaidActive) {
      try {
        await this.referrals.rewardIfQualified(target.userId);
      } catch (err) {
        this.logger.error(
          `referral reward failed for user ${target.userId}: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
    }
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
