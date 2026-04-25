"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/icons/Icon";

const NAV_ITEMS: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/campaigns", label: "Campaigns", icon: "send" },
  { href: "/contacts", label: "Contacts", icon: "inbox" },
  { href: "/analytics", label: "Analytics", icon: "bolt" },
  { href: "/domain", label: "Domain", icon: "settings" },
];

export function Sidebar({ brand = "Madoo AI" }: { brand?: string }) {
  const pathname = usePathname();

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname?.startsWith(href));

  return (
    <aside
      style={{
        width: 220,
        borderRight: "1px solid var(--border)",
        padding: "20px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        background: "var(--surface)",
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 8px 16px" }}>
        <div
          className="serif"
          style={{
            width: 26,
            height: 26,
            borderRadius: 7,
            background: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--accent-fg)",
            fontSize: 13,
            fontWeight: 600,
            fontStyle: "italic",
          }}
        >
          M
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.2 }}>{brand}</div>
        <div
          style={{
            marginLeft: "auto",
            fontSize: 10,
            padding: "2px 6px",
            background: "var(--accent-soft)",
            color: "var(--accent-deep)",
            borderRadius: 4,
            fontWeight: 600,
          }}
        >
          BETA
        </div>
      </div>

      {NAV_ITEMS.map((it) => {
        const active = isActive(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 10px",
              borderRadius: 7,
              background: active ? "var(--surface-2)" : "transparent",
              color: active ? "var(--ink)" : "var(--ink-soft)",
              fontWeight: active ? 600 : 500,
              fontSize: 13.5,
              textDecoration: "none",
              transition: "background 0.12s",
            }}
          >
            <Icon name={it.icon} size={16} />
            {it.label}
          </Link>
        );
      })}

      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: 1,
          color: "var(--ink-faint)",
          padding: "20px 10px 6px",
        }}
      >
        WORKSPACE
      </div>
      {["Acme Brand", "Side project"].map((w, i) => (
        <button
          key={w}
          type="button"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 10px",
            borderRadius: 7,
            border: "none",
            background: "transparent",
            color: "var(--ink-soft)",
            fontSize: 13,
            cursor: "pointer",
            textAlign: "left",
            fontFamily: "inherit",
          }}
        >
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: 4,
              background: i === 0 ? "var(--accent)" : "#D8C4B0",
            }}
          />
          {w}
        </button>
      ))}

      <div
        style={{
          marginTop: "auto",
          padding: 12,
          background: "var(--surface-2)",
          borderRadius: 10,
          border: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 11,
            fontWeight: 600,
            color: "var(--accent-deep)",
          }}
        >
          <Icon name="bolt" size={12} /> Free plan
        </div>
        <div style={{ fontSize: 11.5, color: "var(--ink-soft)", marginTop: 6, lineHeight: 1.4 }}>
          7 of 10 generations left this month.
        </div>
        <div
          style={{
            height: 4,
            background: "var(--border)",
            borderRadius: 999,
            marginTop: 8,
            overflow: "hidden",
          }}
        >
          <div style={{ width: "70%", height: "100%", background: "var(--accent)" }} />
        </div>
        <button
          type="button"
          style={{
            width: "100%",
            marginTop: 10,
            padding: "7px 10px",
            background: "var(--ink)",
            color: "var(--bg)",
            border: "none",
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Upgrade to Pro
        </button>
      </div>
    </aside>
  );
}
