"use client";

import { useMemo, useState } from "react";
import {
  Banner,
  Button,
  Icon,
  IconButton,
  SegmentedControl,
  Textarea,
} from "@madoo/ui";
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

  const variantItems = subjects.map((_, i) => ({ value: String(i), label: `v${i + 1}` }));

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
          <Button
            variant="secondary"
            size="sm"
            onClick={onBack}
            leftIcon={
              <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}>
                <Icon name="arrow" size={12} />
              </span>
            }
          >
            Back
          </Button>
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
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
            <SegmentedControl
              items={variantItems}
              value={String(variant)}
              onChange={(v) => {
                const i = Number(v);
                setVariant(i);
                setSubject(subjects[i]);
              }}
              aria-label="Subject variant"
            />
            <Button variant="secondary" size="sm" leftIcon={<Icon name="copy" size={12} />}>
              Copy
            </Button>
            <Button variant="primary" size="sm" leftIcon={<Icon name="send" size={12} />}>
              Send test
            </Button>
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
          <Banner tone="accent" title="Suggestion">
            Subject lines under 50 chars get 22% more opens. Try variant <b>v2</b>.
          </Banner>
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
                  <Button
                    key={q}
                    variant="secondary"
                    size="sm"
                    block
                    rightIcon={<Icon name="arrow" size={11} />}
                    style={{ justifyContent: "space-between" }}
                  >
                    {q}
                  </Button>
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
            <Textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Tell AI what to change…"
              variant="filled"
              noResize
              rows={3}
            />
            <IconButton
              variant="solid"
              size="sm"
              aria-label="Send AI instruction"
              style={{ position: "absolute", right: 6, bottom: 6 }}
            >
              <Icon name="arrowUp" size={14} />
            </IconButton>
          </div>
        </div>
      </aside>
    </div>
  );
}
