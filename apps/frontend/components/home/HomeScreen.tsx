"use client";

import { useEffect, useRef, useState } from "react";
import {
  Button,
  Icon,
  PromptPill,
  SegmentedControl,
  SuggestionChip,
  Textarea,
} from "@madoo/ui";
import { TemplateCard } from "./TemplateCard";
import { GeneratingScreen } from "./GeneratingScreen";
import { EditorScreen, type GenParams } from "./EditorScreen";
import { useMe } from "@/hooks/use-me";
import { readPendingPrompt, clearPendingPrompt, savePendingPrompt } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { createEmail } from "@/actions/emails";
import {
  CATEGORIES,
  PROMPT_AUDIENCES,
  PROMPT_LENGTHS,
  PROMPT_SUGGESTIONS,
  PROMPT_TONES,
  TEMPLATE_PREVIEW_SEED_SLUG,
  TEMPLATES,
  type Template,
} from "@/lib/data";

type Screen = "home" | "generating" | "editor";

export function HomeScreen({ brand = "Madoo AI" }: { brand?: string }) {
  const { data: user, isPending: loading } = useMe();
  const openLogin = useAuthStore((s) => s.openLogin);
  const [screen, setScreen] = useState<Screen>("home");
  const [genParams, setGenParams] = useState<GenParams | null>(null);
  const [activeEmailId, setActiveEmailId] = useState<string | null>(null);

  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState("Friendly");
  const [length, setLength] = useState("Medium");
  const [audience, setAudience] = useState("Existing customers");
  const [activeCat, setActiveCat] = useState("All");
  const taRef = useRef<HTMLTextAreaElement>(null);
  const autoTriggerRef = useRef(false);

  const filtered = activeCat === "All" ? TEMPLATES : TEMPLATES.filter((t) => t.category === activeCat);

  const handleGenerate = async () => {
    const trimmed = prompt.trim();
    if (!trimmed) return;
    if (!user) {
      const pending = { prompt: trimmed, tone, length, audience };
      savePendingPrompt(pending);
      openLogin(pending);
      return;
    }
    try {
      const email = await createEmail({
        prompt: trimmed,
        tone,
        length,
        audience,
      });
      setGenParams({ prompt: trimmed, tone, length, audience });
      setActiveEmailId(email.id);
      setScreen("generating");
    } catch {
      /* surfaced via global error handling later */
    }
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

    const run = async () => {
      try {
        const email = await createEmail({
          prompt: pending.prompt,
          tone: pending.tone ?? tone,
          length: pending.length ?? length,
          audience: pending.audience ?? audience,
        });
        setGenParams({
          prompt: pending.prompt,
          tone: pending.tone ?? tone,
          length: pending.length ?? length,
          audience: pending.audience ?? audience,
        });
        setActiveEmailId(email.id);
        setScreen("generating");
      } catch {
        autoTriggerRef.current = false;
      }
    };

    void run();
  }, [user, loading, tone, length, audience]);

  const onSelectTemplate = async (t: Template) => {
    if (!user) {
      savePendingPrompt({
        prompt: `Use the "${t.name}" template`,
        tone: "Friendly",
        length: "Medium",
        audience: "Existing customers",
      });
      openLogin({
        prompt: `Use the "${t.name}" template`,
        tone: "Friendly",
        length: "Medium",
        audience: "Existing customers",
      });
      return;
    }

    try {
      const slug = TEMPLATE_PREVIEW_SEED_SLUG[t.preview];
      const email = await createEmail({
        prompt: `Use the "${t.name}" layout — ${t.category}`,
        tone: "Friendly",
        length: "Medium",
        audience: "Existing customers",
        ...(slug ? { templateSlug: slug } : {}),
      });
      setGenParams({
        prompt: `Use the "${t.name}" layout`,
        tone: "Friendly",
        length: "Medium",
        audience: "Existing customers",
      });
      setActiveEmailId(email.id);
      setScreen("generating");
    } catch {
      /* noop */
    }
  };

  const useSuggestion = (s: string) => {
    setPrompt(s);
    taRef.current?.focus();
  };

  if (screen === "generating" && genParams && activeEmailId) {
    return (
      <GeneratingScreen
        emailId={activeEmailId}
        prompt={genParams.prompt}
        onDone={() => setScreen("editor")}
      />
    );
  }

  if (screen === "editor" && activeEmailId && genParams) {
    return (
      <EditorScreen
        emailId={activeEmailId}
        genSummary={genParams}
        onBack={() => {
          setActiveEmailId(null);
          setGenParams(null);
          setScreen("home");
        }}
      />
    );
  }

  const categoryItems = CATEGORIES.map((c) => ({ value: c, label: c }));

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
            <span style={{ fontStyle: "italic", color: "var(--accent-deep)" }}>to create today?</span>
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
          <div>
            <Textarea
              ref={taRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleGenerate();
                }
              }}
              placeholder="e.g. Announce our new pricing to existing customers — confident but not pushy, with a soft CTA to upgrade."
              variant="ghost"
              noResize
              rows={4}
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
            <Button
              variant="dashed"
              size="sm"
              leftIcon={<Icon name="plus" size={12} />}
              title="Add brand kit"
            >
              Brand kit
            </Button>
            <div style={{ flex: 1 }} />
            <Button
              variant="primary"
              size="md"
              onClick={() => void handleGenerate()}
              disabled={!prompt.trim()}
              leftIcon={<Icon name="sparkle" size={14} />}
              shortcut="↵"
            >
              Generate email
            </Button>
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
            <SuggestionChip
              key={s}
              onClick={() => useSuggestion(s)}
              leadingIcon={<Icon name="sparkle" size={10} />}
            >
              {s}
            </SuggestionChip>
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
          <SegmentedControl
            items={categoryItems}
            value={activeCat}
            onChange={setActiveCat}
            aria-label="Filter templates by category"
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 18,
          }}
        >
          {filtered.map((t) => (
            <TemplateCard key={t.id} template={t} onClick={() => void onSelectTemplate(t)} />
          ))}
        </div>
      </section>
    </div>
  );
}
