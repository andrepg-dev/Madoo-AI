import { z } from "zod";

export const PlanSchema = z.enum(["FREE", "STARTER", "GROWTH"]);
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
  contacts: number;
  aiGenerations: number; // -1 = unlimited
  workspaces: number;    // -1 = unlimited
};

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  FREE:    { contacts: 100,   aiGenerations: 5,   workspaces: 1  },
  STARTER: { contacts: 1_000, aiGenerations: 100, workspaces: 5  },
  GROWTH:  { contacts: 5_000, aiGenerations: -1,  workspaces: -1 },
};

export const PLAN_PRICES: Record<Plan, number> = {
  FREE: 0,
  STARTER: 19,
  GROWTH: 49,
};

export const PLAN_PRICES_ANNUAL: Record<Plan, number> = {
  FREE: 0,
  STARTER: 15,
  GROWTH: 39,
};

export type BillingInterval = "MONTHLY" | "ANNUAL";

export const PLAN_DISPLAY_NAMES: Record<Plan, string> = {
  FREE: "Free",
  STARTER: "Starter",
  GROWTH: "Growth",
};

export const BillingSubscriptionSchema = z.object({
  plan: PlanSchema,
  status: SubscriptionStatusSchema,
  currentPeriodEnd: z.string().datetime().nullable(),
  cancelAtPeriodEnd: z.boolean(),
  hasStripeCustomer: z.boolean(),
});
export type BillingSubscriptionDto = z.infer<typeof BillingSubscriptionSchema>;

export const BillingUsageSchema = z.object({
  contacts: z.object({
    used: z.number().int().nonnegative(),
    limit: z.number().int().nonnegative(),
  }),
  aiGenerations: z.object({
    used: z.number().int().nonnegative(),
    limit: z.number().int(), // -1 = unlimited
    resetsAt: z.string().datetime(),
  }),
});
export type BillingUsageDto = z.infer<typeof BillingUsageSchema>;

export const BillingOverviewSchema = z.object({
  subscription: BillingSubscriptionSchema,
  usage: BillingUsageSchema,
  limits: z.object({
    contacts: z.number().int().nonnegative(),
    aiGenerations: z.number().int(), // -1 = unlimited
  }),
});
export type BillingOverviewDto = z.infer<typeof BillingOverviewSchema>;

export const CreateCheckoutSessionInputSchema = z.object({
  plan: z.enum(["STARTER", "GROWTH"]),
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
