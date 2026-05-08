"use client";

import { campaignsApi, campaignsKeys } from "@/actions/campaigns";
import { contactsApi, contactsKeys } from "@/actions/contacts";
import { domainsApi, domainsKeys } from "@/actions/domains";
import { segmentsApi, segmentsKeys } from "@/actions/segments";
import { useEmails } from "@/hooks/use-emails";
import { Icon } from "@madoo/ui";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const DISMISSED_KEY = "madoo_setup_guide_dismissed";

type Step = {
  id: string;
  title: string;
  sub: string;
  cta: string;
  href: string;
  time: string;
  done: boolean;
};

/* ── Progress ring SVG (mini, inside the pill button) ── */
function ProgressRing({ pct, size = 16 }: { pct: number; size?: number }) {
  const r = 6.5;
  const circ = 2 * Math.PI * r; // ≈ 40.84
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      style={{ flexShrink: 0 }}
    >
      <circle
        cx="8"
        cy="8"
        r={r}
        fill="none"
        stroke="var(--border)"
        strokeWidth="1.5"
      />
      <circle
        cx="8"
        cy="8"
        r={r}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1.5"
        strokeDasharray={`${(pct / 100) * circ} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 8 8)"
      />
    </svg>
  );
}

export function SetupGuide() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  /* ── Hydrate dismissed state from localStorage ── */
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem(DISMISSED_KEY)) {
      setDismissed(true);
    }
  }, []);

  /* ── Close on outside click / Escape ── */
  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (e: MouseEvent) => {
      // If the click is outside the entire component (button + dropdown), close it
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    // Use mousedown to match the button's onMouseDown and stopPropagation
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  /* ── Real data from API queries ── */
  const domainsQuery = useQuery({
    queryKey: domainsKeys.list(),
    queryFn: () => domainsApi.list(),
    staleTime: 60_000,
  });
  const contactsQuery = useQuery({
    queryKey: contactsKeys.list({ pageSize: 1 }),
    queryFn: () => contactsApi.list({ pageSize: 1 }),
    staleTime: 60_000,
  });
  const segmentsQuery = useQuery({
    queryKey: segmentsKeys.list(),
    queryFn: () => segmentsApi.list(),
    staleTime: 60_000,
  });
  const emailsQuery = useEmails();
  const campaignsQuery = useQuery({
    queryKey: campaignsKeys.list(),
    queryFn: campaignsApi.list,
    staleTime: 30_000,
  });

  const hasSentCampaign = (campaignsQuery.data ?? []).some(
    (c) => c.status === "sent",
  );

  const steps: Step[] = [
    {
      id: "domain",
      title: "Verify your sender domain",
      sub: "Add DNS records so emails land in inboxes, not spam.",
      cta: "Open Domain",
      href: "/domain",
      time: "5 min",
      done: (domainsQuery.data ?? []).some((d) => d.status === "verified"),
    },
    {
      id: "contacts",
      title: "Import your contacts",
      sub: "Upload a CSV or add contacts manually.",
      cta: "Go to Contacts",
      href: "/contacts",
      time: "2 min",
      done: (contactsQuery.data?.total ?? 0) > 0,
    },
    {
      id: "segment",
      title: "Create your first segment",
      sub: "Group contacts so the right people get the right email.",
      cta: "Build segment",
      href: "/contacts",
      time: "3 min",
      done: (segmentsQuery.data ?? []).length > 0,
    },
    {
      id: "generate",
      title: "Generate your first email with AI",
      sub: "Describe what you want to say — Madoo writes it for you.",
      cta: "Try it now",
      href: "/",
      time: "1 min",
      done: (emailsQuery.data ?? []).length > 0,
    },
    {
      id: "send",
      title: "Send your first campaign",
      sub: "Pick your audience, map variables, and hit send.",
      cta: "New campaign",
      href: "/campaigns",
      time: "4 min",
      done: hasSentCampaign,
    },
    {
      id: "analytics",
      title: "Review the results",
      sub: "See opens, clicks, and which links worked best.",
      cta: "View analytics",
      href: "/analytics",
      time: "2 min",
      done: hasSentCampaign,
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  const total = steps.length;
  const pct = Math.round((doneCount / total) * 100);

  const remainingMinutes = steps
    .filter((s) => !s.done)
    .reduce((acc, s) => acc + parseInt(s.time), 0);

  const allDone = doneCount === total;

  /* Auto-dismiss when all steps are completed - REMOVED: Users should be able to see completed state */
  /* useEffect(() => {
    if (allDone && !dismissed) {
      localStorage.setItem(DISMISSED_KEY, "1");
      setDismissed(true);
    }
  }, [allDone, dismissed]); */

  // dismissed logic removed to ensure visibility

  return (
    <div ref={wrapRef} style={{ position: "relative", flexShrink: 0 }}>
      {/* ── Pill button (progress ring + count + ▾) ── */}
      <button
        type="button"
        onClick={(e) => {
          console.log("SetupGuide clicked! Current state:", open);
          setOpen((v) => !v);
        }}
        aria-label="Getting started guide"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          height: 30,
          padding: "0 10px 0 8px",
          borderRadius: 8,
          border: "1px solid var(--border)",
          background: open ? "var(--surface-2)" : "var(--surface)",
          fontSize: 12,
          color: "var(--ink)",
          cursor: "pointer",
          fontFamily: "inherit",
          whiteSpace: "nowrap",
        }}
      >
        <ProgressRing pct={pct} size={16} />
        <span style={{ fontWeight: 600 }}>Setup</span>
        <span>
          <b style={{ color: "var(--ink)" }}>{doneCount}</b>
          <span style={{ color: "var(--ink-faint)" }}>/{total}</span>
        </span>
        <span style={{ color: "var(--ink-faint)", fontSize: 10, marginLeft: -2 }}>▾</span>
      </button>

      {/* ── Dropdown panel ── */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: 42,
            right: 0,
            width: 380,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            boxShadow: "0 20px 50px -12px rgba(20,15,10,0.25)",
            zIndex: 150,
            overflow: "hidden",
          }}
        >
          {/* ── Header ── */}
          <div
            style={{
              padding: "16px 18px 14px",
              borderBottom: "1px solid var(--border-soft)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: 1,
                    color: "var(--ink-faint)",
                    textTransform: "uppercase",
                  }}
                >
                  Getting started
                </div>
                <div
                  className="serif"
                  style={{
                    fontSize: 22,
                    color: "var(--ink)",
                    marginTop: 2,
                    lineHeight: 1.2,
                  }}
                >
                  Set up your sending
                </div>
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--accent-deep)",
                  background: "var(--accent-soft)",
                  padding: "3px 8px",
                  borderRadius: 999,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                {doneCount}/{total}
              </span>
            </div>

            {/* Progress bar */}
            <div
              style={{
                marginTop: 12,
                height: 6,
                background: "var(--surface-2)",
                borderRadius: 999,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${pct}%`,
                  height: "100%",
                  background: "var(--accent)",
                  transition: "width 0.4s ease",
                }}
              />
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 11.5,
                color: "var(--ink-faint)",
              }}
            >
              {pct}% complete
              {remainingMinutes > 0
                ? ` · about ${remainingMinutes} min left`
                : ""}
            </div>
          </div>

          {/* ── Steps ── */}
          <div style={{ maxHeight: 380, overflowY: "auto", padding: 6 }}>
            {steps.map((step, i) => (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  setOpen(false);
                  router.push(step.href);
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 11,
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--surface-2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                {/* Step circle */}
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    flexShrink: 0,
                    marginTop: 1,
                    background: step.done ? "var(--accent)" : "var(--surface)",
                    border: step.done ? "none" : "1.5px solid var(--border)",
                    color: "var(--accent-fg)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {step.done ? (
                    <Icon name="check" size={11} />
                  ) : (
                    <span style={{ color: "var(--ink-faint)" }}>{i + 1}</span>
                  )}
                </div>

                {/* Step content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: step.done
                          ? "var(--ink-faint)"
                          : "var(--ink)",
                        textDecoration: step.done ? "line-through" : "none",
                      }}
                    >
                      {step.title}
                    </div>
                    <span
                      style={{
                        fontSize: 10.5,
                        color: "var(--ink-faint)",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {step.time}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--ink-soft)",
                      marginTop: 2,
                      lineHeight: 1.45,
                    }}
                  >
                    {step.sub}
                  </div>
                  {!step.done && (
                    <div
                      style={{
                        marginTop: 6,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 11.5,
                        fontWeight: 600,
                        color: "var(--accent-deep)",
                      }}
                    >
                      {step.cta}
                      <Icon name="arrow" size={11} />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* ── Footer (matches design: docs link + dismiss) ── */}
          <div
            style={{
              padding: "10px 14px",
              borderTop: "1px solid var(--border-soft)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 11.5,
            }}
          >
            <div></div>
            <button
              type="button"
              onClick={() => {
                localStorage.setItem(DISMISSED_KEY, "1");
                setDismissed(true);
                setOpen(false);
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--ink-faint)",
                cursor: "pointer",
                fontSize: 11.5,
                fontFamily: "inherit",
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
