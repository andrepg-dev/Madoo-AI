"use client";

import { useEmails } from "@/hooks/use-emails";
import { Icon } from "@madoo/ui";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

function ProgressRing({ pct, size = 16 }: { pct: number; size?: number }) {
  const r = 6.5;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
      <circle cx="8" cy="8" r={r} fill="none" stroke="var(--border)" strokeWidth="1.5" />
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
  const wrapRef = useRef<HTMLDivElement>(null);
  const emailsQuery = useEmails();

  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const done = (emailsQuery.data ?? []).length > 0;
  const pct = done ? 100 : 0;

  return (
    <div ref={wrapRef} style={{ position: "relative", flexShrink: 0 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
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
          <b style={{ color: "var(--ink)" }}>{done ? 1 : 0}</b>
          <span style={{ color: "var(--ink-faint)" }}>/1</span>
        </span>
      </button>

      {open ? (
        <div
          style={{
            position: "absolute",
            top: 42,
            right: 0,
            width: 340,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            boxShadow: "0 20px 50px -12px rgba(20,15,10,0.25)",
            zIndex: 150,
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "16px 18px 14px", borderBottom: "1px solid var(--border-soft)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, color: "var(--ink-faint)", textTransform: "uppercase" }}>
                  Getting started
                </div>
                <div className="display" style={{ fontSize: 22, color: "var(--ink)", marginTop: 2, lineHeight: 1.2, fontWeight: 600 }}>
                  Set up your workspace
                </div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--accent-deep)", background: "var(--accent-soft)", padding: "3px 8px", borderRadius: 999, height: 20 }}>
                {done ? 1 : 0}/1
              </span>
            </div>
            <div style={{ marginTop: 12, height: 6, background: "var(--surface-2)", borderRadius: 999, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: "var(--accent)", transition: "width 0.4s ease" }} />
            </div>
          </div>

          <div style={{ padding: 6 }}>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.push("/");
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
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  flexShrink: 0,
                  marginTop: 1,
                  background: done ? "var(--accent)" : "var(--surface)",
                  border: done ? "none" : "1.5px solid var(--border)",
                  color: "var(--accent-fg)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {done ? <Icon name="check" size={12} /> : null}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
                  Generate your first email
                </div>
                <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 2, lineHeight: 1.35 }}>
                  Create a template from an AI prompt.
                </div>
              </div>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
