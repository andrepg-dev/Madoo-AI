"use client";

import {
  cancelSubscription,
  createPortalSession,
  fetchBillingOverview,
  resumeSubscription,
} from "@/actions/billing";
import { useClientStore } from "@/stores/client-store";
import {
  Badge,
  Button,
  Card,
  Icon,
  ProgressBar,
  cx,
  useToast,
} from "@madoo/design-system";
import {
  PLAN_DISPLAY_NAMES,
  getRecommendedUpgradePlan,
  type CreditUsageDto,
  type ResourceUsageDto,
  type SubscriptionStatus,
} from "@madoo/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const STATUS_TONE: Record<
  SubscriptionStatus,
  "success" | "info" | "danger" | "neutral"
> = {
  ACTIVE: "success",
  TRIALING: "info",
  PAST_DUE: "danger",
  UNPAID: "danger",
  INCOMPLETE: "neutral",
  CANCELED: "neutral",
};

const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  ACTIVE: "Active",
  TRIALING: "Free trial",
  PAST_DUE: "Past due",
  UNPAID: "Unpaid",
  INCOMPLETE: "Incomplete",
  CANCELED: "Canceled",
};

function formatNumber(value: number) {
  return new Intl.NumberFormat().format(value);
}

function formatLimit(limit: number) {
  return limit === -1 ? "Unlimited" : formatNumber(limit);
}

function formatAllowance(limit: number) {
  if (limit === -1) return "Unlimited";
  if (limit === 0) return "Not included";
  return formatNumber(limit);
}

function formatDate(value: string | null | undefined) {
  if (!value) return null;
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return null;
  }
}

