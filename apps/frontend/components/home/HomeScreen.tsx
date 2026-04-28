"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons/Icon";
import { PromptPill } from "./PromptPill";
import { TemplateCard } from "./TemplateCard";
import { GeneratingScreen } from "./GeneratingScreen";
import { EditorScreen, type GenParams } from "./EditorScreen";
import { useMe } from "@/hooks/use-me";
import { readPendingPrompt, clearPendingPrompt, savePendingPrompt } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import {
  CATEGORIES,
  PROMPT_AUDIENCES,
  PROMPT_LENGTHS,
  PROMPT_SUGGESTIONS,
  PROMPT_TONES,
  TEMPLATES,
  type Template,
} from "@/lib/data";

type Screen = "home" | "generating" | "editor";

export function HomeScreen({ brand = "Madoo AI" }: { brand?: string }) {
  const { data: user, isPending: loading } = useMe();
  const openLogin = useAuthStore((s) => s.openLogin);
  const [screen, setScreen] = useState<Screen>("home");
  const [genParams, setGenParams] = useState<GenParams | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);

  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState("Friendly");
  const [length, setLength] = useState("Medium");
  const [audience, setAudience] = useState("Existing customers");
  const [activeCat, setActiveCat] = useState("All");
  const taRef = useRef<HTMLTextAreaElement>(null);
  const autoTriggerRef = useRef(false);

  const filtered = activeCat === "All" ? TEMPLATES : TEMPLATES.filter((t) => t.category === activeCat);

  const startGeneration = (p: { prompt: string; tone: string; length: string; audience: string }) => {
    setGenParams(p);
    setActiveTemplate(null);
    setScreen("generating");
  };

  const handleGenerate = () => {
    const trimmed = prompt.trim();
    if (!trimmed) return;
    if (!user) {
      const pending = { prompt: trimmed, tone, length, audience };
      savePendingPrompt(pending);
      openLogin(pending);
      return;
    }
    startGeneration({ prompt: trimmed, tone, length, audience });
  };

  useEffect(() => {
    if (loading || !user || autoTriggerRef.current) return;
    const pending = readPendingPrompt();
    if (!pending?.prompt) return;
    autoTriggerRef.current = true;
    setPrompt(pending.prompt);
    if (pending.tone) setTone(pending.tone);
    if (pending.length) setLength(pending.length);
    if (pending.audience) setAudience(pending.audience);
    clearPendingPrompt();
    startGeneration({
      prompt: pending.prompt,
      tone: pending.tone ?? tone,
      length: pending.length ?? length,
      audience: pending.audience ?? audience,
    });
  }, [user, loading]);

  const onSelectTemplate = (t: Template) => {
    setActiveTemplate(t);
    setGenParams({ prompt: `Use the "${t.name}" template`, tone: "Friendly" });
    setScreen("editor");
  };

  const useSuggestion = (s: string) => {
    setPrompt(s);
    taRef.current?.focus();
  };

  if (screen === "generating" && genParams) {
    return <GeneratingScreen prompt={genParams.prompt} onDone={() => setScreen("editor")} />;
  }
  if (screen === "editor") {
    return (
      <EditorScreen
        params={genParams}
        template={activeTemplate}
        onBack={() => setScreen("home")}
      />
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", background: "var(--bg)" }}>
      <section style={{ padding: "64px 48px 40px", maxWidth: 980, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 12px",
              background: "var(--accent-soft)",
              color: "var(--accent-deep)",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 500,
              marginBottom: 18,
            }}
          >
            <Icon name="sparkle" size={12} /> Trained on 10,000+ high-converting emails
          </div>
          <h1
            className="serif"
            style={{
              fontSize: 52,
              fontWeight: 400,
              lineHeight: 1.05,
              letterSpacing: -1,
              margin: 0,
              color: "var(--ink)",
            }}
          >
            What email do you want
            <br />
            <span style={{ fontStyle: "italic", color: "var(--accent-deep)" }}>to send today?</span>
          </h1>
          <p style={{ fontSize: 16, color: "var(--ink-soft)", marginTop: 14, lineHeight: 1.5 }}>
            Describe it in plain words. {brand} writes, designs, and ships it.
          </p>
        </div>

        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 18,
            padding: 4,
            boxShadow: "0 1px 0 rgba(0,0,0,0.02), 0 12px 40px -12px rgba(60, 50, 40, 0.12)",
            transition: "box-shadow 0.2s, border-color 0.2s",
          }}
        >
          <div style={{ padding: "18px 20px 4px" }}>
            <textarea
              ref={taRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
              placeholder="e.g. Announce our new pricing to existing customers — confident but not pushy, with a soft CTA to upgrade."
              style={{
                width: "100%",
                minHeight: 96,
                border: "none",
                outline: "none",
                resize: "none",
                background: "transparent",
                fontSize: 16,
                fontFamily: "inherit",
                color: "var(--ink)",
                lineHeight: 1.55,
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              borderTop: "1px solid var(--border-soft)",
              flexWrap: "wrap",
            }}
          >
            <PromptPill label="Tone" value={tone} options={PROMPT_TONES} onChange={setTone} />
            <PromptPill label="Length" value={length} options={PROMPT_LENGTHS} onChange={setLength} />
            <PromptPill label="Audience" value={audience} options={PROMPT_AUDIENCES} onChange={setAudience} />
            <button
              type="button"
              title="Add brand kit"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 10px",
                borderRadius: 7,
                border: "1px dashed var(--border)",
                background: "transparent",
                color: "var(--ink-faint)",
                fontSize: 12.5,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <Icon name="plus" size={12} /> Brand kit
            </button>
            <div style={{ flex: 1 }} />
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!prompt.trim()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 16px",
                borderRadius: 10,
                border: "none",
                background: prompt.trim() ? "var(--ink)" : "var(--surface-2)",
                color: prompt.trim() ? "var(--bg)" : "var(--ink-faint)",
                fontSize: 13.5,
                fontWeight: 600,
                cursor: prompt.trim() ? "pointer" : "not-allowed",
                fontFamily: "inherit",
                transition: "all 0.15s",
              }}
            >
              <Icon name="sparkle" size={14} /> Generate email
              <kbd
                style={{
                  marginLeft: 4,
                  padding: "1px 6px",
                  background: "rgba(255,255,255,0.12)",
                  borderRadius: 4,
                  fontSize: 10.5,
                  fontFamily: "inherit",
                  fontWeight: 500,
                }}
              >
                ↵
              </kbd>
            </button>
          </div>
        </div>

        <div
          style={{
            marginTop: 18,
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            justifyContent: "center",
          }}
        >
          {PROMPT_SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => useSuggestion(s)}
              style={{
                padding: "7px 12px",
                borderRadius: 999,
                border: "1px solid var(--border)",
                background: "var(--surface)",
                fontSize: 12.5,
                color: "var(--ink-soft)",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--surface-2)";
                e.currentTarget.style.color = "var(--ink)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--surface)";
                e.currentTarget.style.color = "var(--ink-soft)";
              }}
            >
              <Icon name="sparkle" size={10} /> &nbsp;{s}
            </button>
          ))}
        </div>
      </section>

      <section style={{ padding: "24px 48px 80px", maxWidth: 1280, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: 18,
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2
              className="serif"
              style={{ fontSize: 32, fontWeight: 400, margin: 0, letterSpacing: -0.5 }}
            >
              Or start with a template{" "}
              <span style={{ fontStyle: "italic", color: "var(--ink-soft)" }}>—</span>
            </h2>
            <p style={{ fontSize: 14, color: "var(--ink-soft)", marginTop: 4 }}>
              Hand-crafted designs. Edit anything with AI.
            </p>
          </div>
          <div
            style={{
              display: "flex",
              gap: 4,
              padding: 4,
              background: "var(--surface-2)",
              borderRadius: 10,
              border: "1px solid var(--border)",
              overflowX: "auto",
            }}
          >
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setActiveCat(c)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 7,
                  border: "none",
                  background: activeCat === c ? "var(--surface)" : "transparent",
                  color: activeCat === c ? "var(--ink)" : "var(--ink-soft)",
                  fontWeight: activeCat === c ? 600 : 500,
                  fontSize: 12.5,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  whiteSpace: "nowrap",
                  boxShadow: activeCat === c ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 18,
          }}
        >
          {filtered.map((t) => (
            <TemplateCard key={t.id} template={t} onClick={() => onSelectTemplate(t)} />
          ))}
        </div>
      </section>
    </div>
  );
}
