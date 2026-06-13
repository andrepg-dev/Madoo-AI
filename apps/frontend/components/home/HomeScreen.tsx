"use client";

import { useCreateEmail, useEmails } from "@/hooks/use-emails";
import { useMe } from "@/hooks/use-me";
import {
  clearPendingPrompt,
  readPendingPrompt,
  savePendingPrompt,
} from "@/lib/api";
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
import { shortEmailId } from "@/lib/email-id";
import {
  productFaq,
  productFeatures,
  productUseCases,
  productWorkflow,
} from "@/lib/product-marketing";
import { useAuthStore } from "@/stores/auth";
import {
  Banner,
  Button,
  Icon,
  SegmentedControl,
  Select,
  SuggestionChip,
  Textarea,
} from "@madoo/design-system";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { TemplateCard } from "./TemplateCard";

export function HomeScreen({ brand = "Madoo AI" }: { brand?: string }) {
  const router = useRouter();
  const { data: user, isPending: loading } = useMe();
  const { mutateAsync: createEmail, isPending: creatingEmail } =
    useCreateEmail();
  const { data: emails = [], isLoading: loadingEmails } = useEmails(
    Boolean(user),
  );
  const openLogin = useAuthStore((s) => s.openLogin);

  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState("Friendly");
  const [length, setLength] = useState("Medium");
  const [audience, setAudience] = useState("Existing customers");
  const [activeCat, setActiveCat] = useState("All");
  const [templateError, setTemplateError] = useState<string | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const autoTriggerRef = useRef(false);

  const filtered =
    activeCat === "All"
      ? TEMPLATES
      : TEMPLATES.filter((t) => t.category === activeCat);

  const createFromPrompt = async (input: {
    prompt: string;
    tone: string;
    length: string;
    audience: string;
  }) => {
    try {
      const email = await createEmail({
        prompt: input.prompt,
        tone: input.tone,
        length: input.length,
        audience: input.audience,
      });
      router.push(`/emails/${email.id}/generate`);
    } catch {
      autoTriggerRef.current = false;
    }
  };

  const handleGenerate = async () => {
    const trimmed = prompt.trim();
    if (!trimmed) return;
    if (!user) {
      const pending = { prompt: trimmed, tone, length, audience };
      savePendingPrompt(pending);
      openLogin(pending);
      return;
    }
    await createFromPrompt({ prompt: trimmed, tone, length, audience });
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
      await createFromPrompt({
        prompt: pending.prompt,
        tone: pending.tone ?? tone,
        length: pending.length ?? length,
        audience: pending.audience ?? audience,
      });
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

    setTemplateError(null);
    try {
      const slug = TEMPLATE_PREVIEW_SEED_SLUG[t.preview];
      if (slug) {
        const params = new URLSearchParams({
          prompt: `Use the "${t.name}" layout — ${t.category}`,
          tone: "Friendly",
          length: "Medium",
          audience: "Existing customers",
        });
        router.push(
          `/templates/${encodeURIComponent(slug)}/preview?${params.toString()}`,
        );
        return;
      }
      const email = await createEmail({
        prompt: `Use the "${t.name}" layout — ${t.category}`,
        tone: "Friendly",
        length: "Medium",
        audience: "Existing customers",
      });
      router.push(`/emails/${email.id}/generate`);
    } catch (err) {
      setTemplateError(
        err instanceof Error
          ? err.message
          : "Failed to start from template. Please try again.",
      );
    }
  };

  const useSuggestion = (s: string) => {
    setPrompt(s);
    taRef.current?.focus();
  };

  const categoryItems = CATEGORIES.map((c) => ({ value: c, label: c }));

  return (
    <div style={{ flex: 1, overflowY: "auto", background: "var(--bg)" }}>
      <section
        className="madoo-home-hero"
        style={{ maxWidth: 980, margin: "0 auto" }}
      >
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
            <Icon name="sparkle" size={12} /> AI email generator for better
            templates
          </div>
          <h1
            className="display"
            style={{
              fontSize: "clamp(32px, 7vw, 52px)",
              fontWeight: 400,
              lineHeight: 1.05,
              letterSpacing: 0,
              margin: 0,
              color: "var(--ink)",
            }}
          >
            AI Email Generator
            <br />
            <span style={{ fontStyle: "italic", color: "var(--accent-deep)" }}>
              for Better & Faster Email Templates
            </span>
          </h1>
          <p
            style={{
              fontSize: 16,
              color: "var(--ink-soft)",
              marginTop: 14,
              lineHeight: 1.5,
            }}
          >
            Describe the email you need. {brand} turns it into a polished,
            export-ready template.
          </p>
        </div>

        <div
          style={{
            background: "var(--surface)",
            border: "none",
            borderRadius: 18,
            padding: 4,
            boxShadow: "var(--shadow-border)",
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
              placeholder="e.g. Write a clear product update email for active users — concise, useful, and easy to skim."
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
            <Select
              label="Tone"
              value={tone}
              options={PROMPT_TONES}
              onChange={setTone}
              size="sm"
              variant="ghost"
            />
            <Select
              label="Length"
              value={length}
              options={PROMPT_LENGTHS}
              onChange={setLength}
              size="sm"
              variant="ghost"
            />
            <Select
              label="Audience"
              value={audience}
              options={PROMPT_AUDIENCES}
              onChange={setAudience}
              size="sm"
              variant="ghost"
            />
            <div style={{ flex: 1 }} />
            <Button
              variant="primary"
              size="md"
              onClick={() => void handleGenerate()}
              disabled={!prompt.trim() || creatingEmail}
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

      {user ? (
        <section
          className="madoo-home-recent"
          style={{ maxWidth: 1280, margin: "0 auto" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <h3
              className="display"
              style={{ margin: 0, fontSize: 28, fontWeight: 400 }}
            >
              Recent emails
            </h3>
            <div style={{ fontSize: 12, color: "var(--ink-faint)" }}>
              {loadingEmails ? "Loading…" : `${emails.length} saved`}
            </div>
          </div>
          {emails.length === 0 ? (
            <div
              style={{
                border: "1px dashed var(--border)",
                borderRadius: 14,
                padding: "16px 18px",
                color: "var(--ink-soft)",
                background: "var(--surface)",
                fontSize: 13,
              }}
            >
              Your generated emails will appear here.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 12,
              }}
            >
              {emails.slice(0, 12).map((email) => {
                const latest = email.variants[email.variants.length - 1];
                const preview = latest?.previewUrl ?? null;
                const goTo =
                  email.status === "DRAFT"
                    ? `/emails/${email.id}/generate`
                    : `/emails/${email.id}/editor`;
                return (
                  <button
                    key={email.id}
                    type="button"
                    onClick={() => router.push(goTo)}
                    style={{
                      textAlign: "left",
                      border: "1px solid var(--border)",
                      borderRadius: 14,
                      padding: 0,
                      background: "var(--surface)",
                      cursor: "pointer",
                      overflow: "hidden",
                    }}
                  >
                    {/* Preview thumbnail */}
                    <div
                      style={{
                        width: "100%",
                        height: 160,
                        background: preview
                          ? "transparent"
                          : "var(--surface-raised)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      {preview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={preview}
                          alt={email.title ?? "Email preview"}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            objectPosition: "top",
                          }}
                        />
                      ) : latest?.compiledHtml ? (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            overflow: "hidden",
                            background: "#fff",
                          }}
                        >
                          <iframe
                            title={email.title ?? "Email preview"}
                            srcDoc={latest.compiledHtml}
                            sandbox="allow-same-origin"
                            scrolling="no"
                            style={{
                              width: "100%",
                              height: "100%",
                              border: "none",
                              pointerEvents: "none",
                            }}
                          />
                        </div>
                      ) : (
                        <svg
                          width={32}
                          height={32}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="var(--ink-faint)"
                          strokeWidth={1.5}
                        >
                          <rect x={2} y={4} width={20} height={16} rx={2} />
                          <path d="M2 9h20" />
                          <path d="M7 13h3m-3 3h6" />
                        </svg>
                      )}
                    </div>

                    {/* Card info */}
                    <div style={{ padding: "12px 14px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--ink-faint)",
                            fontFamily: "var(--font-jetbrains-mono)",
                          }}
                        >
                          {shortEmailId(email.id)}
                        </div>
                        <div
                          style={{
                            fontSize: 10.5,
                            fontWeight: 600,
                            color: "var(--accent-deep)",
                            background: "var(--accent-soft)",
                            borderRadius: 999,
                            padding: "3px 8px",
                          }}
                        >
                          {email.status}
                        </div>
                      </div>
                      <div
                        style={{
                          marginTop: 6,
                          fontSize: 14,
                          fontWeight: 600,
                          color: "var(--ink)",
                        }}
                      >
                        {email.title ?? latest?.subject ?? "Untitled email"}
                      </div>
                      <div
                        style={{
                          marginTop: 4,
                          fontSize: 12.5,
                          color: "var(--ink-soft)",
                          lineHeight: 1.45,
                        }}
                      >
                        {email.prompt.slice(0, 80)}
                        {email.prompt.length > 80 ? "…" : ""}
                      </div>
                      <div
                        style={{
                          marginTop: 8,
                          fontSize: 11,
                          color: "var(--ink-faint)",
                        }}
                      >
                        {new Date(email.updatedAt).toLocaleString()}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      ) : null}

      <section
        className="madoo-home-templates rounded-[28px] bg-[color-mix(in_srgb,var(--surface)_86%,var(--accent-soft))] shadow-[var(--shadow-border),0_0_0_1px_rgb(var(--rule-rgb)/0.12)]!"
        style={{ maxWidth: 1280, margin: "0 auto" }}
      >
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
              className="display"
              style={{
                fontSize: 32,
                fontWeight: 400,
                margin: 0,
                letterSpacing: 0,
              }}
            >
              Or start with a template{" "}
              <span style={{ fontStyle: "italic", color: "var(--ink-soft)" }}>
                —
              </span>
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

        {templateError ? (
          <Banner tone="danger" style={{ marginBottom: 16 }}>
            {templateError}
          </Banner>
        ) : null}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 18,
          }}
        >
          {filtered.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              onClick={() => void onSelectTemplate(t)}
            />
          ))}
        </div>
      </section>

      <MarketingSeoSections />
    </div>
  );
}

