import { z } from "zod";

export const PlanSchema = z.enum(["FREE", "BASIC", "MEDIUM", "PRO"]);
export type Plan = z.infer<typeof PlanSchema>;

export const SubscriptionStatusSchema = z.enum([
  "ACTIVE",
  "TRIALING",
  "PAST_DUE",
  "CANCELED",
  "INCOMPLETE",
  "UNPAID",
]);
export type SubscriptionStatus = z.infer<typeof SubscriptionStatusSchema>;

export type PlanLimits = {
  aiGenerations: number;      // monthly credit cap, -1 = unlimited
  dailyAiGenerations: number; // daily credit cap, -1 = no daily cap
  storedTemplates: number;    // total templates per workspace, -1 = unlimited
  members: number;            // invited members beyond the owner, -1 = unlimited
  workspaces: number;         // total workspaces owned, -1 = unlimited
  testEmailsPerDay: number;   // -1 = unlimited
};

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  // Each plan: daily credits reset at 00:00 UTC, capped at a monthly total.
  // members = teammates invitable beyond the owner; workspaces = total owned.
  FREE:    { aiGenerations: 30,  dailyAiGenerations: 5,  storedTemplates: 10,  members: 0, workspaces: 0,  testEmailsPerDay: 10  },
  BASIC:   { aiGenerations: 100, dailyAiGenerations: 15, storedTemplates: 50,  members: 2, workspaces: 5,  testEmailsPerDay: 50  },
  MEDIUM:  { aiGenerations: 250, dailyAiGenerations: 25, storedTemplates: 150, members: 3, workspaces: 15, testEmailsPerDay: 100 },
  PRO:     { aiGenerations: 550, dailyAiGenerations: 50, storedTemplates: 300, members: 5, workspaces: -1, testEmailsPerDay: 300 },
};

/**
 * Non-numeric plan capabilities. Currently identical across plans; kept as a
 * map so plans can diverge later. `exportProviders` is "coming_soon" for every
 * plan until the provider integrations ship.
 */
export const EXPORT_FORMATS = ["HTML", "JPEG", "PDF"] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export type ExportProvidersStatus = "coming_soon" | "available" | "unavailable";

export type PlanFeatures = {
  sharePreviewLinks: boolean;
  exportFormats: ExportFormat[];
  exportProviders: ExportProvidersStatus;
};

export const PLAN_FEATURES: Record<Plan, PlanFeatures> = {
  FREE:    { sharePreviewLinks: true, exportFormats: [...EXPORT_FORMATS], exportProviders: "coming_soon" },
  BASIC:   { sharePreviewLinks: true, exportFormats: [...EXPORT_FORMATS], exportProviders: "coming_soon" },
  MEDIUM:  { sharePreviewLinks: true, exportFormats: [...EXPORT_FORMATS], exportProviders: "coming_soon" },
  PRO:     { sharePreviewLinks: true, exportFormats: [...EXPORT_FORMATS], exportProviders: "coming_soon" },
};

export const PLAN_PRICES: Record<Plan, number> = {
  FREE: 0,
  BASIC: 25,
  MEDIUM: 50,
  PRO: 95,
};

export const PLAN_PRICES_ANNUAL: Record<Plan, number> = {
  FREE: 0,
  BASIC: 21,
  MEDIUM: 42,
  PRO: 80,
};

export type BillingInterval = "MONTHLY" | "ANNUAL";

export const PLAN_DISPLAY_NAMES: Record<Plan, string> = {
  FREE: "Free",
  BASIC: "Basic",
  MEDIUM: "Medium",
  PRO: "Pro",
};

export type PaidPlan = Exclude<Plan, "FREE">;

export const NEXT_UPGRADE_PLAN: Record<Plan, PaidPlan | null> = {
  FREE: "BASIC",
  BASIC: "MEDIUM",
  MEDIUM: "PRO",
  PRO: null,
};

export function getRecommendedUpgradePlan(plan: Plan): PaidPlan | null {
  return NEXT_UPGRADE_PLAN[plan];
}

