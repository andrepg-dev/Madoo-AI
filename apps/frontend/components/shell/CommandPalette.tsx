"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Icon, Kbd, type IconName } from "@madoo/design-system";
import { assistantApi } from "@/actions/assistant";
import { ApiError } from "@/lib/api/fetch-wrapper";

type PaletteItem = {
  kind: "action" | "nav" | "doc";
  icon: IconName;
  title: string;
  sub: string;
  href?: string;
};

const PALETTE_ITEMS: PaletteItem[] = [
  { kind: "action", icon: "sparkle", title: "Generate new email", sub: "Start with an AI prompt", href: "/" },
  { kind: "nav", icon: "home", title: "Home", sub: "Dashboard", href: "/" },
  { kind: "nav", icon: "sliders", title: "Settings", sub: "User & workspace settings", href: "/settings" },
];

const ASK_SUGGESTIONS = [
  "How many emails are in this workspace?",
  "Summarize this workspace",
];

export function CommandPalette({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const [askedQuestion, setAskedQuestion] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    data: askResult,
    error: askError,
    isPending: isAnswering,
    mutate: askMadoo,
    reset: resetAsk,
  } = useMutation({
    mutationFn: assistantApi.ask,
  });

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const trimmedQuery = query.trim();
  const isAsk =
    trimmedQuery.length > 0 &&
    (trimmedQuery.endsWith("?") ||
      ASK_SUGGESTIONS.includes(trimmedQuery) ||
      /^(ask|how|what|write|why|when|who|where|which|should|can|could|show|tell|best)\s/i.test(trimmedQuery));

  const items = useMemo(() => {
    if (!query) return PALETTE_ITEMS.slice(0, 7);
    return PALETTE_ITEMS.filter(
      (i) => (i.title + " " + i.sub).toLowerCase().includes(query.toLowerCase()),
    ).slice(0, 8);
  }, [query]);

  const answerBlocks = useMemo(
    () =>
      (askResult?.answer ?? "")
        .split(/\n{2,}/)
        .map((block) => block.trim())
        .filter(Boolean),
    [askResult?.answer],
  );

  const updateQuery = useCallback(
    (value: string) => {
      setQuery(value);
      setActiveIdx(0);
      setAskedQuestion("");
      resetAsk();
    },
    [resetAsk],
  );

  const navigate = useCallback(
    (href: string) => {
      router.push(href);
      onClose();
    },
    [onClose, router],
  );

  const handleAsk = useCallback(() => {
    const trimmed = query.trim();
    if (!trimmed || isAnswering) return;
    setAskedQuestion(trimmed);
    askMadoo({ question: trimmed });
  }, [askMadoo, isAnswering, query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, Math.max(items.length - 1, 0)));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter" && isAsk) {
        e.preventDefault();
        void handleAsk();
        return;
      }
      if (e.key === "Enter" && items[activeIdx]?.href) {
        navigate(items[activeIdx].href!);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIdx, handleAsk, isAsk, items, navigate]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(20,15,10,0.35)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        zIndex: 200,
        paddingTop: "12vh",
        padding: "12vh 16px 16px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 580,
          background: "var(--surface)",
          borderRadius: 14,
          boxShadow: "0 30px 80px -20px rgba(20,15,10,0.4)",
          overflow: "hidden",
          border: "1px solid var(--border)",
        }}
      >
        {/* Search input */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 18px",
            borderBottom: "1px solid var(--border-soft)",
          }}
        >
          <div style={{ color: isAsk ? "var(--accent-deep)" : "var(--ink-faint)" }}>
            <Icon name={isAsk ? "sparkle" : "search"} size={16} />
          </div>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => updateQuery(e.target.value)}
            placeholder="Search anything, or ask a question…"
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: 16,
              color: "var(--ink)",
              background: "transparent",
              fontFamily: "inherit",
            }}
          />
          {isAsk && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "3px 8px",
                background: "var(--accent-soft)",
                color: "var(--accent-deep)",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              <Icon name="sparkle" size={10} /> Ask AI
            </span>
          )}
          <Kbd>esc</Kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 420, overflowY: "auto", padding: 6 }}>
          {isAsk ? (
            <div style={{ padding: "16px 16px 12px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 9,
                    background: "var(--ink)",
                    color: "var(--surface)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon name="sparkle" size={14} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)", letterSpacing: 0.2 }}>
                    Madoo AI
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 2 }}>
                    {isAnswering ? "Answering..." : askResult ? "Answered in this modal" : "Ready"}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!query.trim() || isAnswering}
                  onClick={handleAsk}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    height: 32,
                    padding: "0 12px",
                    borderRadius: 8,
                    border: "1px solid var(--ink)",
                    background: "var(--ink)",
                    color: "var(--surface)",
                    cursor: !query.trim() || isAnswering ? "wait" : "pointer",
                    opacity: !query.trim() || isAnswering ? 0.68 : 1,
                    fontFamily: "inherit",
                    fontSize: 12.5,
                    fontWeight: 600,
                  }}
                >
                  {isAnswering ? "Thinking..." : askResult ? "Ask again" : "Ask"}
                  <span style={{ fontSize: 11, opacity: 0.75 }}>↵</span>
                </button>
              </div>

              <div
                style={{
                  borderLeft: "3px solid var(--accent)",
                  paddingLeft: 12,
                  marginBottom: 14,
                }}
              >
                <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--ink-faint)", textTransform: "uppercase", letterSpacing: 0.8 }}>
                  Question
                </div>
                <div
                  style={{
                    fontSize: 14,
                    color: "var(--ink)",
                    lineHeight: 1.45,
                    marginTop: 4,
                    overflowWrap: "anywhere",
                  }}
                >
                  {askedQuestion || query.trim()}
                </div>
              </div>

              {isAnswering ? (
                <div
                  aria-live="polite"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    padding: "4px 0 6px",
                  }}
                >
                  {[92, 74, 86].map((width) => (
                    <div
                      key={width}
                      style={{
                        height: 9,
                        width: `${width}%`,
                        borderRadius: 999,
                        background: "linear-gradient(90deg, var(--surface-2), var(--accent-soft), var(--surface-2))",
                      }}
                    />
                  ))}
                </div>
              ) : askResult ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    color: "var(--ink)",
                    fontSize: 13.5,
                    lineHeight: 1.55,
                  }}
                >
                  {answerBlocks.map((block, i) => (
                    <p
                      key={`${askResult.generatedAt}-${i}`}
                      style={{
                        margin: 0,
                        whiteSpace: "pre-wrap",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {block}
                    </p>
                  ))}
                </div>
              ) : null}

              {askError ? (
                <div
                  role="alert"
                  style={{
                    marginTop: 10,
                    padding: "10px 12px",
                    borderRadius: 8,
                    background: "rgba(176, 64, 64, 0.08)",
                    color: "#A34242",
                    fontSize: 12,
                    lineHeight: 1.4,
                  }}
                >
                  {toErrorMessage(askError)}
                </div>
              ) : null}
              {items.length > 0 && (
                <>
                  <div
                    style={{
                      fontSize: 10.5,
                      fontWeight: 600,
                      letterSpacing: 1,
                      color: "var(--ink-faint)",
                      padding: "14px 4px 6px",
                      textTransform: "uppercase",
                    }}
                  >
                    Or jump to
                  </div>
                  {items.slice(0, 3).map((item, i) => (
                    <PaletteRow
                      key={i}
                      item={item}
                      active={false}
                      onClick={() => item.href && navigate(item.href)}
                    />
                  ))}
                </>
              )}
            </div>
          ) : !query ? (
            <>
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 600,
                  letterSpacing: 1,
                  color: "var(--ink-faint)",
                  padding: "12px 14px 6px",
                  textTransform: "uppercase",
                }}
              >
                Suggested
              </div>
              {items.map((item, i) => (
                <PaletteRow
                  key={i}
                  item={item}
                  active={i === activeIdx}
                  onClick={() => item.href && navigate(item.href)}
                />
              ))}
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 600,
                  letterSpacing: 1,
                  color: "var(--ink-faint)",
                  padding: "14px 14px 6px",
                  textTransform: "uppercase",
                }}
              >
                Ask AI
              </div>
              {ASK_SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => updateQuery(s)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--surface-2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 14px",
                    border: "none",
                    background: "transparent",
                    color: "var(--ink-soft)",
                    fontSize: 13,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    textAlign: "left",
                  }}
                >
                  <Icon name="sparkle" size={12} />
                  <span style={{ flex: 1 }}>{s}</span>
                  <Icon name="arrow" size={11} />
                </button>
              ))}
            </>
          ) : items.length > 0 ? (
            items.map((item, i) => (
              <PaletteRow
                key={i}
                item={item}
                active={i === activeIdx}
                onClick={() => item.href && navigate(item.href)}
              />
            ))
          ) : (
            <div
              style={{
                padding: 32,
                textAlign: "center",
                color: "var(--ink-faint)",
                fontSize: 13,
              }}
            >
              Nothing matches &ldquo;{query}&rdquo;. Try ending with <b>?</b> to ask AI.
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "10px 16px",
            borderTop: "1px solid var(--border-soft)",
            fontSize: 11,
            color: "var(--ink-faint)",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <Kbd>↑↓</Kbd> navigate
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <Kbd>↵</Kbd> select
          </span>
          <span
            style={{
              marginLeft: "auto",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            End with <b>?</b> to ask AI
          </span>
        </div>
      </div>
    </div>
  );
}

function PaletteRow({
  item,
  active,
  onClick,
}: {
  item: PaletteItem;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--surface-2)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = active ? "var(--surface-2)" : "transparent";
      }}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 14px",
        border: "none",
        background: active ? "var(--surface-2)" : "transparent",
        cursor: "pointer",
        fontFamily: "inherit",
        textAlign: "left",
        borderRadius: 8,
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 7,
          background: item.kind === "action" ? "var(--accent-soft)" : "var(--bg-2)",
          color: item.kind === "action" ? "var(--accent-deep)" : "var(--ink-soft)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon name={item.icon} size={13} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>{item.title}</div>
        <div style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 1 }}>{item.sub}</div>
      </div>
      <span
        style={{
          fontSize: 10.5,
          color: "var(--ink-faint)",
          textTransform: "uppercase",
          letterSpacing: 0.5,
          fontWeight: 600,
        }}
      >
        {item.kind}
      </span>
    </button>
  );
}

function toErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Madoo AI could not answer right now.";
}
