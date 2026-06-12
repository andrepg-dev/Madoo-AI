"use client";

import { billingApi, billingKeys } from "@/actions/billing";
import { workspacesApi, workspacesKeys } from "@/actions/workspaces.client";
import { readCookie, WORKSPACE_COOKIE, writeCookie } from "@/lib/cookies";
import { useSidebarStore } from "@/stores/sidebar";
import { Icon, type IconName } from "@madoo/design-system";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const NAV_ITEMS: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Projects", icon: "grid" },
  { href: "/settings", label: "Settings", icon: "sliders" },
  { href: "/settings/billing", label: "Usage & Billing", icon: "barChart" },
];

export function Sidebar({ brand = "Madoo AI" }: { brand?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(
    null,
  );
  const sidebarOpen = useSidebarStore((s) => s.open);
  const setSidebarOpen = useSidebarStore((s) => s.setOpen);

  const workspacesQuery = useQuery({
    queryKey: workspacesKeys.list(),
    queryFn: () => workspacesApi.list(),
  });

  const billingQuery = useQuery({
    queryKey: billingKeys.overview(),
    queryFn: () => billingApi.overview(),
    staleTime: 60_000,
  });

  useEffect(() => {
    setActiveWorkspaceId(readCookie(WORKSPACE_COOKIE));
  }, []);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/settings") return pathname === "/settings";
    return pathname?.startsWith(href);
  };

  return (
    <aside
      className="madoo-sidebar"
      data-open={sidebarOpen ? "true" : "false"}
      style={{
        width: 70,
        boxShadow: "0.5px 0 0 rgb(16 17 20 / 0.12)",
        padding: "24px 10px 14px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        background: "var(--surface)",
        flexShrink: 0,
        overflowY: "auto",
      }}
    >
      <div style={{ paddingBottom: 18 }} title={brand}>
        <Image
          src="/madoo-transparent.png"
          alt="Madoo logo"
          width={30}
          height={30}
          style={{ borderRadius: 8, display: "block" }}
        />
      </div>

      {NAV_ITEMS.map((it) => {
        const active = isActive(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-label={it.label}
            title={it.label}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 46,
              height: 46,
              borderRadius: 12,
              background: active ? "#efeeeb" : "transparent",
              color: active ? "var(--ink)" : "var(--ink-soft)",
              textDecoration: "none",
              transition: "background 0.12s",
            }}
          >
            <Icon name={it.icon} size={20} />
          </Link>
        );
      })}

      <div
        style={{
          width: 32,
          height: 1,
          background: "var(--border-soft)",
          margin: "14px 0 6px",
        }}
      />
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
            aria-label={`Switch to ${workspace.name}`}
            title={workspace.name}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 38,
              height: 38,
              borderRadius: 12,
              border: "none",
              background: active
                ? "#5d8cff"
                : i % 2 === 0
                  ? "#f2f4f7"
                  : "#eef4ff",
              color: active ? "#ffffff" : "var(--ink-soft)",
              fontSize: 16,
              cursor: "pointer",
              fontFamily: "inherit",
              fontWeight: 700,
              boxShadow: active
                ? "0 0 0 3px #ffffff, 0 0 0 4px rgb(93 140 255 / 0.35)"
                : "var(--shadow-border)",
            }}
          >
            {workspace.name[0]?.toUpperCase() ?? "W"}
          </button>
        );
      })}

      <div
        style={{
          marginTop: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <button
          type="button"
          aria-label="Usage and billing"
          title={`Usage: ${billingQuery.data?.usage.aiGenerations.used ?? 0} AI generations`}
          onClick={() => router.push("/settings/billing")}
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            border: "none",
            background: "transparent",
            color: "var(--ink-soft)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <Icon name="bolt" size={20} />
        </button>
      </div>
    </aside>
  );
}
