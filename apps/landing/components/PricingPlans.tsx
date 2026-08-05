"use client";

import { Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PRICING_PLANS,
  getPlanDisplayPrice,
  getPlanYearlySavings,
  type PricingBillingInterval,
  type PricingFeature,
  type PricingPlan,
} from "@madoo/shared";
import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";
import { useState } from "react";
import { clientCheckoutUrl, isLikelySignedIn } from "@/lib/client-app";

type BillingInterval = PricingBillingInterval;

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
        Pay yearly (Save 16%)
      </button>
    </div>
  );
}

function ComingSoonTag() {
  return (
    <span className="ml-1.5 whitespace-nowrap rounded-full bg-madoo-muted/10 px-1.5 py-0.5 align-middle text-[10px] font-medium uppercase tracking-[0.04em] text-madoo-muted">
      Coming soon
    </span>
  );
}

function FeatureText({ value, label, emphasized, comingSoon }: PricingFeature) {
  return (
    <span className={comingSoon ? "text-madoo-muted" : undefined}>
      {value ? (
        <>
          <strong className={emphasized ? "font-bold" : "font-normal"}>
            {value}
          </strong>{" "}
        </>
      ) : null}
      {label}
      {comingSoon ? <ComingSoonTag /> : null}
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
}: {
  monthlyPrice: number;
  billingInterval: BillingInterval;
  helper?: string;
}) {
  const displayPrice = getPlanDisplayPrice(monthlyPrice, billingInterval);

  return (
    <div className="mt- flex flex-col justify-center">
      <div className="flex items-end gap-2">
        <span className="text-5xl font-semibold leading-none text-madoo-text">
          ${displayPrice}
        </span>
        <span className="flex items-center w-full justify-between gap-2 pb-1 text-sm text-madoo-muted">
          <span>/ month</span>
          {/* A $0 plan has nothing to save on yearly billing. */}
          {billingInterval === "yearly" && monthlyPrice > 0 ? (
            <span className="font-medium leading-none text-madoo-accent">
              Save ${getPlanYearlySavings(monthlyPrice)}
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
    <article className="madoo-paper-border flex min-h-105 flex-col rounded-[28px] bg-madoo-paper p-6">
      <div className="flex min-h-20 items-start justify-between gap-4">
        <div className="w-full">
          <h2 className="text-2xl font-semibold leading-none text-madoo-text">
            {plan.name}
          </h2>
          {plan.description ? (
            <p className="mt-2 min-h-12 w-full text-sm leading-6 text-madoo-muted">
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
      />

      <Link
        className={`mt-8 inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg px-4 text-sm leading-none transition ${plan.featured
          ? "bg-madoo-ink text-white hover:bg-madoo-ink-hover"
          : "madoo-paper-border madoo-paper-border-hover bg-madoo-paper text-madoo-ink hover:bg-madoo-ink hover:text-white"
          }`}
        href="/"
        onClick={(event: MouseEvent<HTMLAnchorElement>) => {
          // The Free card has nothing to charge for: always fall through to
          // the default href ("/") and let the app sign the visitor up.
          if (!plan.checkoutPlan) return;
          // Signed-in visitors skip the home/signup flow and go straight to
          // Stripe with this plan preselected. Anyone else keeps the default
          // href ("/"), where the app prompts them to sign up first.
          if (!isLikelySignedIn()) return;
          event.preventDefault();
          window.location.assign(
            clientCheckoutUrl(
              plan.checkoutPlan,
              billingInterval === "yearly" ? "ANNUAL" : "MONTHLY",
            ),
          );
        }}
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {PRICING_PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            billingInterval={billingInterval}
          />
        ))}
      </div>
    </div>
  );
}
