"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/icons/Icon";
import { TEMPLATES, altSubject, generateBody, generateSubject, type Template } from "@/lib/data";

export type GenParams = { prompt: string; tone: string; length?: string; audience?: string };

export function EditorScreen({
  params,
  template,
  onBack,
}: {
  params: GenParams | null;
  template?: Template | null;
  onBack: () => void;
}) {
  const subjects = useMemo(
    () => [generateSubject(params?.prompt), altSubject(params?.prompt, 1), altSubject(params?.prompt, 2)],
    [params],
  );
  const [variant, setVariant] = useState(0);
  const [subject, setSubject] = useState(subjects[0]);
  const [aiPrompt, setAiPrompt] = useState("");

  const tpl = template || TEMPLATES[0];
  const body = generateBody(params?.prompt, params?.tone, variant);

  return (
    <div style={{ flex: 1, display: "flex", overflow: "hidden", background: "var(--bg)" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div
          style={{
            height: 52,
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            padding: "0 20px",
            gap: 10,
            background: "var(--surface)",
          }}
        >
          <button
            type="button"
            onClick={onBack}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 10px",
              borderRadius: 7,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              fontSize: 12.5,
              color: "var(--ink-soft)",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}>
              <Icon name="arrow" size={12} />
            </span>{" "}
            Back
          </button>
          <div style={{ width: 1, height: 20, background: "var(--border)" }} />
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            style={{
              flex: 1,
              maxWidth: 460,
              fontSize: 13.5,
              fontWeight: 500,
              border: "none",
              outline: "none",
              background: "transparent",
              color: "var(--ink)",
              fontFamily: "inherit",
            }}
          />
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            {subjects.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setVariant(i);
                  setSubject(subjects[i]);
                }}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  border: "1px solid var(--border)",
                  background: variant === i ? "var(--ink)" : "var(--surface)",
                  color: variant === i ? "var(--bg)" : "var(--ink-soft)",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                v{i + 1}
              </button>
            ))}
            <button
              type="button"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 10px",
                borderRadius: 7,
                border: "1px solid var(--border)",
                background: "var(--surface)",
                fontSize: 12.5,
                color: "var(--ink-soft)",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <Icon name="copy" size={12} /> Copy
            </button>
            <button
              type="button"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 12px",
                borderRadius: 7,
                border: "none",
                background: "var(--ink)",
                color: "var(--bg)",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <Icon name="send" size={12} /> Send test
            </button>
          </div>
        </div>

        <div
          style={{ flex: 1, overflowY: "auto", padding: "32px 24px 60px", background: "var(--bg-2)" }}
        >
          <div
            style={{
              maxWidth: 600,
              margin: "0 auto",
              background: "var(--surface)",
              borderRadius: 14,
              overflow: "hidden",
              boxShadow: "0 1px 0 rgba(0,0,0,0.02), 0 30px 60px -30px rgba(50,40,30,0.18)",
              border: "1px solid var(--border)",
            }}
          >
            <div style={{ background: tpl.bg, color: tpl.accent, fontFamily: "var(--font-inter), sans-serif" }}>
              <div
                style={{
                  padding: "14px 24px",
                  borderBottom: `1px solid ${tpl.accent}15`,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: tpl.accent,
                    color: tpl.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  A
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.3 }}>
                  <div style={{ fontWeight: 600 }}>Acme Brand</div>
                  <div style={{ opacity: 0.6 }}>hello@acme.co</div>
                </div>
              </div>
              <div style={{ padding: "32px 32px 12px" }}>
                <div style={{ fontSize: 11, opacity: 0.5, letterSpacing: 1.5, fontWeight: 600 }}>
                  {(tpl.category || "EMAIL").toUpperCase()}
                </div>
                <h1
                  className="serif"
                  style={{
                    fontSize: 36,
                    fontWeight: 400,
                    lineHeight: 1.05,
                    letterSpacing: -0.5,
                    margin: "8px 0 0",
                  }}
                >
                  {subject}
                </h1>
              </div>
              <div style={{ padding: "0 32px 24px" }}>
                <div
                  style={{
                    aspectRatio: "16/9",
                    background: `linear-gradient(135deg, ${tpl.accent}30, ${tpl.accent}10)`,
                    borderRadius: 8,
                    marginTop: 12,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 14,
                      border: `1px dashed ${tpl.accent}40`,
                      borderRadius: 4,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontFamily: "var(--font-jetbrains-mono), monospace",
                      opacity: 0.6,
                    }}
                  >
                    hero image
                  </div>
                </div>
                {body.map((p, i) => (
                  <p
                    key={i}
                    style={{
                      fontSize: 15,
                      lineHeight: 1.65,
                      margin: "20px 0 0",
                      color: tpl.accent,
                      opacity: 0.92,
                    }}
                  >
                    {p}
                  </p>
                ))}
                <div style={{ marginTop: 28 }}>
                  <a
                    style={{
                      display: "inline-block",
                      padding: "12px 22px",
                      background: tpl.accent,
                      color: tpl.bg,
                      fontSize: 14,
                      fontWeight: 600,
                      borderRadius: 8,
                      textDecoration: "none",
                    }}
                  >
                    Read more →
                  </a>
                </div>
                <div
                  style={{
                    marginTop: 32,
                    paddingTop: 18,
                    borderTop: `1px solid ${tpl.accent}15`,
                    fontSize: 11.5,
                    opacity: 0.55,
                    lineHeight: 1.6,
                  }}
                >
                  You&apos;re getting this because you signed up at acme.co. <u>Unsubscribe</u> · <u>Preferences</u>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <aside
        style={{
          width: 320,
          borderLeft: "1px solid var(--border)",
          background: "var(--surface)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "14px 18px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              background: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--accent-fg)",
            }}
          >
            <Icon name="sparkle" size={12} />
          </div>
          <div style={{ fontSize: 13.5, fontWeight: 600 }}>AI Editor</div>
          <div style={{ marginLeft: "auto", fontSize: 11, color: "var(--ink-faint)" }}>Live</div>
        </div>
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div
            style={{
              background: "var(--accent-soft)",
              borderRadius: 10,
              padding: 12,
              fontSize: 12.5,
              lineHeight: 1.5,
              color: "var(--accent-deep)",
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 4 }}>✱ Suggestion</div>
            Subject lines under 50 chars get 22% more opens. Try variant <b>v2</b>.
          </div>
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: 1,
                color: "var(--ink-faint)",
                marginBottom: 8,
              }}
            >
              QUICK EDITS
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {["Make it shorter", "More casual tone", "Add urgency", "Strengthen the CTA", "Translate to Spanish"].map(
                (q) => (
                  <button
                    key={q}
                    type="button"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 10px",
                      borderRadius: 7,
                      border: "1px solid var(--border)",
                      background: "var(--surface)",
                      fontSize: 12.5,
                      color: "var(--ink)",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      textAlign: "left",
                    }}
                  >
                    {q} <Icon name="arrow" size={11} />
                  </button>
                ),
              )}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: 1,
                color: "var(--ink-faint)",
                marginBottom: 8,
              }}
            >
              LAYOUT
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {["Single column", "Two column", "Hero + grid", "Minimal"].map((l, i) => (
                <button
                  key={l}
                  type="button"
                  style={{
                    padding: "8px 10px",
                    borderRadius: 7,
                    border: i === 0 ? "1.5px solid var(--ink)" : "1px solid var(--border)",
                    background: "var(--surface)",
                    fontSize: 11.5,
                    color: "var(--ink)",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontWeight: i === 0 ? 600 : 500,
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div style={{ padding: 14, borderTop: "1px solid var(--border)" }}>
          <div style={{ position: "relative" }}>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Tell AI what to change…"
              style={{
                width: "100%",
                minHeight: 60,
                padding: "10px 36px 10px 12px",
                border: "1px solid var(--border)",
                borderRadius: 10,
                background: "var(--surface-2)",
                fontSize: 13,
                fontFamily: "inherit",
                color: "var(--ink)",
                outline: "none",
                resize: "none",
              }}
            />
            <button
              type="button"
              style={{
                position: "absolute",
                right: 6,
                bottom: 6,
                width: 28,
                height: 28,
                borderRadius: 7,
                border: "none",
                background: "var(--ink)",
                color: "var(--bg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <Icon name="arrowUp" size={14} />
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
