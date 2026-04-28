"use client";

import { useEffect, useState } from "react";
import { Icon } from "@madoo/ui";

const STEPS = [
  "Reading your prompt…",
  "Studying your audience…",
  "Drafting subject lines…",
  "Composing the body…",
  "Designing the layout…",
];

export function GeneratingScreen({ prompt, onDone }: { prompt: string; onDone: () => void }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step < STEPS.length - 1) {
      const t = setTimeout(() => setStep((s) => s + 1), 700);
      return () => clearTimeout(t);
    }
    const t = setTimeout(onDone, 800);
    return () => clearTimeout(t);
  }, [step, onDone]);

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        padding: 40,
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 480 }}>
        <div style={{ display: "inline-flex", position: "relative", width: 80, height: 80, marginBottom: 24 }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: "var(--accent)",
              opacity: 0.18,
              animation: "pulse 1.6s ease-in-out infinite",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 12,
              borderRadius: "50%",
              background: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--accent-fg)",
            }}
          >
            <div style={{ animation: "spin 2.4s linear infinite" }}>
              <Icon name="sparkle" size={24} stroke={1.8} />
            </div>
          </div>
        </div>
        <h2
          className="serif"
          style={{ fontSize: 32, fontWeight: 400, margin: 0, lineHeight: 1.1 }}
        >
          <span style={{ fontStyle: "italic" }}>Crafting</span> your email
        </h2>
        <p style={{ fontSize: 14, color: "var(--ink-soft)", marginTop: 8, fontStyle: "italic" }}>
          &quot;{prompt.slice(0, 90)}
          {prompt.length > 90 ? "…" : ""}&quot;
        </p>
        <div
          style={{
            marginTop: 28,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            textAlign: "left",
          }}
        >
          {STEPS.map((s, i) => (
            <div
              key={s}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 13.5,
                color: i <= step ? "var(--ink)" : "var(--ink-faint)",
                transition: "color 0.3s",
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background:
                    i < step ? "var(--accent)" : i === step ? "var(--accent-soft)" : "var(--surface-2)",
                  color: i < step ? "var(--accent-fg)" : "var(--accent-deep)",
                }}
              >
                {i < step ? (
                  <Icon name="check" size={10} />
                ) : i === step ? (
                  <div
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: "var(--accent)",
                      animation: "pulse 1s ease-in-out infinite",
                    }}
                  />
                ) : (
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--ink-faint)" }} />
                )}
              </div>
              {s}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
