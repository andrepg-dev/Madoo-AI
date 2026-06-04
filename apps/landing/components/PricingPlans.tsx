"use client";

import { Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";

type BillingInterval = "monthly" | "yearly";
type PlanTier = "basic" | "medium" | "pro" | "enterprise";

type PricingFeature = {
  label: string;
  value?: string;
  emphasized?: boolean;
};

type PricingPlan = {
  tier: PlanTier;
  name: string;
  description: string;
  monthlyPrice: number;
  cta: string;
  featured?: boolean;
  features: PricingFeature[];
};

const tierPrices: Record<PlanTier, number> = {
  basic: 20,
  medium: 45,
  pro: 95,
  enterprise: 0,
};

const plans: PricingPlan[] = [
  {
    tier: "basic",
    name: "Basic",
    description:
      "For solo creators building more templates and exports.",
    monthlyPrice: tierPrices.basic,
    cta: "Try Basic",
    features: [
      { value: "100", label: "monthly credits", emphasized: true },
      { value: "50", label: "stored templates", emphasized: true },
      { value: "2", label: "members", emphasized: true },
      { label: "Claude, Gemini, GPT-5 models included" },
      { label: "Export to any provider of your choice" },
      { label: "Sharing preview template links" },
    ],
  },
  {
    tier: "medium",
    name: "Medium",
    description: "Amazing for small teams and agencies.",
    monthlyPrice: tierPrices.medium,
    cta: "Try Medium",
    featured: true,
    features: [
      { value: "250", label: "monthly credits", emphasized: true },
      { value: "150", label: "stored templates", emphasized: true },
      { value: "3", label: "members", emphasized: true },
      { label: "All models included" },
      { label: "Export to any provider of your choice" },
      { label: "Sharing preview template links" },
    ],
  },
  {
    tier: "pro",
    name: "Pro",
    description: "For agencies that need more storage and volume.",
    monthlyPrice: tierPrices.pro,
    cta: "Try Pro",
    features: [
      { value: "550", label: "monthly credits", emphasized: true },
      { value: "300", label: "stored templates", emphasized: true },
      { value: "10", label: "members", emphasized: true },
      { label: "All models included" },
      { label: "Export to any provider of your choice" },
      { label: "Sharing preview template links" },
    ],
  },
  // {
  //   tier: "enterprise",
  //   name: "Enterprise",
  //   description: "Built for large agencies needing flexibility, scale and governance",
  //   monthlyPrice: tierPrices.enterprise,
  //   cta: "Contact sales",
  //   features: [
  //     { label: "Custom monthly credits" },
  //     { label: "Custom stored templates" },
  //     { label: "Custom members" },
  //     { label: "Access to any model" },
  //     { label: "Export to any provider of your choice" },
  //     { label: "Sharing preview template links" },
  //   ],
  // },
];

function getDisplayPrice(monthlyPrice: number, billingInterval: BillingInterval) {
  if (billingInterval === "monthly") {
    return monthlyPrice;
  }

  return Math.round(monthlyPrice * 0.8);
}

function getYearlySavings(monthlyPrice: number) {
  return (monthlyPrice - getDisplayPrice(monthlyPrice, "yearly")) * 12;
}

function BillingSwitch({
  billingInterval,
  onChange,
}: {
  billingInterval: BillingInterval;
  onChange: (value: BillingInterval) => void;
}) {
  const isYearly = billingInterval === "yearly";

  return (
    <div className="flex items-center gap-4 text-sm leading-none text-madoo-nav max-sm:w-full max-sm:justify-between">
      <button
        type="button"
        className={
          isYearly
            ? "cursor-pointer text-madoo-muted"
            : "cursor-pointer text-madoo-ink"
        }
        onClick={() => onChange("monthly")}
      >
        Pay monthly
      </button>
      <button
        type="button"
        role="switch"
        aria-checked={isYearly}
        aria-label="Use yearly billing"
        className="relative h-6 w-11 shrink-0 cursor-pointer rounded-full bg-madoo-paper shadow-[0_1px_2px_rgb(var(--madoo-ink-shadow-rgb)/0.035),0_0_0_0.5px_rgb(var(--madoo-ink-shadow-rgb)/0.22)] transition hover:shadow-[0_2px_6px_rgb(var(--madoo-ink-shadow-rgb)/0.055),0_0_0_0.5px_rgb(var(--madoo-ink-shadow-rgb)/0.28)]"
        onClick={() => onChange(isYearly ? "monthly" : "yearly")}
      >
        <span
          className={`absolute left-1 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-madoo-ink transition-transform ${isYearly ? "translate-x-5" : "translate-x-0"
            }`}
        />
      </button>
      <button
        type="button"
        className={
          isYearly
            ? "cursor-pointer text-madoo-ink"
            : "cursor-pointer text-madoo-muted"
        }
        onClick={() => onChange("yearly")}
      >
        Pay yearly (Save 20%)
      </button>
    </div>
  );
}

function FeatureText({ value, label, emphasized }: PricingFeature) {
  if (!value) {
    return <span>{label}</span>;
  }

  return (
    <span>
      <strong className={emphasized ? "font-bold" : "font-normal"}>
        {value}
      </strong>{" "}
      {label}
    </span>
  );
}

function FeatureRow({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-0.5 text-madoo-copy" aria-hidden="true">
        <HugeiconsIcon icon={Tick02Icon} size={16} strokeWidth={2.2} />
      </span>
      {children}
    </li>
  );
}

function PriceBlock({
  monthlyPrice,
  billingInterval,
  helper,
  enterprisePricing,
}: {
  monthlyPrice: number;
  billingInterval: BillingInterval;
  helper?: string;
  enterprisePricing?: boolean;
}) {
  if (enterprisePricing) {
    return (
      <div className="mt- flex flex-col justify-center">
        <div className="text-2xl font-medium leading-none text-madoo-muted">
          Platform fee
        </div>
      </div>
    );
  }

  const displayPrice = getDisplayPrice(monthlyPrice, billingInterval);

  return (
    <div className="mt- flex flex-col justify-center">
      <div className="flex items-end gap-2">
        <span className="text-5xl font-semibold leading-none text-madoo-text">
          ${displayPrice}
        </span>
        <span className="flex items-center w-full justify-between gap-2 pb-1 text-sm text-madoo-muted">
          <span>/ month</span>
          {billingInterval === "yearly" ? (
            <span className="font-medium leading-none text-madoo-accent">
              Save ${getYearlySavings(monthlyPrice)}
            </span>
          ) : null}
        </span>
      </div>

      {helper ? (
        <p className="mt-3 text-sm leading-none text-madoo-muted">{helper}</p>
      ) : null}
    </div>
  );
}

function PlanCard({
  plan,
  billingInterval,
}: {
  plan: PricingPlan;
  billingInterval: BillingInterval;
}) {
  return (
    <article className="madoo-paper-border flex min-h-[420px] flex-col rounded-[28px] bg-madoo-paper p-6">
      <div className="flex min-h-[118px] items-start justify-between gap-4">
        <div className="w-full">
          <h2 className="text-2xl font-semibold leading-none text-madoo-text">
            {plan.name}
          </h2>
          {plan.description ? (
            <p className="mt-2 min-h-[48px] w-full text-sm leading-6 text-madoo-muted">
              {plan.description}
            </p>
          ) : (
            null
          )}
        </div>
        {plan.featured ? (
          <span className="rounded-full bg-madoo-accent px-3 py-1 text-xs font-semibold text-white">
            Popular
          </span>
        ) : null}
      </div>

      <PriceBlock
        monthlyPrice={plan.monthlyPrice}
        billingInterval={billingInterval}
        enterprisePricing={plan.tier === "enterprise"}
      />

      <Link
        className={`mt-8 inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg px-4 text-sm leading-none transition ${plan.featured
          ? "bg-madoo-ink text-white hover:bg-madoo-ink-hover"
          : "madoo-paper-border madoo-paper-border-hover bg-madoo-paper text-madoo-ink hover:bg-madoo-ink hover:text-white"
          }`}
        href="/"
      >
        {plan.cta}
      </Link>

      <ul className="mt-8 space-y-3 text-sm leading-6 text-madoo-copy">
        {plan.features.map((feature) => (
          <FeatureRow
            key={`${plan.name}-${feature.value ?? ""}-${feature.label}`}
          >
            <FeatureText {...feature} />
          </FeatureRow>
        ))}
      </ul>
    </article>
  );
}

export function PricingPlans() {
  const [billingInterval, setBillingInterval] =
    useState<BillingInterval>("yearly");

  return (
    <div className="flex w-full flex-col gap-6 font-ibm-plex-sans text-madoo-text">
      <div className="flex justify-end">
        <BillingSwitch
          billingInterval={billingInterval}
          onChange={setBillingInterval}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <PlanCard
            key={plan.tier}
            plan={plan}
            billingInterval={billingInterval}
          />
        ))}
      </div>
    </div>
  );
}
