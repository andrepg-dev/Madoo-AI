"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Banner, Button, Card, ProgressBar, Skeleton } from "@madoo/ui";
import {
  PLAN_DISPLAY_NAMES,
  PLAN_LIMITS,
  PLAN_PRICES,
  type Plan,
} from "@madoo/shared";
import { billingApi, billingKeys } from "@/actions/billing";
import { ApiError } from "@/lib/api/fetch-wrapper";
import { useWorkspaceStore } from "@/stores/workspace";

const UPGRADE_PLANS: Array<{ plan: Exclude<Plan, "FREE">; tagline: string; perks: string[] }> = [
  {
    plan: "STARTER",
    tagline: "For solo founders sending the first 1,000 contacts.",
    perks: [
      "Up to 1,000 contacts",
      "Unlimited AI generations",
      "Verified domain + open & click analytics",
    ],
  },
  {
    plan: "GROWTH",
    tagline: "For growing teams scaling email marketing.",
    perks: [
      "Up to 5,000 contacts",
      "Priority send queue",
      "All Starter features",
    ],
  },
];

export default function BillingPage() {
  const qc = useQueryClient();
  const hydrateWorkspaceId = useWorkspaceStore((s) => s.hydrateWorkspaceId);
  const searchParams = useSearchParams();
  const upgraded = searchParams?.get("upgraded") === "1";
  const canceled = searchParams?.get("canceled") === "1";

  useEffect(() => {
    hydrateWorkspaceId();
  }, [hydrateWorkspaceId]);

  const overview = useQuery({
    queryKey: billingKeys.overview(),
    queryFn: () => billingApi.overview(),
  });

  const checkout = useMutation({
    mutationFn: (plan: Exclude<Plan, "FREE">) =>
      billingApi.createCheckoutSession({ plan }),
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

  // Refresh once when the user returns from a successful checkout — the
  // webhook may already have flipped the plan, but a re-fetch makes sure
  // the UI is consistent even if there's a small delay.
  useEffect(() => {
    if (upgraded) {
      void qc.invalidateQueries({ queryKey: billingKeys.all });
    }
  }, [upgraded, qc]);

  const data = overview.data;
  const currentPlan: Plan = data?.subscription.plan ?? "FREE";
  const used = data?.usage.contacts.used ?? 0;
  const limit = data?.usage.contacts.limit ?? PLAN_LIMITS[currentPlan].contacts;
  const usagePct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;

  const errorMessage =
    checkout.error instanceof ApiError
      ? checkout.error.message
      : portal.error instanceof ApiError
        ? portal.error.message
        : null;

  return (
    <div style={{ flex: 1, overflowY: "auto", background: "var(--bg)" }}>
      <div style={{ padding: "32px 40px 60px", maxWidth: 920, margin: "0 auto" }}>
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
        <h1
          className="serif"
          style={{ fontSize: 32, fontWeight: 400, margin: "12px 0 6px", letterSpacing: -0.4 }}
        >
          Billing & plan
        </h1>
        <p style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 24 }}>
          Pick the plan that matches the size of your audience. Upgrade and downgrade anytime.
        </p>

        {upgraded ? (
          <Banner tone="success" style={{ marginBottom: 16 }}>
            Subscription updated. The new plan should appear within a few seconds.
          </Banner>
        ) : null}
        {canceled ? (
          <Banner tone="warn" style={{ marginBottom: 16 }}>
            Checkout was cancelled. Your plan is unchanged.
          </Banner>
        ) : null}
        {errorMessage ? (
          <Banner tone="danger" style={{ marginBottom: 16 }}>
            {errorMessage}
          </Banner>
        ) : null}

        <Card padded style={{ marginBottom: 24, display: "flex", flexDirection: "column", gap: 16 }}>
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
                    style={{ fontSize: 28, fontWeight: 400, marginTop: 4, letterSpacing: -0.3 }}
                  >
                    {PLAN_DISPLAY_NAMES[currentPlan]}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 4 }}>
                    {PLAN_PRICES[currentPlan] === 0
                      ? "No subscription — upgrade to send to a larger audience."
                      : `$${PLAN_PRICES[currentPlan]}/mo`}
                    {data?.subscription.cancelAtPeriodEnd
                      ? " · Cancels at period end."
                      : ""}
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
                <span>Contacts</span>
                <span>
                  {used.toLocaleString()} / {limit.toLocaleString()}
                </span>
              </div>
            <ProgressBar value={usagePct} aria-label="Contact usage" />
            </>
          )}
        </Card>

        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: "var(--ink-faint)",
            marginBottom: 12,
          }}
        >
          Available plans
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {overview.isPending
            ? Array.from({ length: 2 }).map((_, idx) => (
                <Card key={`plan-skeleton-${idx}`} padded style={{ display: "grid", gap: 12 }}>
                  <Skeleton width="45%" height={24} />
                  <Skeleton width="75%" height={12} />
                  <Skeleton width="35%" height={30} />
                  <Skeleton width="100%" height={12} />
                  <Skeleton width="100%" height={12} />
                  <Skeleton width="100%" height={36} />
                </Card>
              ))
            : null}
          {!overview.isPending ? UPGRADE_PLANS.map((option) => {
            const isCurrent = option.plan === currentPlan;
            return (
              <Card
                key={option.plan}
                padded
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                <div
                  className="serif"
                  style={{ fontSize: 22, fontWeight: 400, letterSpacing: -0.3 }}
                >
                  {PLAN_DISPLAY_NAMES[option.plan]}
                </div>
                <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>{option.tagline}</div>
                <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: -0.5 }}>
                  ${PLAN_PRICES[option.plan]}
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-soft)" }}>/mo</span>
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 6 }}>
                  {option.perks.map((perk) => (
                    <li key={perk} style={{ fontSize: 13, color: "var(--ink)" }}>
                      · {perk}
                    </li>
                  ))}
                </ul>
                <div style={{ marginTop: "auto" }}>
                  <Button
                    variant={isCurrent ? "ghost" : "primary"}
                    size="md"
                    block
                    disabled={isCurrent || checkout.isPending}
                    onClick={() => {
                      if (isCurrent) return;
                      checkout.mutate(option.plan);
                    }}
                  >
                    {isCurrent
                      ? "Current plan"
                      : checkout.isPending
                        ? "Opening checkout…"
                        : `Upgrade to ${PLAN_DISPLAY_NAMES[option.plan]}`}
                  </Button>
                </div>
              </Card>
            );
          }) : null}
        </div>
      </div>
    </div>
  );
}
