"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons/Icon";

export function PromptPill({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 10px",
          borderRadius: 7,
          border: "1px solid var(--border)",
          background: "var(--surface-2)",
          fontSize: 12.5,
          color: "var(--ink)",
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        <span style={{ color: "var(--ink-faint)" }}>{label}:</span>
        <span style={{ fontWeight: 500 }}>{value}</span>
        <Icon name="chevronDown" size={11} />
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            minWidth: 160,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 9,
            boxShadow: "0 12px 32px -8px rgba(40,30,20,0.18)",
            padding: 4,
            zIndex: 50,
          }}
        >
          {options.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => {
                onChange(o);
                setOpen(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                padding: "7px 10px",
                borderRadius: 6,
                border: "none",
                background: "transparent",
                fontSize: 12.5,
                color: "var(--ink)",
                cursor: "pointer",
                fontFamily: "inherit",
                textAlign: "left",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-2)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {o}
              {o === value && <Icon name="check" size={12} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
