"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, Card, Icon, ProgressBar, type IconName } from "@madoo/ui";
import { workspacesApi, workspacesKeys } from "@/actions/workspaces.client";
import { readCookie, writeCookie, WORKSPACE_COOKIE } from "@/lib/cookies";

const NAV_ITEMS: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/campaigns", label: "Campaigns", icon: "send" },
  { href: "/contacts", label: "Contacts", icon: "inbox" },
  { href: "/analytics", label: "Analytics", icon: "bolt" },
  { href: "/settings", label: "Settings", icon: "sliders" },
  { href: "/domain", label: "Domain", icon: "settings" },
];

export function Sidebar({ brand = "Madoo AI" }: { brand?: string }) {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);

  const workspacesQuery = useQuery({
    queryKey: workspacesKeys.list(),
    queryFn: () => workspacesApi.list(),
  });

  useEffect(() => {
    setActiveWorkspaceId(readCookie(WORKSPACE_COOKIE));
  }, []);

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
        <Badge tone="accent" style={{ marginLeft: "auto" }}>
          BETA
        </Badge>
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
      {(workspacesQuery.data ?? []).map((workspace, i) => {
        const active = workspace.id === activeWorkspaceId;
        return (
          <button
            key={workspace.id}
            type="button"
            onClick={() => {
              writeCookie(WORKSPACE_COOKIE, workspace.id);
              setActiveWorkspaceId(workspace.id);
              void queryClient.invalidateQueries();
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 10px",
              borderRadius: 7,
              border: "none",
              background: active ? "var(--surface-2)" : "transparent",
              color: active ? "var(--ink)" : "var(--ink-soft)",
              fontSize: 13,
              cursor: "pointer",
              textAlign: "left",
              fontFamily: "inherit",
              fontWeight: active ? 600 : 500,
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: 4,
                background: active ? "var(--accent)" : i % 2 === 0 ? "#D8C4B0" : "#CBB29A",
              }}
            />
            <span
              style={{
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {workspace.name}
            </span>
          </button>
        );
      })}

      <Card surface="secondary" padded style={{ marginTop: "auto" }}>
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
        <ProgressBar
          value={70}
          variant="thin"
          aria-label="Generations used this month"
          style={{ marginTop: 8 }}
        />
        <Button variant="primary" size="sm" block style={{ marginTop: 10 }}>
          Upgrade to Pro
        </Button>
      </Card>
    </aside>
  );
}