export const BillingSubscriptionSchema = z.object({
  plan: PlanSchema,
  status: SubscriptionStatusSchema,
  currentPeriodEnd: z.string().datetime().nullable(),
  cancelAtPeriodEnd: z.boolean(),
  hasStripeCustomer: z.boolean(),
  /** When the active free trial ends (ISO), or null if not trialing. */
  trialEndsAt: z.string().datetime().nullable(),
  /** The opt-in 7-day trial has been claimed for this workspace. */
  trialClaimed: z.boolean(),
  /** Claimed AND still grantable (never used a trial, no Stripe sub yet). */
  trialEligible: z.boolean(),
});
export type BillingSubscriptionDto = z.infer<typeof BillingSubscriptionSchema>;

const CreditUsageSchema = z.object({
  used: z.number().int().nonnegative(),
  limit: z.number().int(), // -1 = unlimited
  remaining: z.number().int(), // -1 = unlimited
  resetsAt: z.string().datetime(),
  /**
   * Granted referral bonus credits available on top of `remaining`. Present on
   * the monthly window only; spendable once the monthly base cap is reached.
   */
  bonus: z.number().int().nonnegative().optional(),
});
export type CreditUsageDto = z.infer<typeof CreditUsageSchema>;

/** Usage of a resource with no time-based reset (e.g. stored templates). */
const ResourceUsageSchema = z.object({
  used: z.number().int().nonnegative(),
  limit: z.number().int(), // -1 = unlimited
  remaining: z.number().int(), // -1 = unlimited
});
export type ResourceUsageDto = z.infer<typeof ResourceUsageSchema>;

export const BillingUsageSchema = z.object({
  /** Monthly AI credit window, rolling from the credits anchor. */
  aiGenerations: CreditUsageSchema,
  /** Daily AI credit window; limit -1 means no daily cap. */
  dailyAiGenerations: CreditUsageSchema,
  /** Stored templates in the active workspace. */
  storedTemplates: ResourceUsageSchema,
});
export type BillingUsageDto = z.infer<typeof BillingUsageSchema>;

export const PlanLimitsSchema = z.object({
  aiGenerations: z.number().int(),
  dailyAiGenerations: z.number().int(),
  storedTemplates: z.number().int(),
  members: z.number().int(),
  workspaces: z.number().int(),
  testEmailsPerDay: z.number().int(),
});

export const PlanFeaturesSchema = z.object({
  sharePreviewLinks: z.boolean(),
  exportFormats: z.array(z.enum(EXPORT_FORMATS)),
  exportProviders: z.enum(["coming_soon", "available", "unavailable"]),
});

export const BillingOverviewSchema = z.object({
  subscription: BillingSubscriptionSchema,
  usage: BillingUsageSchema,
  limits: PlanLimitsSchema,
  features: PlanFeaturesSchema,
});
export type BillingOverviewDto = z.infer<typeof BillingOverviewSchema>;

export const CreateCheckoutSessionInputSchema = z.object({
  plan: z.enum(["BASIC", "MEDIUM", "PRO"]),
  interval: z.enum(["MONTHLY", "ANNUAL"]).default("MONTHLY"),
  /**
   * Opt-in 7-day trial: when true, claim the trial so checkout adds
   * `trial_period_days` (still gated by never having used a trial). When false
   * or omitted, checkout charges immediately.
   */
  claimTrial: z.boolean().optional(),
});
export type CreateCheckoutSessionInput = z.infer<
  typeof CreateCheckoutSessionInputSchema
>;

export const CheckoutSessionResponseSchema = z.object({
  url: z.string().url(),
});
export type CheckoutSessionResponse = z.infer<
  typeof CheckoutSessionResponseSchema
>;

export const PortalSessionResponseSchema = z.object({
  url: z.string().url(),
});
export type PortalSessionResponse = z.infer<typeof PortalSessionResponseSchema>;

/** Pre-signup opt-in trial claim: reserve a 7-day trial spot by email. */
export const ClaimTrialEmailInputSchema = z.object({
  email: z.string().email(),
});
export type ClaimTrialEmailInput = z.infer<typeof ClaimTrialEmailInputSchema>;

export const ClaimTrialEmailResponseSchema = z.object({
  claimed: z.boolean(),
});
export type ClaimTrialEmailResponse = z.infer<
  typeof ClaimTrialEmailResponseSchema
>;

/** Result of toggling cancel-at-period-end on the active subscription. */
export const CancelSubscriptionResponseSchema = z.object({
  cancelAtPeriodEnd: z.boolean(),
  currentPeriodEnd: z.string().datetime().nullable(),
});
export type CancelSubscriptionResponse = z.infer<
  typeof CancelSubscriptionResponseSchema
>;
