"use client";

import {
  cancelSubscription,
  createPortalSession,
  fetchBillingOverview,
  resumeSubscription,
} from "@/actions/billing";
import { useClientStore } from "@/stores/client-store";
import { Badge, Button, Card, Icon, cx, useToast } from "@madoo/design-system";
import {
  PLAN_DISPLAY_NAMES,
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
  hint,
  usage,
  resetLabel,
}: {
  title: string;
  hint?: string;
  usage: CreditUsageDto | ResourceUsageDto;
  resetLabel?: string | null;
}) {
  const unlimited = usage.limit === -1;
  const pct =
    unlimited || usage.limit === 0
      ? 0
      : Math.min(100, Math.round((usage.used / usage.limit) * 100));
  const nearLimit = !unlimited && pct >= 90;

  return (
    <div className="grid gap-2 rounded-xl bg-madoo-bg-2 p-4 shadow-madoo-border">
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <p className="text-(length:--font-size-base) font-medium leading-none text-madoo-ink">
            {title}
          </p>
          {hint ? (
            <p className="mt-1 text-(length:--font-size-xs) leading-none text-madoo-ink-muted">
              {hint}
            </p>
          ) : null}
        </div>
        <p className="whitespace-nowrap text-(length:--font-size-sm) font-medium text-madoo-ink">
          {formatNumber(usage.used)}
          <span className="text-madoo-ink-muted"> / {formatLimit(usage.limit)}</span>
        </p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-madoo-surface-2">
        <div
          className={cx(
            "h-full rounded-full transition-[width]",
            nearLimit ? "bg-madoo-danger" : "bg-madoo-accent-deep",
          )}
          style={{ width: unlimited ? "100%" : `${pct}%` }}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-(length:--font-size-xs) text-madoo-ink-muted">
        <span>
          {unlimited
            ? "Unlimited on your plan"
            : `${formatNumber(Math.max(0, usage.remaining))} remaining`}
        </span>
        {resetLabel ? <span>{resetLabel}</span> : null}
      </div>
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
  const cancelBusy = cancelMutation.isPending || resumeMutation.isPending;

  const planLine =
    subscription.status === "TRIALING" && trialEnds
      ? `Free trial ends ${trialEnds}`
      : subscription.cancelAtPeriodEnd && periodEnd
        ? `Cancels on ${periodEnd}`
        : periodEnd
          ? `Renews on ${periodEnd}`
          : "You're on the free plan — no billing.";

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
          <div className="flex flex-wrap gap-2">
            <Button size="md" onClick={() => setPricingOpen(true)}>
              {subscription.plan === "PRO" ? "Change plan" : "Upgrade plan"}
            </Button>
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
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-madoo-surface-2 pt-4">
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
        description="Credits are consumed by each AI message — drafts and chat edits alike."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <UsageMeter
            title="AI credits today"
            hint="Resets every day at 00:00 UTC"
            usage={usage.dailyAiGenerations}
            resetLabel={
              formatDate(usage.dailyAiGenerations.resetsAt)
                ? `Resets ${formatDate(usage.dailyAiGenerations.resetsAt)}`
                : null
            }
          />
          <UsageMeter
            title="AI credits this month"
            hint="Resets when your plan renews"
            usage={usage.aiGenerations}
            resetLabel={
              formatDate(usage.aiGenerations.resetsAt)
                ? `Resets ${formatDate(usage.aiGenerations.resetsAt)}`
                : null
            }
          />
          <UsageMeter
            title="Stored templates"
            hint="Starter templates don't count"
            usage={usage.storedTemplates}
          />
        </div>
      </PanelCard>

      <PanelCard
        title="What's included"
        description="Allowances on your current plan."
      >
        <ul className="divide-y divide-madoo-surface-2">
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
