"use client";

import { Crown02Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  Badge,
  Button,
  Card,
  Icon,
  IconButton,
  cx,
  useToast,
} from "@madoo/design-system";
import { useEffect, useState, type ReactNode } from "react";

type BillingInterval = "monthly" | "yearly";
type PlanTier = "basic" | "medium" | "pro";

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

const plans: PricingPlan[] = [
  {
    tier: "basic",
    name: "Basic",
    description: "For solo creators building more templates and exports.",
    monthlyPrice: 20,
    cta: "Try Basic",
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
    tier: "medium",
    name: "Medium",
    description: "Amazing for small teams and agencies.",
    monthlyPrice: 45,
    cta: "Try Medium",
    featured: true,
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
    tier: "pro",
    name: "Pro",
    description: "For agencies that need more storage and volume.",
    monthlyPrice: 95,
    cta: "Try Pro",
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

function AppIcon({ icon, size = 16 }: { icon: IconSvgElement; size?: number }) {
  return (
    <HugeiconsIcon
      aria-hidden="true"
      focusable="false"
      icon={icon}
      primaryColor="currentColor"
      size={size}
      strokeWidth={1.45}
    />
  );
}

function getDisplayPrice(monthlyPrice: number, billingInterval: BillingInterval) {
  if (billingInterval === "monthly") return monthlyPrice;
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
    <div className="flex items-center gap-3 text-[length:var(--font-size-sm)] leading-none text-madoo-ink-muted max-sm:w-full max-sm:justify-between">
      <button
        type="button"
        className={cx(
          "cursor-pointer border-0 bg-transparent p-0 font-madoo-sans transition-colors",
          isYearly ? "text-madoo-ink-muted" : "text-madoo-ink",
        )}
        onClick={() => onChange("monthly")}
      >
        Pay monthly
      </button>
      <button
        type="button"
        role="switch"
        aria-checked={isYearly}
        aria-label="Use yearly billing"
        className="relative h-6 w-11 shrink-0 cursor-pointer rounded-full border-0 bg-madoo-surface shadow-[var(--shadow-border)] transition-[background,box-shadow] hover:bg-madoo-surface-2 hover:shadow-[var(--shadow-border-rule-hover)]"
        onClick={() => onChange(isYearly ? "monthly" : "yearly")}
      >
        <span
          className={cx(
            "absolute left-1 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-madoo-ink transition-transform",
            isYearly ? "translate-x-5" : "translate-x-0",
          )}
        />
      </button>
      <button
        type="button"
        className={cx(
          "cursor-pointer border-0 bg-transparent p-0 font-madoo-sans transition-colors",
          isYearly ? "text-madoo-ink" : "text-madoo-ink-muted",
        )}
        onClick={() => onChange("yearly")}
      >
        Pay yearly (Save 20%)
      </button>
    </div>
  );
}

function FeatureText({ value, label, emphasized }: PricingFeature) {
  if (!value) return <span>{label}</span>;

  return (
    <span>
      <strong className={emphasized ? "font-semibold" : "font-normal"}>
        {value}
      </strong>{" "}
      {label}
    </span>
  );
}

function FeatureRow({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span
        className="mt-0.5 inline-flex text-madoo-accent-deep"
        aria-hidden="true"
      >
        <AppIcon icon={Tick02Icon} size={15} />
      </span>
      <span className="min-w-0">{children}</span>
    </li>
  );
}

function PlanCard({
  plan,
  billingInterval,
  onSelect,
}: {
  plan: PricingPlan;
  billingInterval: BillingInterval;
  onSelect: (plan: PricingPlan) => void;
}) {
  const displayPrice = getDisplayPrice(plan.monthlyPrice, billingInterval);

  return (
    <Card
      className={cx(
        "flex min-h-[390px] flex-col gap-5 !rounded-[20px] !bg-madoo-surface !p-4",
        plan.featured &&
          "!bg-[color-mix(in_srgb,var(--surface)_72%,var(--accent-soft))] shadow-[var(--shadow-border-accent)]",
      )}
    >
      <div className="flex min-h-[72px] items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-xl font-semibold leading-none text-madoo-ink">
            {plan.name}
          </h3>
          <p className="mt-2 text-[length:var(--font-size-sm)] leading-5 text-madoo-ink-muted">
            {plan.description}
          </p>
        </div>
        {plan.featured ? <Badge tone="accent">Popular</Badge> : null}
      </div>

      <div>
        <div className="flex items-end gap-2">
          <span className="text-4xl font-semibold leading-none text-madoo-ink">
            ${displayPrice}
          </span>
          <span className="pb-1 text-[length:var(--font-size-sm)] text-madoo-ink-muted">
            / month
          </span>
        </div>
        {billingInterval === "yearly" ? (
          <p className="mt-2 text-[length:var(--font-size-sm)] font-medium leading-none text-madoo-accent-deep">
            Save ${getYearlySavings(plan.monthlyPrice)} yearly
          </p>
        ) : null}
      </div>

      <Button
        block
        size="md"
        variant={plan.featured ? "primary" : "secondary"}
        onClick={() => onSelect(plan)}
        className="mt-auto h-10! rounded-[var(--radius-lg)]!"
      >
        {plan.cta}
      </Button>

      <ul className="grid gap-2.5 text-[length:var(--font-size-sm)] leading-5 text-madoo-ink-soft">
        {plan.features.map((feature) => (
          <FeatureRow
            key={`${plan.tier}-${feature.value ?? ""}-${feature.label}`}
          >
            <FeatureText {...feature} />
          </FeatureRow>
        ))}
      </ul>
    </Card>
  );
}

export function PricingDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [billingInterval, setBillingInterval] =
    useState<BillingInterval>("yearly");
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const onSelectPlan = (plan: PricingPlan) => {
    toast({
      tone: "success",
      title: `${plan.name} selected`,
      body: "Checkout is not connected yet.",
    });
  };

  return (
    <div
      className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-[rgba(20,15,10,0.28)] p-4 backdrop-blur-[2px] animate-madoo-modal-overlay-in motion-reduce:animate-none"
      role="presentation"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="pricing-drawer-title"
        className="flex max-h-[calc(100dvh-32px)] w-full max-w-[980px] flex-col overflow-hidden rounded-[24px] bg-madoo-bg font-madoo-sans text-madoo-ink shadow-[var(--shadow-border-rule-hover)] animate-madoo-modal-in max-sm:max-h-[calc(100dvh-24px)] max-sm:rounded-[20px] motion-reduce:animate-none"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start gap-3 px-5 py-4 shadow-[var(--shadow-border-bottom-soft)] max-sm:px-4">
          <span className="grid size-9 shrink-0 place-items-center rounded-[var(--radius-lg)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--accent)_92%,white),var(--accent-deep))] text-madoo-accent-fg shadow-[inset_0_0_0_0.5px_rgb(255_255_255_/_0.28)]">
            <AppIcon icon={Crown02Icon} size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[length:var(--font-size-xs)] font-medium uppercase leading-none tracking-[0.08em] text-madoo-ink-muted">
              Plans & Pricing
            </div>
            <h2
              id="pricing-drawer-title"
              className="mt-1 text-xl font-semibold leading-none text-madoo-ink"
            >
              Upgrade your workspace
            </h2>
            <p className="mt-2 max-w-2xl text-[length:var(--font-size-sm)] leading-5 text-madoo-ink-muted">
              More credits, stored templates, members, test emails, model
              access, exports, and preview sharing.
            </p>
          </div>
          <IconButton
            aria-label="Close pricing drawer"
            size="sm"
            variant="outline"
            onClick={onClose}
          >
            <Icon name="x" size={14} />
          </IconButton>
        </header>

        <div className="madoo-command-scrollbar flex-1 overflow-y-auto px-5 py-4 max-sm:px-4">
          <div className="mb-4 flex justify-end">
            <BillingSwitch
              billingInterval={billingInterval}
              onChange={setBillingInterval}
            />
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            {plans.map((plan) => (
              <PlanCard
                key={plan.tier}
                plan={plan}
                billingInterval={billingInterval}
                onSelect={onSelectPlan}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
