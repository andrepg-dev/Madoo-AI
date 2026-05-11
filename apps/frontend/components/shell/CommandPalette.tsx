"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, Kbd, type IconName } from "@madoo/ui";

type PaletteItem = {
  kind: "action" | "nav" | "doc";
  icon: IconName;
  title: string;
  sub: string;
  href?: string;
};

const PALETTE_ITEMS: PaletteItem[] = [
  { kind: "action", icon: "sparkle", title: "Generate new email", sub: "Start with an AI prompt", href: "/" },
  { kind: "action", icon: "send", title: "New campaign", sub: "Send to a segment", href: "/campaigns" },
  { kind: "nav", icon: "home", title: "Home", sub: "Dashboard", href: "/" },
  { kind: "nav", icon: "send", title: "Campaigns", sub: "All your sends", href: "/campaigns" },
  { kind: "nav", icon: "inbox", title: "Contacts", sub: "Audience & segments", href: "/contacts" },
  { kind: "nav", icon: "bolt", title: "Analytics", sub: "Open & click rates", href: "/analytics" },
  { kind: "nav", icon: "settings", title: "Domain", sub: "DNS & sender identity", href: "/domain" },
  { kind: "nav", icon: "sliders", title: "Settings", sub: "User & workspace settings", href: "/settings" },
];

const ASK_SUGGESTIONS = [
  "Why did open rates drop last week?",
  "Who hasn't opened my last 3 campaigns?",
  "Best time to send to Pro customers",
];

export function CommandPalette({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const isAsk =
    query.trim().length > 0 &&
    (query.trim().endsWith("?") ||
      /^(ask|how|what|write|why|when|who)\s/i.test(query));

  const items = useMemo(() => {
    if (!query) return PALETTE_ITEMS.slice(0, 7);
    return PALETTE_ITEMS.filter(
      (i) => (i.title + " " + i.sub).toLowerCase().includes(query.toLowerCase()),
    ).slice(0, 8);
  }, [query]);

  const navigate = (href: string) => {
    router.push(href);
    onClose();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, items.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter" && items[activeIdx]?.href) {
        navigate(items[activeIdx].href!);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, activeIdx]);

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
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIdx(0);
            }}
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
            <div style={{ padding: "14px 14px 10px" }}>
              <button
                type="button"
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: 14,
                  borderRadius: 10,
                  border: "none",
                  background: "var(--accent-soft)",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "var(--accent)",
                    color: "var(--accent-fg)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon name="sparkle" size={14} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--accent-deep)" }}>
                    Ask Madoo AI
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--ink)",
                      marginTop: 4,
                      lineHeight: 1.5,
                      fontStyle: "italic",
                    }}
                  >
                    &ldquo;{query}&rdquo;
                  </div>
                </div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "4px 8px",
                    background: "var(--surface)",
                    borderRadius: 6,
                    fontSize: 11,
                    color: "var(--ink-soft)",
                    fontWeight: 500,
                    alignSelf: "center",
                  }}
                >
                  ↵
                </div>
              </button>
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
                  onClick={() => setQuery(s)}
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