function formatResetDate(value: string | null | undefined) {
  if (!value) return null;
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
    }).format(new Date(value));
  } catch {
    return null;
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function PanelCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-[20px]! p-5!">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold leading-none text-madoo-ink">
            {title}
          </h2>
          {description ? (
            <p className="mt-2 text-(length:--font-size-sm) leading-5 text-madoo-ink-muted">
              {description}
            </p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}

function UsageMeter({
  title,
  usage,
  resetLabel,
}: {
  title: string;
  usage: CreditUsageDto | ResourceUsageDto;
  resetLabel?: string | null;
}) {
  const unlimited = usage.limit === -1 || usage.remaining === -1;
  const remaining = unlimited ? null : Math.max(0, usage.remaining);
  const pct =
    unlimited
      ? 100
      : usage.limit > 0 && remaining !== null
        ? Math.min(100, Math.round((remaining / usage.limit) * 100))
        : 0;
  const remainingText = unlimited
    ? "Unlimited"
    : `${formatNumber(remaining ?? 0)} left`;

  return (
    <div className="grid gap-3 rounded-xl bg-madoo-bg-2 p-4 shadow-madoo-border">
      <div className="flex items-baseline justify-between gap-3">
        <p className="min-w-0 text-(length:--font-size-base) font-normal leading-none text-madoo-ink">
          {title}
        </p>
        <p className="whitespace-nowrap text-(length:--font-size-sm) text-madoo-ink-muted">
          {remainingText}
        </p>
      </div>
      <ProgressBar value={pct} tone="ink" label={`${title} left`} />
      {resetLabel ? (
        <span className="text-(length:--font-size-sm) text-madoo-ink-muted">
          {resetLabel}
        </span>
      ) : null}
    </div>
  );
}

function AllowanceRow({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <li className="flex items-center justify-between gap-3 py-2">
      <span className="flex items-center gap-2 text-(length:--font-size-base) text-madoo-ink">
        <span className="text-madoo-accent-deep" aria-hidden="true">
          <Icon name="check" size={15} />
        </span>
        {label}
      </span>
      <span
        className={cx(
          "whitespace-nowrap text-(length:--font-size-sm) font-medium",
          muted ? "text-madoo-ink-muted" : "text-madoo-ink",
        )}
      >
        {value}
      </span>
    </li>
  );
}

export function BillingPanel() {
  const setPricingOpen = useClientStore((state) => state.setPricingOpen);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["billing-overview"],
    queryFn: fetchBillingOverview,
    staleTime: 30_000,
  });

  const portalMutation = useMutation({
    mutationFn: createPortalSession,
    onSuccess: (result) => {
      window.location.href = result.url;
    },
    onError: (err) => {
      toast({
        tone: "danger",
        title: "Couldn't open billing portal",
        body: getErrorMessage(err, "Try again."),
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: cancelSubscription,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["billing-overview"] });
      toast({
        tone: "success",
        title: "Plan canceled",
        body: "You keep access until the end of the current period.",
      });
    },
    onError: (err) => {
      toast({
        tone: "danger",
        title: "Couldn't cancel plan",
        body: getErrorMessage(err, "Try again."),
      });
    },
  });

  const resumeMutation = useMutation({
    mutationFn: resumeSubscription,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["billing-overview"] });
      toast({ tone: "success", title: "Plan resumed" });
    },
    onError: (err) => {
      toast({
        tone: "danger",
        title: "Couldn't resume plan",
        body: getErrorMessage(err, "Try again."),
      });
    },
  });

  if (isLoading) {
    return (
      <PanelCard title="Billing & usage">
        <p className="text-(length:--font-size-base) text-madoo-ink-muted">
          Loading your usage…
        </p>
      </PanelCard>
    );
  }

  if (isError || !data) {
    return (
      <PanelCard title="Billing & usage">
        <p className="text-(length:--font-size-base) text-madoo-ink-muted">
          {getErrorMessage(error, "Couldn't load billing details.")}
        </p>
      </PanelCard>
    );
  }

  const { subscription, usage, limits, features } = data;
  const planName = PLAN_DISPLAY_NAMES[subscription.plan];
  const trialEnds = formatDate(subscription.trialEndsAt);
  const periodEnd = formatDate(subscription.currentPeriodEnd);
  const isPaid = subscription.plan !== "FREE";
  const recommendedUpgradePlan = getRecommendedUpgradePlan(subscription.plan);
  const upgradeCtaLabel = recommendedUpgradePlan
    ? `Upgrade to ${PLAN_DISPLAY_NAMES[recommendedUpgradePlan]}`
    : null;
  const showPlanAction = Boolean(
    upgradeCtaLabel || subscription.hasStripeCustomer,
  );
  const cancelBusy = cancelMutation.isPending || resumeMutation.isPending;
  const dailyReset = formatResetDate(usage.dailyAiGenerations.resetsAt);
  const monthlyReset = formatResetDate(usage.aiGenerations.resetsAt);

  const planLine =
    subscription.status === "TRIALING" && trialEnds
      ? `Free trial ends ${trialEnds}`
      : subscription.cancelAtPeriodEnd && periodEnd
        ? `Cancels on ${periodEnd}`
        : periodEnd
          ? `Renews on ${periodEnd}`
          : subscription.plan === "FREE"
            ? "You're on the free plan — no billing."
            : `You're on the ${planName} plan.`;

  const onCancel = () => {
    if (
      window.confirm(
        "Cancel your plan? You keep access until the end of the current billing period, then drop to the free plan.",
      )
    ) {
      cancelMutation.mutate();
    }
  };

  return (
    <div className="grid gap-4">
      <PanelCard
        title="Your plan"
        description={planLine}
        action={
          showPlanAction ? (
            <div className="flex flex-wrap gap-2">
              {upgradeCtaLabel ? (
                <Button size="md" onClick={() => setPricingOpen(true)}>
                  {upgradeCtaLabel}
                </Button>
              ) : null}
              {subscription.hasStripeCustomer ? (
                <Button
                  size="md"
                  variant="secondary"
                  disabled={portalMutation.isPending}
                  onClick={() => portalMutation.mutate()}
                >
                  {portalMutation.isPending ? "Opening…" : "Manage billing"}
                </Button>
              ) : null}
            </div>
          ) : undefined
        }
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-2xl font-semibold leading-none text-madoo-ink">
            {planName}
          </span>
          <Badge tone={STATUS_TONE[subscription.status]}>
            {STATUS_LABEL[subscription.status]}
          </Badge>
        </div>

        {isPaid ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-4 shadow-[inset_0_0.5px_0_rgb(var(--rule-rgb)/0.18)]">
            <p className="text-(length:--font-size-sm) text-madoo-ink-muted">
              {subscription.cancelAtPeriodEnd
                ? "Your plan is set to cancel. Resume to keep it active."
                : "Cancel anytime — you keep access until the period ends."}
            </p>
            {subscription.cancelAtPeriodEnd ? (
              <Button
                size="sm"
                variant="secondary"
                disabled={cancelBusy}
                onClick={() => resumeMutation.mutate()}
              >
                {resumeMutation.isPending ? "Resuming…" : "Resume plan"}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                disabled={cancelBusy}
                onClick={onCancel}
              >
                {cancelMutation.isPending ? "Canceling…" : "Cancel plan"}
              </Button>
            )}
          </div>
        ) : null}
      </PanelCard>

      <PanelCard
        title="Usage"
        description="Credits left on your current plan."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <UsageMeter
            title="Daily credits"
            usage={usage.dailyAiGenerations}
            resetLabel={dailyReset ? `Resets ${dailyReset}` : null}
          />
          <UsageMeter
            title="Monthly credits"
            usage={usage.aiGenerations}
            resetLabel={monthlyReset ? `Resets ${monthlyReset}` : null}
          />
          <UsageMeter
            title="Stored templates"
            usage={usage.storedTemplates}
          />
        </div>
      </PanelCard>

      <PanelCard
        title="What's included"
        description="Allowances on your current plan."
      >
        <ul className="grid [&>li]:shadow-[inset_0_-0.5px_0_rgb(var(--rule-rgb)/0.16)] [&>li:last-child]:shadow-none">
          <AllowanceRow
            label="Team members (besides you)"
            value={formatAllowance(limits.members)}
            muted={limits.members === 0}
          />
          <AllowanceRow
            label="Workspaces"
            value={formatAllowance(limits.workspaces)}
            muted={limits.workspaces === 0}
          />
          <AllowanceRow
            label="Test emails per day"
            value={formatLimit(limits.testEmailsPerDay)}
          />
          <AllowanceRow
            label="Export to HTML, JPEG, PDF"
            value={features.exportFormats.join(", ")}
          />
          <AllowanceRow
            label="Share preview template links"
            value={features.sharePreviewLinks ? "Included" : "Not included"}
            muted={!features.sharePreviewLinks}
          />
        </ul>
      </PanelCard>
    </div>
  );
}