function MarketingSeoSections() {
  return (
    <>
      <section
        className="madoo-home-seo"
        style={{ maxWidth: 1180, margin: "0 auto" }}
      >
        <div className="madoo-seo-band">
          <div>
            <p className="madoo-kicker">AI email workspace</p>
            <h2 className="display madoo-seo-heading">
              Generate better email templates with AI.
            </h2>
          </div>
          <p className="madoo-seo-lede">
            Madoo AI turns a plain-language email idea into a polished template.
            Prompt the AI, preview the design, refine the copy, and keep
            responsive HTML ready for your workflow.
          </p>
        </div>

        <div className="madoo-seo-grid">
          {productFeatures.map((feature) => (
            <article className="madoo-seo-card" key={feature.title}>
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        className="madoo-home-seo madoo-seo-split"
        style={{ maxWidth: 1180, margin: "0 auto" }}
      >
        <div>
          <p className="madoo-kicker">How it works</p>
          <h2 className="display madoo-seo-heading">
            From idea to export-ready email.
          </h2>
          <ol className="madoo-seo-steps">
            {productWorkflow.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
        <div>
          <p className="madoo-kicker">Use cases</p>
          <h2 className="display madoo-seo-heading">
            Built for repeatable email workflows.
          </h2>
          <div className="madoo-use-case-grid">
            {productUseCases.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
      </section>

      <section
        className="madoo-home-seo"
        style={{ maxWidth: 1180, margin: "0 auto" }}
      >
        <div className="madoo-faq-wrap">
          <div>
            <p className="madoo-kicker">Product FAQ</p>
            <h2 className="display madoo-seo-heading">
              Learn what Madoo AI does before you generate.
            </h2>
          </div>
          <div className="madoo-faq-list">
            {productFaq.map((item) => (
              <details key={item.question}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
