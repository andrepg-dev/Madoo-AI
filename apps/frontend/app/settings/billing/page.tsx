"use client";

import { billingApi, billingKeys } from "@/actions/billing";
import { ApiError } from "@/lib/api/fetch-wrapper";
import { useWorkspaceStore } from "@/stores/workspace";
import {
  PLAN_DISPLAY_NAMES,
  PLAN_LIMITS,
  PLAN_PRICES,
  PLAN_PRICES_ANNUAL,
  type BillingInterval,
  type Plan,
} from "@madoo/shared";
import { Banner, Button, Card, Icon, ProgressBar, Skeleton } from "@madoo/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type PaidPlan = Exclude<Plan, "FREE">;

const PLAN_FEATURES: Record<Plan | "SCALE", { label: string; included: boolean; header?: boolean }[]> = {
  FREE: [
    { label: "1 workspace", included: true },
    { label: "5 AI generations / month", included: true },
    { label: "Template export", included: true },
    { label: "Full template library", included: false },
    { label: "Priority support", included: false },
  ],
  STARTER: [
    { label: "Up to 5 workspaces", included: true },
    { label: "100 AI generations / month", included: true },
    { label: "Template export", included: true },
    { label: "Full template library", included: true },
    { label: "Variable defaults", included: true },
    { label: "Priority support", included: false },
  ],
  GROWTH: [
    { label: "Unlimited workspaces", included: true },
    { label: "Unlimited AI generations", included: true },
    { label: "Premium template gallery", included: true },
    { label: "Template export", included: true },
    { label: "Variable defaults", included: true },
    { label: "Priority support (4h response)", included: true },
  ],
  SCALE: [
    { label: "Everything in Growth, plus:", included: true, header: true },
    { label: "Custom AI fine-tuned to your brand", included: true },
    { label: "Multi-workspace & team roles", included: true },
    { label: "SSO (Google, Okta, SAML)", included: true },
    { label: "API access", included: true },
    { label: "Dedicated success manager", included: true },
    { label: "99.9% SLA + onboarding call", included: true },
  ],
};

const FAQ_ITEMS = [
  {
    q: "What counts as an AI generation?",
    a: "Each new email created from a prompt is one generation. Edits and revisions on the same email don't count — iterate freely.",
  },
  {
    q: "Can I switch plans anytime?",
    a: "Yes. Upgrade and you're billed prorated; downgrade and the new rate kicks in next cycle. No fees, no calls.",
  },
  {
    q: "How does annual billing work?",
    a: "Annual plans are billed upfront for the full year at a 20% discount. You can switch back to monthly at renewal.",
  },
];

function FaqItem({ item, first }: { item: (typeof FAQ_ITEMS)[number]; first: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderTop: first ? "none" : "1px solid var(--border-soft)" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          padding: "18px 22px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          fontFamily: "inherit",
          textAlign: "left",
          fontSize: 14,
          fontWeight: 600,
          color: "var(--ink)",
          gap: 16,
        }}
      >
        {item.q}
        <div
          style={{
            flexShrink: 0,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
            color: "var(--ink-soft)",
          }}
        >
          <Icon name="chevronDown" size={16} />
        </div>
      </button>
      {open && (
        <div
          style={{
            padding: "0 22px 18px",
            fontSize: 13.5,
            color: "var(--ink-soft)",
            lineHeight: 1.6,
          }}
        >
          {item.a}
        </div>
      )}
    </div>
  );
}

