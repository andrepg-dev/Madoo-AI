"use client";

import {
  consumeEmailSseStream,
  useEmail,
  useUpdateEmailVariantVariableSchema,
} from "@/hooks/use-emails";
import { shortEmailId } from "@/lib/email-id";
import type { EmailVariantDto, VariableSchemaRoot } from "@madoo/shared";
import {
  Banner,
  Button,
  Icon,
  IconButton,
  Modal,
  SegmentedControl,
  Textarea,
} from "@madoo/ui";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  type ChangeEvent,
  type PointerEvent as ReactPointerEvent,
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

type VariableScope = "dynamic" | "static";

const TEMPLATE_EXPORT_PRICE_LABEL = "$0.45";
const MIN_AI_SIDEBAR_WIDTH = 320;
const DEFAULT_AI_SIDEBAR_WIDTH = 390;
const MAX_AI_SIDEBAR_WIDTH = 620;

function buildExportFilename(emailId: string) {
  return `madoo-${shortEmailId(emailId)}-template.html`;
}

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
  const router = useRouter();
  const { data: email, isLoading, refetch, isError } = useEmail(emailId);
  const updateVariables = useUpdateEmailVariantVariableSchema(emailId);

  const variants = useMemo(() => {
    const list = email?.variants ?? [];
    return [...list].sort((a, b) => a.seq - b.seq);
  }, [email?.variants]);

  const [variantIdx, setVariantIdx] = useState(0);
  const activeVariant: EmailVariantDto | undefined = variants[variantIdx];

  const variantItems = variants.map((v, i) => ({
    value: String(i),
    label: `v${v.seq}`,
  }));

  const [aiPrompt, setAiPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [variableDefaults, setVariableDefaults] = useState<Record<string, string>>({});
  const [variableScopes, setVariableScopes] = useState<Record<string, VariableScope>>({});
  const [variableSaveMessage, setVariableSaveMessage] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [activeStreamingId, setActiveStreamingId] = useState<string | null>(null);
  const [previewHeight, setPreviewHeight] = useState<number>(640);
  const [aiSidebarWidth, setAiSidebarWidth] = useState(DEFAULT_AI_SIDEBAR_WIDTH);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  const panelScrollRef = useRef<HTMLDivElement | null>(null);
  const previewObserverRef = useRef<ResizeObserver | null>(null);

  const startAiSidebarResize = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      const startX = event.clientX;
      const startWidth = aiSidebarWidth;
      const maxWidth = Math.min(
        MAX_AI_SIDEBAR_WIDTH,
        Math.max(MIN_AI_SIDEBAR_WIDTH, window.innerWidth - 480),
      );
      const previousCursor = document.body.style.cursor;
      const previousUserSelect = document.body.style.userSelect;

      const onPointerMove = (moveEvent: PointerEvent) => {
        const nextWidth = startWidth + startX - moveEvent.clientX;
        setAiSidebarWidth(Math.min(maxWidth, Math.max(MIN_AI_SIDEBAR_WIDTH, nextWidth)));
      };

      const onPointerUp = () => {
        document.body.style.cursor = previousCursor;
        document.body.style.userSelect = previousUserSelect;
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
      };

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    },
    [aiSidebarWidth],
  );

  useEffect(() => {
    if (variants.length > 0) setVariantIdx(variants.length - 1);
  }, [emailId, variants.length]);

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

  useEffect(() => {
    const nextDefaults = Object.fromEntries(
      activeVariant?.variableSchema.variables.map((variable) => [
        variable.name,
        variable.default,
      ]) ?? [],
    );
    const nextScopes = Object.fromEntries(
      activeVariant?.variableSchema.variables.map((variable) => [
        variable.name,
        (variable.scope ?? "dynamic") as VariableScope,
      ]) ?? [],
    );
    setVariableDefaults(nextDefaults);
    setVariableScopes(nextScopes);
    setVariableSaveMessage(null);
    updateVariables.reset();
  }, [activeVariant?.id]);

  const variableSchemaDraft = useMemo<VariableSchemaRoot | null>(() => {
    if (!activeVariant?.variableSchema.variables.length) return null;
    return {
      variables: activeVariant.variableSchema.variables.map((variable) => ({
        ...variable,
        default: variableDefaults[variable.name] ?? variable.default,
        scope: variableScopes[variable.name] ?? (variable.scope ?? "dynamic"),
      })),
    };
  }, [activeVariant?.variableSchema.variables, variableDefaults, variableScopes]);

  const variablesDirty = useMemo(() => {
    if (!activeVariant?.variableSchema.variables.length) return false;
    return activeVariant.variableSchema.variables.some(
      (variable) =>
        (variableDefaults[variable.name] ?? variable.default) !== variable.default ||
        (variableScopes[variable.name] ?? (variable.scope ?? "dynamic")) !==
          (variable.scope ?? "dynamic"),
    );
  }, [activeVariant?.variableSchema.variables, variableDefaults, variableScopes]);

  const exportFilename = useMemo(() => buildExportFilename(emailId), [emailId]);

  const saveVariables = useCallback(async () => {
    if (!activeVariant || !variableSchemaDraft || updateVariables.isPending) return;
    setVariableSaveMessage(null);
    try {
      await updateVariables.mutateAsync({
        variantId: activeVariant.id,
        variableSchema: variableSchemaDraft,
      });
      setVariableSaveMessage("Variables saved.");
    } catch (err) {
      setVariableSaveMessage(err instanceof Error ? err.message : "Could not save variables.");
    }
  }, [activeVariant, updateVariables, variableSchemaDraft]);

  const goToCampaignCompose = useCallback(() => {
    router.push(`/campaigns?compose=1&emailId=${encodeURIComponent(emailId)}`);
  }, [emailId, router]);

  const openExportDialog = useCallback(() => {
    setExportFeedback(null);
    setExportModalOpen(true);
  }, []);

  const copyCompiledHtml = useCallback(async () => {
    if (!activeVariant?.compiledHtml) return;
    try {
      await navigator.clipboard.writeText(activeVariant.compiledHtml);
      setExportFeedback("Copied compiled HTML.");
    } catch {
      setExportFeedback("Could not copy HTML. Download file instead.");
    }
  }, [activeVariant?.compiledHtml]);

  const downloadCompiledHtml = useCallback(() => {
    if (!activeVariant?.compiledHtml) return;
    const blob = new Blob([activeVariant.compiledHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = exportFilename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setExportFeedback("Compiled HTML downloaded.");
  }, [activeVariant?.compiledHtml, exportFilename]);

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
      setAiPrompt("");
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
    <div className="madoo-editor-shell" style={{ flex: 1, display: "flex", overflow: "hidden", background: "var(--bg)" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
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
        className="madoo-editor-aside"
        style={{
          width: aiSidebarWidth,
          borderLeft: "1px solid var(--border)",
          background: "var(--surface)",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          position: "relative",
        }}
      >
        <button
          type="button"
          className="madoo-editor-resize-handle"
          aria-label="Resize AI sidebar"
          onPointerDown={startAiSidebarResize}
          style={{
            position: "absolute",
            top: 0,
            left: -5,
            width: 10,
            height: "100%",
            border: "none",
            padding: 0,
            background: "transparent",
            cursor: "col-resize",
            zIndex: 4,
          }}
        />
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
          {editError ? (
            <Banner tone="danger" title="Edit failed">
              {editError}
            </Banner>
          ) : null}
          {activeVariant?.variableSchema?.variables?.length ? (
            <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 10 }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  marginBottom: 10,
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-faint)" }}>
                  VARIABLE SCHEMA
                </div>
                <div style={{ fontSize: 11.5, lineHeight: 1.4, color: "var(--ink-soft)" }}>
                  Set fallback values. Dynamic fields can be replaced when sending a campaign.
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {activeVariant.variableSchema.variables.map((variable) => {
                  const currentDefault = variableDefaults[variable.name] ?? variable.default;
                  const currentScope = variableScopes[variable.name] ?? (variable.scope ?? "dynamic");
                  return (
                    <div key={variable.name} style={{ display: "grid", gap: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>
                          {variable.label ?? variable.name}
                        </div>
                        <Button
                          variant={currentScope === "dynamic" ? "accent" : "secondary"}
                          size="sm"
                          onClick={() =>
                            setVariableScopes((prev) => ({
                              ...prev,
                              [variable.name]:
                                (prev[variable.name] ?? (variable.scope ?? "dynamic")) === "dynamic"
                                  ? "static"
                                  : "dynamic",
                            }))
                          }
                          style={{ marginLeft: "auto", textTransform: "capitalize" }}
                        >
                          {currentScope}
                        </Button>
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
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
          {variablesDirty || variableSaveMessage ? (
            <div
              style={{
                position: "sticky",
                bottom: 8,
                zIndex: 3,
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: "10px 12px",
                background: "var(--surface)",
                boxShadow: "0 14px 28px rgba(0,0,0,0.12)",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: updateVariables.isError ? "var(--danger)" : "var(--ink-soft)",
                }}
              >
                {variableSaveMessage ?? "You have unsaved variable changes."}
              </div>
              {variablesDirty ? (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={updateVariables.isPending}
                  onClick={() => void saveVariables()}
                  style={{ marginLeft: "auto", flexShrink: 0 }}
                >
                  {updateVariables.isPending ? "Saving…" : "Save variables"}
                </Button>
              ) : null}
            </div>
          ) : null}
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
                              Editing component...
                            </>
                          ) : (
                            "Component updated."
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
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 8,
              marginTop: "auto",
            }}
          >
            <Button
              variant="primary"
              size="sm"
              disabled={!activeVariant}
              onClick={goToCampaignCompose}
              leftIcon={<Icon name="send" size={13} />}
              style={{ minHeight: 36, borderRadius: 999 }}
            >
              Send campaign
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={!activeVariant?.compiledHtml}
              onClick={openExportDialog}
              leftIcon={<Icon name="download" size={13} />}
              style={{ minHeight: 36, borderRadius: 999 }}
            >
              Export template
            </Button>
          </div>
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
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const isMod = e.metaKey || e.ctrlKey;
                  if (isMod) {
                    // Cmd + Enter (Mac) or Ctrl + Enter (Win): Newline
                    e.preventDefault();
                    const { selectionStart, selectionEnd, value } = e.currentTarget;
                    setAiPrompt(
                      value.substring(0, selectionStart) + "\n" + value.substring(selectionEnd),
                    );
                    const target = e.currentTarget;
                    setTimeout(() => {
                      target.selectionStart = target.selectionEnd = selectionStart + 1;
                    }, 0);
                  } else if (!e.shiftKey) {
                    // Plain Enter: Send
                    e.preventDefault();
                    if (!busy && aiPrompt.trim()) {
                      void runEdit(aiPrompt);
                    }
                  }
                }
              }}
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
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        size="md"
        eyebrow="EXPORT TEMPLATE"
        title="Download compiled HTML"
        description={`Exporting this template costs ${TEMPLATE_EXPORT_PRICE_LABEL}. Sending with Madoo stays free.`}
        footer={
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Icon name="copy" size={12} />}
              disabled={!activeVariant?.compiledHtml}
              onClick={() => void copyCompiledHtml()}
            >
              Copy HTML
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Icon name="download" size={12} />}
              disabled={!activeVariant?.compiledHtml}
              onClick={downloadCompiledHtml}
            >
              Download HTML
            </Button>
          </div>
        }
      >
        <div style={{ display: "grid", gap: 12 }}>
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: 8,
              background: "var(--bg-2)",
              padding: 14,
              display: "grid",
              gap: 10,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--ink-faint)" }}>
              PRICING
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13 }}>
              <span style={{ color: "var(--ink-soft)" }}>Compiled HTML export</span>
              <strong>{TEMPLATE_EXPORT_PRICE_LABEL}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13 }}>
              <span style={{ color: "var(--ink-soft)" }}>Madoo campaign send</span>
              <strong>$0.00</strong>
            </div>
            <div style={{ height: 1, background: "var(--border)" }} />
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 15 }}>
              <span style={{ fontWeight: 800 }}>Total</span>
              <strong>{TEMPLATE_EXPORT_PRICE_LABEL}</strong>
            </div>
            <div
              style={{
                border: "1px solid var(--border-soft)",
                borderRadius: 8,
                background: "var(--surface)",
                padding: 10,
                fontSize: 12,
                lineHeight: 1.45,
                color: "var(--ink-soft)",
              }}
            >
              File: <span className="mono" style={{ color: "var(--ink)" }}>{exportFilename}</span>
            </div>
          </div>
          {exportFeedback ? (
            <Banner tone="success" title="Export ready">
              {exportFeedback}
            </Banner>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}
