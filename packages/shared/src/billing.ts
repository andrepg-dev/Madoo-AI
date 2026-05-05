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
};

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  FREE: { contacts: 100 },
  STARTER: { contacts: 1000 },
  GROWTH: { contacts: 5000 },
};

export const PLAN_PRICES: Record<Plan, number> = {
  FREE: 0,
  STARTER: 19,
  GROWTH: 49,
};

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
});
export type BillingUsageDto = z.infer<typeof BillingUsageSchema>;

export const BillingOverviewSchema = z.object({
  subscription: BillingSubscriptionSchema,
  usage: BillingUsageSchema,
  limits: z.object({
    contacts: z.number().int().nonnegative(),
  }),
});
export type BillingOverviewDto = z.infer<typeof BillingOverviewSchema>;

export const CreateCheckoutSessionInputSchema = z.object({
  plan: z.enum(["STARTER", "GROWTH"]),
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
