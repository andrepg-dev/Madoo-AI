"use client";

import { testEmailSpam } from "@/actions/testing";
import { cn } from "@/lib/utils";
import {
  Alert02Icon,
  RefreshIcon,
  Shield01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@madoo/design-system";
import type { SpamIssue, TestSpamResponse } from "@madoo/shared";
import { useState } from "react";

type SpamPanelProps = {
  emailId: string | null;
  disabled: boolean;
};

const ratingMeta = {
  good: { label: "Looks good", className: "text-emerald-600" },
  warning: { label: "Needs attention", className: "text-amber-600" },
  poor: { label: "High risk", className: "text-red-600" },
} as const;

export function SpamPanel({ disabled, emailId }: SpamPanelProps) {
  const [result, setResult] = useState<TestSpamResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRun = async () => {
    if (!emailId || disabled || loading) return;
    setLoading(true);
    setError(null);
    try {
      setResult(await testEmailSpam(emailId));
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : "Spam test failed.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!result) {
    return (
      <section className="space-y-5">
        <div>
          <h3 className="text-lg font-semibold text-madoo-ink">Spam Testing</h3>
          <p className="mt-1 text-sm text-madoo-ink-muted">
            Check deliverability signals before you send.
          </p>
        </div>
        <p className="max-w-lg text-sm leading-6 text-madoo-ink-soft">
          Reviews trigger words, capitalization, unsubscribe links, text-to-image
          balance, and more, then scores the email&apos;s deliverability risk.
        </p>
        {error ? (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 shadow-madoo-border">
            {error}
          </div>
        ) : null}
        <Button
          className="bg-[#16a34a] text-white hover:bg-[#15803d]"
          disabled={disabled || loading}
          onClick={handleRun}
          type="button"
          variant="primary"
        >
          <HugeiconsIcon
            aria-hidden="true"
            icon={Shield01Icon}
            primaryColor="currentColor"
            size={17}
            strokeWidth={1.7}
          />
          <span>{loading ? "Analyzing…" : "Run a Test"}</span>
        </Button>
      </section>
    );
  }

  const meta = ratingMeta[result.rating];

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-madoo-ink">Spam Testing</h3>
          <p className="mt-1 text-sm text-madoo-ink-muted">{result.summary}</p>
        </div>
        <Button
          aria-label="Re-run spam test"
          className="h-8 w-8 rounded-lg"
          disabled={loading}
          onClick={handleRun}
          size="sm"
          type="button"
          variant="icon"
        >
          <HugeiconsIcon
            aria-hidden="true"
            icon={RefreshIcon}
            primaryColor="currentColor"
            size={16}
            strokeWidth={1.7}
          />
        </Button>
      </div>

      <div className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-madoo-border">
        <div className="grid place-items-center">
          <span className={cn("text-3xl font-semibold leading-none", meta.className)}>
            {result.score}
          </span>
          <span className="mt-1 text-[11px] text-madoo-ink-muted">/ 100</span>
        </div>
        <div className="h-10 w-px bg-madoo-border" />
        <div className="grid gap-0.5">
          <span className={cn("text-sm font-semibold", meta.className)}>
            {meta.label}
          </span>
          <span className="text-xs text-madoo-ink-muted">
            Deliverability score
          </span>
        </div>
      </div>

      <ul className="space-y-2">
        {result.issues.map((issue) => (
          <IssueRow issue={issue} key={issue.id} />
        ))}
      </ul>
    </section>
  );
}

function IssueRow({ issue }: { issue: SpamIssue }) {
  const severityColor =
    issue.severity === "high"
      ? "bg-red-50 text-red-600"
      : issue.severity === "medium"
        ? "bg-amber-50 text-amber-600"
        : "bg-orange-50 text-orange-600";

  return (
    <li className="flex items-start gap-3 rounded-lg bg-white p-3 shadow-madoo-border">
      <span
        className={cn(
          "mt-0.5 grid size-7 shrink-0 place-items-center rounded-full",
          issue.passed ? "bg-emerald-50 text-emerald-600" : severityColor,
        )}
      >
        <HugeiconsIcon
          aria-hidden="true"
          icon={issue.passed ? Tick02Icon : Alert02Icon}
          primaryColor="currentColor"
          size={15}
          strokeWidth={1.9}
        />
      </span>
      <span className="grid min-w-0 flex-1 gap-0.5">
        <span className="text-sm font-medium text-madoo-ink">{issue.label}</span>
        <span className="text-xs leading-5 text-madoo-ink-soft">
          {issue.detail}
        </span>
      </span>
    </li>
  );
}