function formatResetTime(value: string | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function BillingPageContent() {
  const qc = useQueryClient();
  const hydrateWorkspaceId = useWorkspaceStore((s) => s.hydrateWorkspaceId);
  const searchParams = useSearchParams();
  const upgraded = searchParams?.get("upgraded") === "1";
  const canceled = searchParams?.get("canceled") === "1";
  const [billing, setBilling] = useState<BillingInterval>("MONTHLY");

  useEffect(() => {
    hydrateWorkspaceId();
  }, [hydrateWorkspaceId]);

  const overview = useQuery({
    queryKey: billingKeys.overview(),
    queryFn: () => billingApi.overview(),
  });

  const checkout = useMutation({
    mutationFn: (input: { plan: PaidPlan; interval: BillingInterval }) =>
      billingApi.createCheckoutSession(input),
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });

  const portal = useMutation({
    mutationFn: () => billingApi.createPortalSession(),
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });

  useEffect(() => {
    if (upgraded) {
      void qc.invalidateQueries({ queryKey: billingKeys.all });
    }
  }, [upgraded, qc]);

  const data = overview.data;
  const currentPlan: Plan = data?.subscription.plan ?? "FREE";
  const genUsed = data?.usage.aiGenerations.used ?? 0;
  const genLimit = data?.usage.aiGenerations.limit ?? PLAN_LIMITS[currentPlan].aiGenerations;
  const genUnlimited = genLimit === -1;
  const genPct = genUnlimited ? 0 : Math.min(100, Math.round((genUsed / genLimit) * 100));
  const genResetTime = formatResetTime(data?.usage.aiGenerations.resetsAt);
  const genExhausted = !genUnlimited && genUsed >= genLimit;

  const errorMessage =
    checkout.error instanceof ApiError
      ? checkout.error.message
      : portal.error instanceof ApiError
        ? portal.error.message
        : null;

  const plans: Array<{
    id: Plan | "SCALE";
    name: string;
    tagline: string;
    highlight: boolean;
    badge?: string;
    cta: string;
    scaleOnly?: boolean;
  }> = [
      { id: "FREE", name: "Free", tagline: "Try it without a card.", highlight: false, cta: "Get started" },
      {
        id: "STARTER",
        name: "Starter",
        tagline: "For founders shipping their first launches.",
        highlight: false,
        cta: "Upgrade to Starter",
      },
      {
        id: "GROWTH",
        name: "Growth",
        tagline: "When templates become core workflow.",
        highlight: true,
        badge: "Most popular",
        cta: "Upgrade to Growth",
      },
      {
        id: "SCALE",
        name: "Scale",
        tagline: "Big workspaces, custom AI, deeper support.",
        highlight: false,
        cta: "Talk to sales",
        scaleOnly: true,
      },
    ];

  return (
    <div style={{ flex: 1, overflowY: "auto", background: "var(--bg)" }}>
      <div style={{ padding: "32px 40px 80px", maxWidth: 1180, margin: "0 auto" }}>
        <Link
          href="/settings"
          style={{
            fontSize: 12,
            color: "var(--ink-soft)",
            textDecoration: "none",
            display: "inline-flex",
            gap: 6,
            alignItems: "center",
          }}
        >
          ← Back to settings
        </Link>

        {/* ALERTS */}
        {upgraded ? (
          <Banner tone="success" style={{ marginTop: 12, marginBottom: 0 }}>
            Subscription updated. The new plan should appear within a few seconds.
          </Banner>
        ) : null}
        {canceled ? (
          <Banner tone="warn" style={{ marginTop: 12, marginBottom: 0 }}>
            Checkout was cancelled. Your plan is unchanged.
          </Banner>
        ) : null}
        {errorMessage ? (
          <Banner tone="danger" style={{ marginTop: 12, marginBottom: 0 }}>
            {errorMessage}
          </Banner>
        ) : null}

        {/* CURRENT PLAN CARD */}
        <Card padded style={{ marginTop: 20, marginBottom: 32, display: "flex", flexDirection: "column", gap: 14 }}>
          {overview.isPending ? (
            <div style={{ display: "grid", gap: 12 }}>
              <Skeleton variant="text" width={120} height={11} />
              <Skeleton width={180} height={30} />
              <Skeleton width="60%" height={12} />
              <Skeleton width="100%" height={10} />
            </div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: 1,
                      textTransform: "uppercase",
                      color: "var(--ink-faint)",
                    }}
                  >
                    Current plan
                  </div>
                  <div
                    className="serif"
                    style={{ fontSize: 26, fontWeight: 400, marginTop: 4, letterSpacing: -0.3 }}
                  >
                    {PLAN_DISPLAY_NAMES[currentPlan]}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 2 }}>
                    {PLAN_PRICES[currentPlan] === 0
                      ? "Free forever. Upgrade to unlock more generations and features."
                      : `$${PLAN_PRICES[currentPlan]}/mo`}
                    {data?.subscription.cancelAtPeriodEnd ? " · Cancels at period end." : ""}
                  </div>
                </div>
                {data?.subscription.hasStripeCustomer ? (
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() => portal.mutate()}
                    disabled={portal.isPending}
                  >
                    {portal.isPending ? "Opening…" : "Manage billing"}
                  </Button>
                ) : null}
              </div>
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--ink-soft)",
                    marginBottom: 6,
                  }}
                >
                  <span>AI generations this month</span>
                  <span>
                    {genUsed.toLocaleString()} / {genUnlimited ? "∞" : genLimit.toLocaleString()}
                  </span>
                </div>
                {genUnlimited ? (
                  <ProgressBar value={0} aria-label="AI generations (unlimited)" />
                ) : (
                  <ProgressBar value={genPct} aria-label="AI generation usage" />
                )}
                {!genUnlimited && genResetTime ? (
                  <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 8 }}>
                    {genExhausted ? "AI credits enabled again" : "AI credits reset"} {genResetTime}
                  </div>
                ) : null}
              </div>
            </>
          )}
        </Card>

        {/* PRICING HEADER */}
        <div style={{ textAlign: "center", maxWidth: 580, margin: "0 auto" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 12px",
              background: "var(--accent-soft)",
              color: "var(--accent-deep)",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <Icon name="sparkle" size={12} /> Pricing that grows with you
          </div>
          <h1
            className="serif"
            style={{
              fontSize: 44,
              fontWeight: 400,
              lineHeight: 1.05,
              letterSpacing: -0.8,
              margin: "16px 0 0",
              color: "var(--ink)",
            }}
          >
            Send beautiful emails{" "}
            <span style={{ fontStyle: "italic", color: "var(--accent-deep)" }}>at any scale.</span>
          </h1>
          <p style={{ fontSize: 15, color: "var(--ink-soft)", marginTop: 12, lineHeight: 1.55 }}>
            Start free. Upgrade when your list does. Cancel anytime — really.
          </p>

          {/* BILLING TOGGLE */}
          <div
            style={{
              display: "inline-flex",
              marginTop: 24,
              padding: 4,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 999,
              gap: 4,
            }}
          >
            <button
              onClick={() => setBilling("MONTHLY")}
              style={{
                padding: "8px 18px",
                borderRadius: 999,
                border: "none",
                background: billing === "MONTHLY" ? "var(--ink)" : "transparent",
                color: billing === "MONTHLY" ? "var(--bg)" : "var(--ink-soft)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("ANNUAL")}
              style={{
                padding: "8px 18px",
                borderRadius: 999,
                border: "none",
                background: billing === "ANNUAL" ? "var(--ink)" : "transparent",
                color: billing === "ANNUAL" ? "var(--bg)" : "var(--ink-soft)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              Annual
              <span
                style={{
                  padding: "2px 7px",
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 0.3,
                  background: billing === "ANNUAL" ? "var(--accent)" : "var(--accent-soft)",
                  color: billing === "ANNUAL" ? "var(--accent-fg)" : "var(--accent-deep)",
                }}
              >
                SAVE 20%
              </span>
            </button>
          </div>
        </div>

        {/* PLAN GRID */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 14,
            marginTop: 36,
            alignItems: "stretch",
          }}
        >
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlan;
            const isHighlight = plan.highlight;
            const isScale = plan.scaleOnly;
            const monthlyPrice =
              plan.id === "FREE"
                ? 0
                : plan.id === "SCALE"
                  ? 199
                  : PLAN_PRICES[plan.id as Plan];
            const annualPrice =
              plan.id === "FREE"
                ? 0
                : plan.id === "SCALE"
                  ? 159
                  : PLAN_PRICES_ANNUAL[plan.id as Plan];
            const displayPrice = billing === "ANNUAL" ? annualPrice : monthlyPrice;
            const features = PLAN_FEATURES[plan.id];

            return (
              <div
                key={plan.id}
                style={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  background: isHighlight ? "var(--ink)" : "var(--surface)",
                  color: isHighlight ? "var(--bg)" : "var(--ink)",
                  border: isHighlight ? "1px solid var(--ink)" : "1px solid var(--border)",
                  borderRadius: 18,
                  padding: "28px 20px 22px",
                  transform: isHighlight ? "translateY(-6px)" : "none",
                  boxShadow: isHighlight
                    ? "0 20px 44px -16px rgba(20,15,10,0.3)"
                    : "0 1px 0 rgba(0,0,0,0.02)",
                }}
              >
                {plan.badge && (
                  <div
                    style={{
                      position: "absolute",
                      top: -11,
                      left: "50%",
                      transform: "translateX(-50%)",
                      padding: "4px 12px",
                      borderRadius: 999,
                      fontSize: 10.5,
                      fontWeight: 700,
                      letterSpacing: 0.5,
                      background: "var(--accent)",
                      color: "var(--accent-fg)",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      textTransform: "uppercase",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <Icon name="star" size={9} stroke={2} /> {plan.badge}
                  </div>
                )}

                <div className="serif" style={{ fontSize: 28, fontWeight: 400, letterSpacing: -0.3, lineHeight: 1 }}>
                  {plan.name}
                </div>
                <div
                  style={{
                    fontSize: 12.5,
                    color: isHighlight ? "rgba(250,247,240,0.65)" : "var(--ink-soft)",
                    marginTop: 6,
                    lineHeight: 1.4,
                    minHeight: 34,
                  }}
                >
                  {plan.tagline}
                </div>

                {/* PRICE */}
                <div
                  style={{
                    marginTop: 16,
                    paddingBottom: 16,
                    borderBottom: isHighlight ? "1px solid rgba(255,255,255,0.1)" : "1px solid var(--border)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, opacity: 0.65 }}>$</div>
                    <div className="serif" style={{ fontSize: 50, fontWeight: 400, letterSpacing: -1.5, lineHeight: 1 }}>
                      {displayPrice}
                    </div>
                    <div style={{ fontSize: 12, color: isHighlight ? "rgba(250,247,240,0.55)" : "var(--ink-faint)", fontWeight: 500 }}>
                      /mo
                    </div>
                  </div>
                  {billing === "ANNUAL" && monthlyPrice > 0 ? (
                    <div style={{ fontSize: 11.5, color: isHighlight ? "rgba(250,247,240,0.5)" : "var(--ink-faint)", marginTop: 3 }}>
                      <s>${monthlyPrice}/mo</s> — billed annually
                    </div>
                  ) : monthlyPrice === 0 ? (
                    <div style={{ fontSize: 11.5, color: isHighlight ? "rgba(250,247,240,0.5)" : "var(--ink-faint)", marginTop: 3 }}>
                      Free forever, no card needed
                    </div>
                  ) : null}
                </div>

                {/* CTA */}
                {isCurrent ? (
                  <div
                    style={{
                      marginTop: 14,
                      padding: "10px 14px",
                      borderRadius: 9,
                      border: isHighlight ? "1px solid rgba(255,255,255,0.2)" : "1px solid var(--border)",
                      fontSize: 13,
                      fontWeight: 600,
                      textAlign: "center",
                      color: isHighlight ? "rgba(250,247,240,0.7)" : "var(--ink-soft)",
                    }}
                  >
                    Current plan
                  </div>
                ) : isScale ? (
                  <a
                    href="mailto:sales@madoo.ai"
                    style={{
                      marginTop: 14,
                      padding: "10px 14px",
                      borderRadius: 9,
                      border: "none",
                      background: "var(--ink)",
                      color: "var(--bg)",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      textDecoration: "none",
                    }}
                  >
                    Talk to sales <Icon name="arrow" size={12} />
                  </a>
                ) : plan.id === "FREE" ? (
                  <div
                    style={{
                      marginTop: 14,
                      padding: "10px 14px",
                      borderRadius: 9,
                      border: "1px solid var(--border)",
                      fontSize: 13,
                      fontWeight: 600,
                      textAlign: "center",
                      color: "var(--ink-soft)",
                    }}
                  >
                    Default plan
                  </div>
                ) : (
                  <button
                    style={{
                      marginTop: 14,
                      padding: "10px 14px",
                      borderRadius: 9,
                      border: "none",
                      background: isHighlight ? "var(--accent)" : "var(--ink)",
                      color: isHighlight ? "var(--accent-fg)" : "var(--bg)",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: checkout.isPending ? "not-allowed" : "pointer",
                      fontFamily: "inherit",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      opacity: checkout.isPending ? 0.6 : 1,
                    }}
                    disabled={checkout.isPending}
                    onClick={() => checkout.mutate({ plan: plan.id as PaidPlan, interval: billing })}
                  >
                    {checkout.isPending ? "Opening checkout…" : plan.cta}
                    {!checkout.isPending && <Icon name="arrow" size={12} />}
                  </button>
                )}

                {/* FEATURE LIST */}
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                  {features.map((f, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 8,
                        fontSize: 12.5,
                        lineHeight: 1.4,
                        color: f.header
                          ? isHighlight
                            ? "rgba(250,247,240,0.95)"
                            : "var(--ink)"
                          : f.included
                            ? isHighlight
                              ? "rgba(250,247,240,0.88)"
                              : "var(--ink-soft)"
                            : isHighlight
                              ? "rgba(250,247,240,0.35)"
                              : "var(--ink-faint)",
                        fontWeight: f.header ? 600 : 500,
                        textDecoration: f.included || f.header ? "none" : "line-through",
                        paddingTop: f.header && i > 0 ? 4 : 0,
                      }}
                    >
                      {!f.header && (
                        <div
                          style={{
                            flexShrink: 0,
                            marginTop: 2,
                            color: f.included
                              ? isHighlight
                                ? "var(--accent)"
                                : "var(--accent-deep)"
                              : "inherit",
                          }}
                        >
                          {f.included ? (
                            <Icon name="check" size={13} stroke={2.4} />
                          ) : (
                            <Icon name="x" size={11} />
                          )}
                        </div>
                      )}
                      <span>{f.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* TRUST STRIP */}
        <div
          style={{
            marginTop: 44,
            padding: "22px 28px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          {[
            { icon: "check" as const, label: "14-day money-back guarantee" },
            { icon: "lock" as const, label: "SOC 2 Type II + GDPR" },
            { icon: "bolt" as const, label: "99.9% uptime SLA" },
            { icon: "sparkle" as const, label: "Cancel in one click" },
          ].map((t) => (
            <div
              key={t.label}
              style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--ink)", fontWeight: 500 }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  background: "var(--accent-soft)",
                  color: "var(--accent-deep)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon name={t.icon} size={14} />
              </div>
              {t.label}
            </div>
          ))}
        </div>

        {/* MIGRATION CTA */}
        <div
          style={{
            marginTop: 28,
            padding: "28px 32px",
            background: "var(--ink)",
            color: "var(--bg)",
            borderRadius: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: 280 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: 0.5,
                color: "var(--accent)",
                textTransform: "uppercase",
              }}
            >
              <Icon name="sparkle" size={12} /> The Madoo switch
            </div>
            <div
              className="serif"
              style={{ fontSize: 28, fontWeight: 400, marginTop: 6, lineHeight: 1.1, letterSpacing: -0.3 }}
            >
              Coming from Mailchimp or Klaviyo?
            </div>
            <div
              style={{
                fontSize: 14,
                color: "rgba(250,247,240,0.7)",
                marginTop: 6,
                lineHeight: 1.5,
                maxWidth: 520,
              }}
            >
              We migrate your templates free of charge. Most teams are fully set up within 48 hours.
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <a
              href="mailto:asponceg@gmail.com?subject=Feature comparison"
              style={{
                padding: "11px 18px",
                borderRadius: 9,
                border: "1px solid rgba(255,255,255,0.2)",
                background: "transparent",
                color: "var(--bg)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              Compare features
            </a>
            <a
              href="mailto:asponceg@gmail.com?subject=Migration call"
              style={{
                padding: "11px 18px",
                borderRadius: 9,
                border: "none",
                background: "var(--accent)",
                color: "var(--accent-fg)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                textDecoration: "none",
              }}
            >
              Book migration call <Icon name="arrow" size={12} />
            </a>
          </div>
        </div>

        {/* FAQ */}
        <div style={{ marginTop: 52 }}>
          <div style={{ textAlign: "center", maxWidth: 540, margin: "0 auto 24px" }}>
            <h2
              className="serif"
              style={{ fontSize: 34, fontWeight: 400, margin: 0, letterSpacing: -0.5 }}
            >
              Common questions
            </h2>
            <p style={{ fontSize: 14, color: "var(--ink-soft)", marginTop: 6 }}>
              Still wondering?{" "}
              <a href="mailto:asponceg@gmail.com" style={{ color: "var(--accent-deep)", fontWeight: 600, textDecoration: "none" }}>
                Talk to a human →
              </a>
            </p>
          </div>
          <div
            style={{
              maxWidth: 720,
              margin: "0 auto",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            {FAQ_ITEMS.map((item, i) => (
              <FaqItem key={i} item={item} first={i === 0} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense>
      <BillingPageContent />
    </Suspense>
  );
}
