import { z } from "zod";

export const PlanSchema = z.enum(["FREE", "STARTER", "GROWTH", "PRO"]);
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
  workspaces: number;         // -1 = unlimited
};

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  // Each plan: daily credits that reset at 00:00 UTC, capped at a monthly total.
  FREE:    { aiGenerations: 30,  dailyAiGenerations: 5,  workspaces: 1  },
  STARTER: { aiGenerations: 100, dailyAiGenerations: 15, workspaces: 5  },
  GROWTH:  { aiGenerations: 250, dailyAiGenerations: 25, workspaces: 15 },
  PRO:     { aiGenerations: 550, dailyAiGenerations: 50, workspaces: -1 },
};

export const PLAN_PRICES: Record<Plan, number> = {
  FREE: 0,
  STARTER: 25,
  GROWTH: 50,
  PRO: 95,
};

export const PLAN_PRICES_ANNUAL: Record<Plan, number> = {
  FREE: 0,
  STARTER: 21,
  GROWTH: 42,
  PRO: 80,
};

export type BillingInterval = "MONTHLY" | "ANNUAL";

export const PLAN_DISPLAY_NAMES: Record<Plan, string> = {
  FREE: "Free",
  STARTER: "Starter",
  GROWTH: "Growth",
  PRO: "Pro",
};

export const BillingSubscriptionSchema = z.object({
  plan: PlanSchema,
  status: SubscriptionStatusSchema,
  currentPeriodEnd: z.string().datetime().nullable(),
  cancelAtPeriodEnd: z.boolean(),
  hasStripeCustomer: z.boolean(),
  /** When the active free trial ends (ISO), or null if not trialing. */
  trialEndsAt: z.string().datetime().nullable(),
});
export type BillingSubscriptionDto = z.infer<typeof BillingSubscriptionSchema>;

const CreditUsageSchema = z.object({
  used: z.number().int().nonnegative(),
  limit: z.number().int(), // -1 = unlimited
  remaining: z.number().int(), // -1 = unlimited
  resetsAt: z.string().datetime(),
});
export type CreditUsageDto = z.infer<typeof CreditUsageSchema>;

export const BillingUsageSchema = z.object({
  /** Monthly AI credit window, rolling from the credits anchor. */
  aiGenerations: CreditUsageSchema,
  /** Daily AI credit window (free tier only); limit -1 means no daily cap. */
  dailyAiGenerations: CreditUsageSchema,
});
export type BillingUsageDto = z.infer<typeof BillingUsageSchema>;

export const BillingOverviewSchema = z.object({
  subscription: BillingSubscriptionSchema,
  usage: BillingUsageSchema,
  limits: z.object({
    aiGenerations: z.number().int(), // -1 = unlimited
    dailyAiGenerations: z.number().int(), // -1 = no daily cap
  }),
});
export type BillingOverviewDto = z.infer<typeof BillingOverviewSchema>;

export const CreateCheckoutSessionInputSchema = z.object({
  plan: z.enum(["STARTER", "GROWTH", "PRO"]),
  interval: z.enum(["MONTHLY", "ANNUAL"]).default("MONTHLY"),
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
