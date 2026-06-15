"use client";

import {
  createCheckoutSession,
  createPortalSession,
  fetchBillingOverview,
} from "@/actions/billing";
import { useClientStore } from "@/stores/client-store";
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
import {
  PRICING_PLANS,
  getPlanDisplayPrice,
  getPlanYearlySavings,
  type BillingInterval,
  type Plan,
  type PricingFeature,
  type PricingPlan,
} from "@madoo/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";

type PaidPlan = Exclude<Plan, "FREE">;

const pricingFaqs = [
  {
    question: "Can I change my plan?",
    answer: "Yes. You can change your plan at any time.",
  },
  {
    question: "Is there any free trial?",
    answer:
      "Yes. New users get a 7-day free trial, and no credit card is needed.",
  },
  {
    question: "How do credits work?",
    answer:
      "Creating a template from scratch costs 1 credit. Each AI edit message costs 1 credit.",
  },
  {
    question: "What if I do not find my export provider?",
    answer:
      "Report it inside the platform with the add provider button. If we add it, we give you 150 AI credits.",
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

function getPlanCta(plan: PricingPlan, currentPlan: Plan, isCurrent: boolean) {
  if (isCurrent) return "Current plan";
  return currentPlan === "FREE"
    ? `Upgrade to ${plan.name}`
    : `Switch to ${plan.name}`;
}

function BillingSwitch({
  billingInterval,
  onChange,
}: {
  billingInterval: BillingInterval;
  onChange: (value: BillingInterval) => void;
}) {
  const isYearly = billingInterval === "ANNUAL";

  return (
    <div className="flex items-center gap-3 text-(length:--font-size-sm) leading-none text-madoo-ink-muted max-sm:w-full max-sm:justify-between">
      <button
        type="button"
        className={cx(
          "cursor-pointer border-0 bg-transparent p-0 font-madoo-sans transition-colors",
          isYearly ? "text-madoo-ink-muted" : "text-madoo-ink",
        )}
        onClick={() => onChange("MONTHLY")}
      >
        Pay monthly
      </button>
      <button
        type="button"
        role="switch"
        aria-checked={isYearly}
        aria-label="Use yearly billing"
        className="relative h-6 w-11 shrink-0 cursor-pointer rounded-full border-0 bg-madoo-surface shadow-madoo-border transition-[background,box-shadow] hover:bg-madoo-surface-2 hover:shadow-(--shadow-border-rule-hover)"
        onClick={() => onChange(isYearly ? "MONTHLY" : "ANNUAL")}
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
        onClick={() => onChange("ANNUAL")}
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
  currentPlan,
  hasStripeCustomer,
  checkoutPending,
  portalPending,
  onSelect,
  onManage,
}: {
  plan: PricingPlan;
  billingInterval: BillingInterval;
  currentPlan: Plan;
  hasStripeCustomer: boolean;
  checkoutPending: boolean;
  portalPending: boolean;
  onSelect: (plan: PricingPlan) => void;
  onManage: () => void;
}) {
  const interval = billingInterval === "ANNUAL" ? "yearly" : "monthly";
  const displayPrice = getPlanDisplayPrice(plan.monthlyPrice, interval);
  const isCurrent = plan.checkoutPlan === currentPlan;
  const buttonDisabled =
    (isCurrent && !hasStripeCustomer) || checkoutPending || portalPending;
  const cta = getPlanCta(plan, currentPlan, isCurrent);

  return (
    <Card
      className={cx(
        "flex min-h-97.5 flex-col gap-5 rounded-[20px]! bg-madoo-surface! p-4!",
        plan.featured &&
          "bg-[color-mix(in_srgb,var(--surface)_72%,var(--accent-soft))]! shadow-(--shadow-border-accent)",
      )}
    >
      <div className="flex min-h-18 items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-xl font-semibold leading-none text-madoo-ink">
            {plan.name}
          </h3>
          <p className="mt-2 text-(length:--font-size-sm) leading-5 text-madoo-ink-muted">
            {plan.description}
          </p>
        </div>
        {isCurrent ? (
          <Badge tone="neutral">Current</Badge>
        ) : plan.featured ? (
          <Badge tone="accent">Popular</Badge>
        ) : null}
      </div>

      <div>
        <div className="flex items-end gap-2">
          <span className="text-4xl font-semibold leading-none text-madoo-ink">
            ${displayPrice}
          </span>
          <span className="pb-1 text-(length:--font-size-sm) text-madoo-ink-muted">
            / month
          </span>
        </div>
        {billingInterval === "ANNUAL" ? (
          <p className="mt-2 text-(length:--font-size-sm) font-medium leading-none text-madoo-accent-deep">
            Save ${getPlanYearlySavings(plan.monthlyPrice)} yearly
          </p>
        ) : null}
      </div>

      <Button
        block
        size="md"
        variant={plan.featured ? "primary" : "secondary"}
        disabled={buttonDisabled}
        onClick={() => {
          if (isCurrent && hasStripeCustomer) {
            onManage();
            return;
          }
          onSelect(plan);
        }}
        className="mt-auto h-10! rounded-lg!"
      >
        {isCurrent && hasStripeCustomer ? "Manage billing" : cta}
      </Button>

      <ul className="grid gap-2.5 text-(length:--font-size-sm) leading-5 text-madoo-ink-soft">
        {plan.features.map((feature) => (
          <FeatureRow
            key={`${plan.id}-${feature.value ?? ""}-${feature.label}`}
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
    useState<BillingInterval>("ANNUAL");
  const workspaceId = useClientStore((state) => state.workspaceId);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const billingQuery = useQuery({
    queryKey: ["billing-overview", workspaceId],
    queryFn: fetchBillingOverview,
    enabled: open && Boolean(workspaceId),
  });

  const currentPlan = billingQuery.data?.subscription.plan ?? "FREE";
  const hasStripeCustomer =
    billingQuery.data?.subscription.hasStripeCustomer ?? false;

  const checkoutMutation = useMutation({
    mutationFn: (input: { plan: PaidPlan; interval: BillingInterval }) =>
      createCheckoutSession(input),
    onSuccess: (session) => {
      window.location.assign(session.url);
    },
    onError: (error) => {
      toast({
        tone: "danger",
        title: "Checkout failed",
        body:
          error instanceof Error
            ? error.message
            : "Could not start checkout.",
      });
    },
  });

  const portalMutation = useMutation({
    mutationFn: createPortalSession,
    onSuccess: (session) => {
      window.location.assign(session.url);
    },
    onError: (error) => {
      toast({
        tone: "danger",
        title: "Billing portal failed",
        body:
          error instanceof Error
            ? error.message
            : "Could not open billing portal.",
      });
    },
  });

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
    if (!workspaceId) {
      toast({
        tone: "danger",
        title: "Workspace required",
        body: "Sign in and select a workspace before checkout.",
      });
      return;
    }

    checkoutMutation.mutate({
      plan: plan.checkoutPlan,
      interval: billingInterval,
    });
  };

  const onManageBilling = () => {
    portalMutation.mutate(undefined, {
      onSettled: () => {
        void queryClient.invalidateQueries({
          queryKey: ["billing-overview", workspaceId],
        });
      },
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
        className="flex max-h-[calc(100dvh-32px)] w-full max-w-245 flex-col overflow-hidden rounded-[24px] bg-madoo-bg font-madoo-sans text-madoo-ink shadow-(--shadow-border-rule-hover) animate-madoo-modal-in max-sm:max-h-[calc(100dvh-24px)] max-sm:rounded-[20px] motion-reduce:animate-none"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start gap-3 px-5 py-4 shadow-(--shadow-border-bottom-soft) max-sm:px-4">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[linear-gradient(180deg,color-mix(in_srgb,var(--accent)_92%,white),var(--accent-deep))] text-madoo-accent-fg shadow-[inset_0_0_0_0.5px_rgb(255_255_255/0.28)]">
            <AppIcon icon={Crown02Icon} size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-(length:--font-size-xs) font-medium uppercase leading-none tracking-[0.08em] text-madoo-ink-muted">
              Plans & Pricing
            </div>
            <h2
              id="pricing-drawer-title"
              className="mt-1 text-xl font-semibold leading-none text-madoo-ink"
            >
              Upgrade your workspace
            </h2>
            <p className="mt-2 max-w-2xl text-(length:--font-size-sm) leading-5 text-madoo-ink-muted">
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
            {PRICING_PLANS.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                billingInterval={billingInterval}
                currentPlan={currentPlan}
                hasStripeCustomer={hasStripeCustomer}
                checkoutPending={checkoutMutation.isPending}
                portalPending={portalMutation.isPending}
                onSelect={onSelectPlan}
                onManage={onManageBilling}
              />
            ))}
          </div>

          <section className="mt-5 rounded-[20px] bg-madoo-surface p-4 shadow-madoo-border">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold leading-none text-madoo-ink">
                  Frequently asked questions
                </h3>
                <p className="mt-2 text-(length:--font-size-sm) leading-5 text-madoo-ink-muted">
                  Short answers before you change workspace billing.
                </p>
              </div>
              <Badge tone="neutral">Billing</Badge>
            </div>

            <div className="mt-4 grid gap-2 lg:grid-cols-2">
              {pricingFaqs.map((faq) => (
                <details
                  key={faq.question}
                  className="group rounded-lg bg-madoo-bg-2 px-3.5 py-3 shadow-madoo-border"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-left text-(length:--font-size-sm) font-medium text-madoo-ink [&::-webkit-details-marker]:hidden">
                    {faq.question}
                    <Icon
                      name="chevronDown"
                      size={14}
                      className="shrink-0 text-madoo-ink-muted transition-transform group-open:rotate-180"
                    />
                  </summary>
                  <p className="mt-2 text-(length:--font-size-sm) leading-5 text-madoo-ink-muted">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
