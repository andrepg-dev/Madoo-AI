"use client";

import { Icon } from "@/components/icons/Icon";

export function TopBar() {
  return (
    <div
      style={{
        height: 56,
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        padding: "0 28px",
        gap: 12,
        background: "var(--surface)",
        flexShrink: 0,
      }}
    >
      <div style={{ position: "relative", flex: 1, maxWidth: 360 }}>
        <div
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--ink-faint)",
          }}
        >
          <Icon name="search" size={14} />
        </div>
        <input
          placeholder="Search templates, drafts, anything…"
          style={{
            width: "100%",
            height: 34,
            padding: "0 12px 0 34px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--surface-2)",
            fontSize: 13,
            color: "var(--ink)",
            outline: "none",
            fontFamily: "inherit",
          }}
        />
      </div>
      <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
        <button
          type="button"
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "var(--ink-soft)",
          }}
        >
          <Icon name="bell" size={16} />
        </button>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #D6B98A, #A87E54)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          JD
        </div>
      </div>
    </div>
  );
}
