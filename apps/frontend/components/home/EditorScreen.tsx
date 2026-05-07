"use client";

import { consumeEmailSseStream, useEmail } from "@/hooks/use-emails";
import { shortEmailId } from "@/lib/email-id";
import { templatesApi } from "@/actions/templates";
import type { EmailVariantDto } from "@madoo/shared";
import {
  Banner,
  Button,
  Icon,
  IconButton,
  Input,
  Modal,
  SegmentedControl,
  Textarea,
} from "@madoo/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Streamdown } from "streamdown";
import "streamdown/styles.css";

export type GenParams = {
  prompt: string;
  tone: string;
  length?: string;
  audience?: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  /** `thinking` is streamed from Claude extended thinking (`thinking_delta`), not from parsed assistant text. */
  kind: "text" | "code" | "thinking";
  value: string;
};

export function EditorScreen({
  emailId,
  genSummary,
  onBack,
}: {
  emailId: string;
  genSummary: GenParams | null;
  onBack: () => void;
}) {
  const qc = useQueryClient();
  const { data: email, isLoading, refetch, isError } = useEmail(emailId);

  const variants = useMemo(() => {
    const list = email?.variants ?? [];
    return [...list].sort((a, b) => a.seq - b.seq);
  }, [email?.variants]);

  const [variantIdx, setVariantIdx] = useState(0);
  const activeVariant: EmailVariantDto | undefined = variants[variantIdx];
  const previousVariant: EmailVariantDto | undefined = variantIdx > 0 ? variants[variantIdx - 1] : undefined;

  const variantItems = variants.map((v, i) => ({
    value: String(i),
    label: `v${v.seq}`,
  }));

  const [aiPrompt, setAiPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [savedOk, setSavedOk] = useState(false);

  const saveTemplate = useMutation({
    mutationFn: () => templatesApi.saveFromVariant(activeVariant!.id, templateName.trim()),
    onSuccess: () => {
      setSaveModalOpen(false);
      setTemplateName("");
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 3000);
    },
  });
  const [variableDefaults, setVariableDefaults] = useState<Record<string, string>>({});
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [activeStreamingId, setActiveStreamingId] = useState<string | null>(null);
  const [previewHeight, setPreviewHeight] = useState<number>(640);
  const panelScrollRef = useRef<HTMLDivElement | null>(null);
  const previewObserverRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    const el = panelScrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [chatMessages]);

  useEffect(() => {
    setPreviewHeight(640);
    previewObserverRef.current?.disconnect();
    previewObserverRef.current = null;
  }, [activeVariant?.id]);

  const bindPreviewAutoHeight = useCallback((frame: HTMLIFrameElement | null) => {
    if (!frame) return;
    previewObserverRef.current?.disconnect();
    previewObserverRef.current = null;

    const doc = frame.contentDocument;
    if (!doc) return;
    const root = doc.documentElement;
    const body = doc.body;
    if (!root || !body) return;

    const ensurePreviewResetStyles = () => {
      const id = "madoo-email-preview-reset";
      if (doc.getElementById(id)) return;
      const style = doc.createElement("style");
      style.id = id;
      style.textContent = `
        html { overflow-x: hidden; }
        body { margin: 0; overflow-x: hidden; overflow-y: visible !important; }
      `;
      doc.head.appendChild(style);
    };

    ensurePreviewResetStyles();

    const measure = () => {
      const raw = Math.max(
        body.scrollHeight,
        body.offsetHeight,
        root.scrollHeight,
        root.clientHeight,
      );
      const nextHeight = Math.ceil(raw) + 24;
      if (nextHeight > 0) {
        setPreviewHeight((prev) => (Math.abs(prev - nextHeight) > 2 ? nextHeight : prev));
      }
    };

    measure();
    requestAnimationFrame(() => requestAnimationFrame(measure));

    const observer = new ResizeObserver(measure);
    observer.observe(root);
    observer.observe(body);
    previewObserverRef.current = observer;
  }, []);

  const changedLines = useMemo(() => {
    if (!activeVariant || !previousVariant) return [];
    const previous = new Set(
      previousVariant.componentCode
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    );
    return activeVariant.componentCode
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !previous.has(line))
      .slice(0, 4);
  }, [activeVariant, previousVariant]);

  const runEdit = useCallback(
    async (instruction: string) => {
      if (!instruction.trim() || busy) return;
      setBusy(true);
      setEditError(null);
      const userText = instruction.trim();
      const turnStamp = Date.now();
      const userMessageId = `user-${turnStamp}`;
      const assistantThinkingId = `assistant-thinking-${turnStamp}`;
      const assistantTextId = `assistant-text-${turnStamp}`;
      const assistantCodeId = `assistant-code-${turnStamp}`;
      setChatMessages((prev) => [
        ...prev,
        { id: userMessageId, role: "user", kind: "text", value: userText },
      ]);
      setActiveStreamingId(assistantTextId);
      try {
        await consumeEmailSseStream(
          `/api/emails/${emailId}/edit`,
          (ev) => {
            if (ev.type === "error") setEditError(ev.message);
            if (ev.type === "thinking-chunk") {
              setActiveStreamingId(assistantThinkingId);
              setChatMessages((prev) => {
                const idx = prev.findIndex((m) => m.id === assistantThinkingId);
                if (idx === -1) {
                  return [
                    ...prev,
                    {
                      id: assistantThinkingId,
                      role: "assistant",
                      kind: "thinking",
                      value: ev.value,
                    },
                  ];
                }
                const next = [...prev];
                next[idx] = {
                  ...next[idx],
                  value: `${next[idx].value}${ev.value}`,
                };
                return next;
              });
            }
            if (ev.type === "assistant-chunk") {
              setActiveStreamingId(assistantTextId);
              setChatMessages((prev) => {
                const idx = prev.findIndex((m) => m.id === assistantTextId);
                if (idx === -1) {
                  return [
                    ...prev,
                    { id: assistantTextId, role: "assistant", kind: "text", value: ev.value },
                  ];
                }
                const next = [...prev];
                next[idx] = {
                  ...next[idx],
                  value: `${next[idx].value}${ev.value}`,
                };
                return next;
              });
            }
            if (ev.type === "code-chunk") {
              setActiveStreamingId(assistantCodeId);
              setChatMessages((prev) => {
                const idx = prev.findIndex((m) => m.id === assistantCodeId);
                if (idx === -1) {
                  return [
                    ...prev,
                    { id: assistantCodeId, role: "assistant", kind: "code", value: ev.value },
                  ];
                }
                const next = [...prev];
                next[idx] = {
                  ...next[idx],
                  value: `${next[idx].value}${ev.value}`,
                };
                return next;
              });
            }
            if (ev.type === "done") {
              void qc.invalidateQueries({ queryKey: ["email", emailId] });
              void qc.invalidateQueries({ queryKey: ["emails"] });
              void refetch().then((res) => {
                const n = res.data?.variants?.length ?? 0;
                if (n > 0) setVariantIdx(Math.min(n - 1, 2));
              });
            }
          },
          undefined,
          JSON.stringify({
            instruction: userText,
            baseVariantId: activeVariant?.id,
          }),
        );
      } catch (e) {
        setEditError(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(false);
        setAiPrompt("");
        setActiveStreamingId(null);
      }
    },
    [activeVariant?.id, busy, emailId, qc, refetch],
  );

  if (isLoading || !email) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--ink-soft)" }}>{isError ? "Could not load email." : "Loading…"}</p>
      </div>
    );
  }

  const subject = activeVariant?.subject ?? "No subject yet";

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
          <div style={{ fontSize: 11, color: "var(--ink-faint)", fontFamily: "var(--font-jetbrains-mono)" }}>
            {shortEmailId(emailId)}
          </div>
          <div style={{ width: 1, height: 20, background: "var(--border)" }} />
          <input
            readOnly
            value={subject}
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
            {variants.length > 0 ? (
              <SegmentedControl
                items={variantItems}
                value={String(variantIdx)}
                onChange={(v: string) => setVariantIdx(Number(v))}
                aria-label="Variant"
              />
            ) : null}
            {savedOk ? (
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "var(--accent-deep)" }}>
                <Icon name="check" size={13} stroke={2.4} /> Saved as template
              </div>
            ) : (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Icon name="star" size={12} />}
                disabled={!activeVariant}
                onClick={() => {
                  setTemplateName(activeVariant?.subject ?? "");
                  setSaveModalOpen(true);
                }}
              >
                Save template
              </Button>
            )}
          </div>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            padding: "32px 24px 60px",
            background: "var(--bg-2)",
          }}
        >
          {activeVariant?.compiledHtml ? (
            <iframe
              title="Email preview"
              onLoad={(e) => bindPreviewAutoHeight(e.currentTarget)}
              srcDoc={activeVariant.compiledHtml}
              sandbox="allow-same-origin"
              style={{
                display: "block",
                width: "100%",
                maxWidth: 640,
                height: previewHeight,
                margin: "0 auto",
                border: "1px solid var(--border)",
                borderRadius: 12,
                background: "#fff",
                overflow: "hidden",
                verticalAlign: "top",
              }}
            />
          ) : (
            <p style={{ textAlign: "center", color: "var(--ink-soft)" }}>No preview yet.</p>
          )}
        </div>
      </div>

      <aside
        style={{
          width: 390,
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
          ref={panelScrollRef}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {genSummary ? (
            <Banner tone="accent" title="Brief">
              {genSummary.prompt.slice(0, 220)}
              {genSummary.prompt.length > 220 ? "…" : ""}
            </Banner>
          ) : null}
          {editError ? (
            <Banner tone="danger" title="Edit failed">
              {editError}
            </Banner>
          ) : null}
          {changedLines.length > 0 ? (
            <Banner tone="accent" title="Variant diff">
              {changedLines.join(" · ")}
            </Banner>
          ) : null}
          {activeVariant?.variableSchema?.variables?.length ? (
            <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-faint)", marginBottom: 8 }}>
                VARIABLE SCHEMA
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {activeVariant.variableSchema.variables.map((variable) => {
                  const currentDefault = variableDefaults[variable.name] ?? variable.default;
                  return (
                    <div key={variable.name} style={{ display: "grid", gap: 6 }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>
                        {variable.label ?? variable.name}
                      </div>
                      <input
                        value={currentDefault}
                        onChange={(e) =>
                          setVariableDefaults((prev) => ({ ...prev, [variable.name]: e.target.value }))
                        }
                        placeholder="Default value"
                        style={{
                          height: 32,
                          borderRadius: 8,
                          border: "1px solid var(--border)",
                          padding: "0 10px",
                          fontSize: 12.5,
                          fontFamily: "inherit",
                        }}
                      />
                      <Button variant="secondary" size="sm" block disabled>
                        Map to contact field (Phase 2)
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
          <Banner tone="accent" title="Suggestion">
            Subject lines under ~50 characters often improve opens. Try variant <b>v2</b> after an edit.
          </Banner>
          {chatMessages.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--ink-faint)",
                    letterSpacing: 1,
                  }}
                >
                  CONVERSATION
                </div>
                {busy ? (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 10,
                      color: "var(--accent-deep)",
                      fontWeight: 600,
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "var(--accent)",
                        animation: "pulse 1.2s ease-in-out infinite",
                      }}
                    />
                    Streaming
                  </div>
                ) : null}
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  paddingRight: 4,
                }}
              >
                {chatMessages.map((message) => {
                  const isStreaming = busy && message.id === activeStreamingId;
                  if (message.role === "user") {
                    return (
                      <div
                        key={message.id}
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                        }}
                      >
                        <div
                          style={{
                            maxWidth: "85%",
                            background: "var(--accent)",
                            color: "var(--accent-fg)",
                            borderRadius: "12px 12px 4px 12px",
                            padding: "8px 11px",
                            fontSize: 12.5,
                            lineHeight: 1.45,
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                          }}
                        >
                          {message.value}
                        </div>
                      </div>
                    );
                  }
                  if (message.kind === "thinking") {
                    return (
                      <div
                        key={message.id}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 6,
                            background: "var(--accent-soft)",
                            color: "var(--accent-deep)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            marginTop: 2,
                          }}
                        >
                          <Icon name="sparkle" size={11} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <details
                            style={{
                              border: "1px solid var(--border)",
                              borderRadius: 8,
                              background: "var(--surface)",
                              padding: "6px 8px",
                            }}
                            open
                          >
                            <summary
                              style={{
                                cursor: "pointer",
                                fontSize: 11,
                                fontWeight: 600,
                                color: "var(--ink-soft)",
                              }}
                            >
                              Thinking
                            </summary>
                            <div style={{ marginTop: 6 }}>
                              <Streamdown className="ai-conversation-markdown">
                                {message.value}
                              </Streamdown>
                              {isStreaming ? (
                                <span
                                  style={{
                                    display: "inline-block",
                                    width: 6,
                                    height: 12,
                                    background: "var(--accent)",
                                    marginLeft: 2,
                                    verticalAlign: "text-bottom",
                                    animation: "blink 0.9s steps(2, end) infinite",
                                  }}
                                />
                              ) : null}
                            </div>
                          </details>
                        </div>
                      </div>
                    );
                  }
                  if (message.kind === "code") {
                    return (
                      <div
                        key={message.id}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 6,
                            background: "var(--accent-soft)",
                            color: "var(--accent-deep)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            marginTop: 2,
                          }}
                        >
                          <Icon name="sparkle" size={11} />
                        </div>
                        <div
                          style={{
                            maxWidth: "85%",
                            background: "var(--surface)",
                            color: "var(--ink-soft)",
                            borderRadius: "10px",
                            padding: "8px 11px",
                            fontSize: 12.5,
                            lineHeight: 1.4,
                            border: "1px solid var(--border)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          {isStreaming ? (
                            <>
                              <span
                                style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: "50%",
                                  background: "var(--accent)",
                                  animation: "pulse 1.2s ease-in-out infinite",
                                }}
                              />
                              Editando componente...
                            </>
                          ) : (
                            "Componente actualizado."
                          )}
                        </div>
                      </div>
                    );
                  }
                  const markdownValue = message.value;
                  return (
                    <div
                      key={message.id}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          background: "var(--accent-soft)",
                          color: "var(--accent-deep)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          marginTop: 2,
                        }}
                      >
                        <Icon name="sparkle" size={11} />
                      </div>
                      <div
                        style={{
                          maxWidth: "85%",
                          background: "var(--bg-2)",
                          color: "var(--ink)",
                          borderRadius: "12px 12px 12px 4px",
                          padding: "8px 11px",
                          fontSize: 12.5,
                          lineHeight: 1.5,
                          wordBreak: "break-word",
                          border: "1px solid var(--border-soft)",
                        }}
                      >
                        <Streamdown className="ai-conversation-markdown">{markdownValue}</Streamdown>
                        {isStreaming ? (
                          <span
                            style={{
                              display: "inline-block",
                              width: 6,
                              height: 12,
                              background: "var(--accent)",
                              marginLeft: 2,
                              verticalAlign: "text-bottom",
                              animation: "blink 0.9s steps(2, end) infinite",
                            }}
                          />
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
        <div style={{ padding: 14, borderTop: "1px solid var(--border)" }}>
          <div style={{ marginBottom: 10 }}>
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                letterSpacing: 0.8,
                color: "var(--ink-faint)",
                marginBottom: 7,
              }}
            >
              QUICK EDITS
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {[
                "Make it shorter",
                "More casual tone",
                "Add urgency",
                "Strengthen the CTA",
                "Translate to Spanish",
              ].map((q) => (
                <Button
                  key={q}
                  variant="secondary"
                  size="sm"
                  disabled={busy}
                  onClick={() => void runEdit(q)}
                >
                  {q}
                </Button>
              ))}
            </div>
          </div>
          <div style={{ position: "relative" }}>
            <Textarea
              value={aiPrompt}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setAiPrompt(e.target.value)}
              placeholder="Tell AI what to change…"
              variant="filled"
              noResize
              rows={3}
              disabled={busy}
            />
            <IconButton
              variant="solid"
              size="sm"
              aria-label="Send AI instruction"
              style={{ position: "absolute", right: 6, bottom: 6 }}
              disabled={busy || !aiPrompt.trim()}
              onClick={() => void runEdit(aiPrompt)}
            >
              <Icon name="arrowUp" size={14} />
            </IconButton>
          </div>
        </div>
      </aside>

      <Modal
        open={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        title="Save as template"
        description="Give this email a name. It will appear in your template gallery."
        size="sm"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Input
            label="Template name"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="e.g. Welcome email"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && templateName.trim()) saveTemplate.mutate();
            }}
          />
          {saveTemplate.isError ? (
            <Banner tone="danger">
              {saveTemplate.error instanceof Error ? saveTemplate.error.message : "Failed to save template."}
            </Banner>
          ) : null}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button variant="ghost" size="md" onClick={() => setSaveModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              disabled={!templateName.trim() || saveTemplate.isPending}
              onClick={() => saveTemplate.mutate()}
            >
              {saveTemplate.isPending ? "Saving…" : "Save template"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
