"use client";

import {
  runAxe,
  type AxeEmailResult,
  type AxeFinding,
  type AxeSeverity,
} from "@/lib/accessibility";
import { cn } from "@/lib/utils";
import { ClipboardCheckIcon, RefreshIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge, Button } from "@madoo/design-system";
import { useState } from "react";

const severityMeta: Record<
  AxeSeverity,
  { label: string; icon: string; className: string }
> = {
  critical: {
    label: "Critical",
    icon: "x",
    className: "bg-red-50 text-red-700 shadow-[inset_0_0_0_1px_rgb(220_38_38/0.18)]",
  },
  serious: {
    label: "Serious",
    icon: "!",
    className:
      "bg-amber-50 text-amber-700 shadow-[inset_0_0_0_1px_rgb(217_119_6/0.18)]",
  },
  moderate: {
    label: "Moderate",
    icon: "!",
    className:
      "bg-orange-50 text-orange-700 shadow-[inset_0_0_0_1px_rgb(234_88_12/0.16)]",
  },
  minor: {
    label: "Minor",
    icon: "i",
    className:
      "bg-sky-50 text-sky-700 shadow-[inset_0_0_0_1px_rgb(2_132_199/0.16)]",
  },
};

const severities: AxeSeverity[] = ["critical", "serious", "moderate", "minor"];

type AccessibilityPanelProps = {
  html: string;
  disabled: boolean;
};

export function AccessibilityPanel({
  disabled,
  html,
}: AccessibilityPanelProps) {
  const [result, setResult] = useState<AxeEmailResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRun = async () => {
    if (disabled || loading) return;
    setLoading(true);
    setError(null);
    try {
      setResult(await runAxe(html));
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Accessibility check failed.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!result) {
    return (
      <section className="space-y-5">
        <div>
          <h3 className="text-lg font-semibold text-madoo-ink">
            Accessibility Check
          </h3>
          <p className="mt-1 text-sm text-madoo-ink-muted">
            Conducted with Axe-core
          </p>
        </div>
        <p className="max-w-md text-sm leading-6 text-madoo-ink-soft">
          Run an email accessibility check to discover compliance issues and
          manage fixes.
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
            icon={ClipboardCheckIcon}
            primaryColor="currentColor"
            size={17}
            strokeWidth={1.7}
          />
          <span>{loading ? "Running..." : "Run a Test"}</span>
        </Button>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-madoo-ink">
            Accessibility Checker
          </h3>
          <p className="mt-1 text-sm text-madoo-ink-muted">
            Conducted with Axe-core
          </p>
        </div>
        <Button
          aria-label="Refresh accessibility check"
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

      <div className="flex w-fit flex-wrap gap-1 rounded-xl bg-madoo-surface-2 p-1">
        <SummaryPill label="Failed" value={result.failed} active />
        <SummaryPill label="Passed" value={result.passed} />
        <SummaryPill label="Ignored" value={result.ignored} />
      </div>

      <div className="space-y-3">
        {severities.map((severity) => (
          <SeverityGroup
            findings={result.violationsBySeverity[severity]}
            key={severity}
            severity={severity}
          />
        ))}
      </div>
    </section>
  );
}

function SummaryPill({
  active,
  label,
  value,
}: {
  active?: boolean;
  label: string;
  value: number;
}) {
  return (
    <span
      className={cn(
        "rounded-lg px-3 py-1.5 text-xs font-medium",
        active ? "bg-white text-madoo-ink shadow-madoo-border" : "text-madoo-ink-muted",
      )}
    >
      {label} {value}
    </span>
  );
}

function SeverityGroup({
  findings,
  severity,
}: {
  findings: AxeFinding[];
  severity: AxeSeverity;
}) {
  const [index, setIndex] = useState(0);
  const meta = severityMeta[severity];
  const safeIndex = Math.min(index, Math.max(findings.length - 1, 0));
  const finding = findings[safeIndex];

  return (
    <section className="rounded-lg bg-white p-3 shadow-madoo-border">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "grid h-6 w-6 place-items-center rounded-full text-xs font-bold",
              meta.className,
            )}
          >
            {meta.icon}
          </span>
          <h4 className="text-sm font-semibold text-madoo-ink">
            {meta.label}
          </h4>
        </div>
        <Badge tone={findings.length ? "danger" : "neutral"}>
          {findings.length}
        </Badge>
      </div>

      {finding ? (
        <FindingCard
          finding={finding}
          index={safeIndex}
          onIndexChange={setIndex}
          total={findings.length}
        />
      ) : (
        <p className="mt-3 text-sm text-madoo-ink-muted">No findings.</p>
      )}
    </section>
  );
}

function FindingCard({
  finding,
  index,
  onIndexChange,
  total,
}: {
  finding: AxeFinding;
  index: number;
  onIndexChange: (index: number) => void;
  total: number;
}) {
  return (
    <article className="mt-3 rounded-lg bg-madoo-surface p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h5 className="text-sm font-semibold text-madoo-ink">
            {finding.title}
          </h5>
          <p className="mt-1 text-xs leading-5 text-madoo-ink-soft">
            {finding.description}
          </p>
          <p className="mt-2 text-xs text-madoo-ink-muted">
            Affected nodes: {finding.nodes}
          </p>
        </div>
        <a
          aria-label={`Open Axe rule help for ${finding.title}`}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-xs font-semibold text-madoo-ink shadow-madoo-border"
          href={finding.helpUrl}
          rel="noreferrer"
          target="_blank"
        >
          ?
        </a>
      </div>
      {total > 1 ? (
        <div className="mt-3 flex items-center gap-1.5">
          {Array.from({ length: total }).map((_, dotIndex) => (
            <button
              aria-label={`Show finding ${dotIndex + 1}`}
              className={cn(
                "h-2 rounded-full transition-[width,background]",
                dotIndex === index
                  ? "w-5 bg-madoo-ink"
                  : "w-2 bg-madoo-border hover:bg-madoo-ink-muted",
              )}
              key={dotIndex}
              onClick={() => onIndexChange(dotIndex)}
              type="button"
            />
          ))}
        </div>
      ) : null}
    </article>
  );
}
