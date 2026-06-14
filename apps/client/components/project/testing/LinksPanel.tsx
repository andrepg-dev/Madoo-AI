"use client";

import { testEmailLinks } from "@/actions/testing";
import { cn } from "@/lib/utils";
import {
  CancelCircleIcon,
  Link01Icon,
  RefreshIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge, Button } from "@madoo/design-system";
import type { LinkCheck, TestLinksResponse } from "@madoo/shared";
import { useState } from "react";

type LinksPanelProps = {
  emailId: string | null;
  disabled: boolean;
};

export function LinksPanel({ disabled, emailId }: LinksPanelProps) {
  const [result, setResult] = useState<TestLinksResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRun = async () => {
    if (!emailId || disabled || loading) return;
    setLoading(true);
    setError(null);
    try {
      setResult(await testEmailLinks(emailId));
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : "Link test failed.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!result) {
    return (
      <section className="space-y-5">
        <div>
          <h3 className="text-lg font-semibold text-madoo-ink">Links Testing</h3>
          <p className="mt-1 text-sm text-madoo-ink-muted">
            Probe every link for broken URLs and missing campaign tags.
          </p>
        </div>
        <p className="max-w-lg text-sm leading-6 text-madoo-ink-soft">
          Scans each link in the email, follows redirects, and reports
          unreachable destinations plus links missing UTM parameters.
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
            icon={Link01Icon}
            primaryColor="currentColor"
            size={17}
            strokeWidth={1.7}
          />
          <span>{loading ? "Scanning…" : "Run a Test"}</span>
        </Button>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-madoo-ink">Links Testing</h3>
          <p className="mt-1 text-sm text-madoo-ink-muted">
            {result.total} link{result.total === 1 ? "" : "s"} checked
          </p>
        </div>
        <Button
          aria-label="Re-run link test"
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
        <SummaryPill label="Total" value={result.total} />
        <SummaryPill label="OK" value={result.ok} tone="ok" />
        <SummaryPill label="Broken" value={result.broken} tone="bad" active />
      </div>

      {result.links.length === 0 ? (
        <p className="text-sm text-madoo-ink-muted">No links found in this email.</p>
      ) : (
        <ul className="space-y-2">
          {result.links.map((link, index) => (
            <LinkRow key={`${link.url}-${index}`} link={link} />
          ))}
        </ul>
      )}
    </section>
  );
}

function SummaryPill({
  active,
  label,
  tone,
  value,
}: {
  active?: boolean;
  label: string;
  tone?: "ok" | "bad";
  value: number;
}) {
  return (
    <span
      className={cn(
        "rounded-lg px-3 py-1.5 text-xs font-medium",
        active ? "bg-white shadow-madoo-border" : "",
        tone === "ok"
          ? "text-emerald-600"
          : tone === "bad"
            ? "text-red-600"
            : "text-madoo-ink-muted",
      )}
    >
      {label} {value}
    </span>
  );
}

function LinkRow({ link }: { link: LinkCheck }) {
  const network = link.kind === "http";
  return (
    <li className="flex items-center gap-3 rounded-lg bg-white p-3 shadow-madoo-border">
      <span
        className={cn(
          "grid size-7 shrink-0 place-items-center rounded-full",
          link.ok
            ? "bg-emerald-50 text-emerald-600"
            : "bg-red-50 text-red-600",
        )}
      >
        <HugeiconsIcon
          aria-hidden="true"
          icon={link.ok ? Tick02Icon : CancelCircleIcon}
          primaryColor="currentColor"
          size={15}
          strokeWidth={1.9}
        />
      </span>
      <span className="grid min-w-0 flex-1 gap-0.5">
        <span className="truncate text-sm font-medium text-madoo-ink">
          {link.label}
        </span>
        <span className="truncate text-xs text-madoo-ink-muted">{link.url}</span>
      </span>
      <span className="flex shrink-0 items-center gap-1.5">
        {network && !link.hasUtm ? <Badge tone="warn">No UTM</Badge> : null}
        <Badge tone={link.ok ? "success" : "danger"}>
          {network
            ? (link.status ?? link.error ?? "Error")
            : link.kind}
        </Badge>
      </span>
    </li>
  );
}
