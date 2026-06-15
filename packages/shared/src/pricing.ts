/**
 * Single source of truth for the marketing pricing plans, consumed by both the
 * landing page (`PricingPlans`) and the in-app upgrade modal (`PricingDrawer`).
 *
 * NOTE: the Stripe-backed billing plans live in `billing.ts` as
 * `Plan = FREE | STARTER | GROWTH`. These marketing plans map to them via
 * `checkoutPlan` so the modal can still trigger checkout. There is no Free plan
 * here on purpose — the product only offers a 7-day trial.
 */

export type PricingPlanId = "basic" | "medium" | "pro";

export type PricingBillingInterval = "monthly" | "yearly";

export type PricingFeature = {
  label: string;
  /** Optional leading value rendered bold, e.g. "100" in "100 monthly credits". */
  value?: string;
  emphasized?: boolean;
};

export type PricingPlan = {
  id: PricingPlanId;
  name: string;
  description: string;
  /** Monthly price in USD. Yearly is derived via PRICING_YEARLY_RATE. */
  monthlyPrice: number;
  cta: string;
  featured?: boolean;
  /** Stripe-backed billing plan used when this card triggers checkout. */
  checkoutPlan: "STARTER" | "GROWTH";
  features: PricingFeature[];
};

/** Yearly billing charges this fraction of the monthly price (20% off). */
export const PRICING_YEARLY_RATE = 0.8;

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "basic",
    name: "Basic",
    description: "For solo creators building more templates and exports.",
    monthlyPrice: 20,
    cta: "Try Basic",
    checkoutPlan: "STARTER",
    features: [
      { value: "100", label: "monthly credits", emphasized: true },
      { value: "50", label: "stored templates", emphasized: true },
      { value: "2", label: "members", emphasized: true },
      { value: "50", label: "test emails a day", emphasized: true },
      { label: "Access to any model" },
      { label: "Export to any provider of your choice" },
      { label: "Sharing preview template links" },
    ],
  },
  {
    id: "medium",
    name: "Medium",
    description: "Amazing for small teams and agencies.",
    monthlyPrice: 45,
    cta: "Try Medium",
    featured: true,
    checkoutPlan: "GROWTH",
    features: [
      { value: "250", label: "monthly credits", emphasized: true },
      { value: "150", label: "stored templates", emphasized: true },
      { value: "3", label: "members", emphasized: true },
      { value: "100", label: "test emails a day", emphasized: true },
      { label: "Access to any model" },
      { label: "Export to any provider of your choice" },
      { label: "Sharing preview template links" },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "For agencies that need more storage and volume.",
    monthlyPrice: 95,
    cta: "Try Pro",
    checkoutPlan: "GROWTH",
    features: [
      { value: "550", label: "monthly credits", emphasized: true },
      { value: "300", label: "stored templates", emphasized: true },
      { value: "5", label: "members", emphasized: true },
      { value: "300", label: "test emails a day", emphasized: true },
      { label: "Access to any model" },
      { label: "Export to any provider of your choice" },
      { label: "Sharing preview template links" },
    ],
  },
];

export function getPlanDisplayPrice(
  monthlyPrice: number,
  interval: PricingBillingInterval,
): number {
  return interval === "monthly"
    ? monthlyPrice
    : Math.round(monthlyPrice * PRICING_YEARLY_RATE);
}

export function getPlanYearlySavings(monthlyPrice: number): number {
  return (monthlyPrice - getPlanDisplayPrice(monthlyPrice, "yearly")) * 12;
}
