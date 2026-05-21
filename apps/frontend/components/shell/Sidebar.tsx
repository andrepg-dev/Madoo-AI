"use client";

import { billingApi, billingKeys } from "@/actions/billing";
import { workspacesApi, workspacesKeys } from "@/actions/workspaces.client";
import { readCookie, WORKSPACE_COOKIE, writeCookie } from "@/lib/cookies";
import { useSidebarStore } from "@/stores/sidebar";
import { PLAN_DISPLAY_NAMES, PLAN_LIMITS, PLAN_PRICES, type Plan } from "@madoo/shared";
import { Button, Card, Icon, ProgressBar, type IconName } from "@madoo/ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
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

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname?.startsWith(href));

  return (
    <aside
      className="madoo-sidebar"
      data-open={sidebarOpen ? "true" : "false"}
      style={{
        width: 220,
        borderRight: "1px solid var(--border)",
        padding: "20px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        background: "var(--surface)",
        flexShrink: 0,
        overflowY: "auto",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 8px 16px" }}>
        <Image src="/madoo-transparent.png" alt="Madoo logo" width={26} height={26} style={{ borderRadius: 7 }} />
        <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.2 }}>{brand}</div>
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

      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
        <PricingShortcut onClick={() => router.push("/settings/billing")} />
        <BillingCard
          plan={billingQuery.data?.subscription.plan ?? "FREE"}
          genUsed={billingQuery.data?.usage.aiGenerations.used ?? 0}
          genLimit={billingQuery.data?.usage.aiGenerations.limit ?? PLAN_LIMITS.FREE.aiGenerations}
          onClick={() => router.push("/settings/billing")}
        />
      </div>
    </aside>
  );
}

function PricingShortcut({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open usage and pricing"
      style={{
        width: "100%",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: 10,
        background: "var(--surface-2)",
        color: "var(--ink)",
        cursor: "pointer",
        fontFamily: "inherit",
        textAlign: "left",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700 }}>
          <Icon name="star" size={12} /> Usage & pricing
        </span>
        <Icon name="chevron" size={13} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 9 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 10, color: "var(--ink-faint)", fontWeight: 600 }}>Starter</div>
          <div style={{ fontSize: 13, color: "var(--ink)", fontWeight: 700 }}>${PLAN_PRICES.STARTER}/mo</div>
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 10, color: "var(--ink-faint)", fontWeight: 600 }}>Growth</div>
          <div style={{ fontSize: 13, color: "var(--ink)", fontWeight: 700 }}>${PLAN_PRICES.GROWTH}/mo</div>
        </div>
      </div>
      <div style={{ fontSize: 11, color: "var(--accent-deep)", fontWeight: 650, marginTop: 8 }}>
        Compare plans
      </div>
    </button>
  );
}

function BillingCard({
  plan,
  genUsed,
  genLimit,
  onClick,
}: {
  plan: Plan;
  genUsed: number;
  genLimit: number;
  onClick: () => void;
}) {
  const genUnlimited = genLimit === -1;
  const genPct = genUnlimited ? 0 : Math.min(100, Math.round((genUsed / genLimit) * 100));
  const showUpgrade = plan !== "GROWTH";

  return (
    <Card surface="secondary" padded>
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
        <Icon name="bolt" size={12} /> {PLAN_DISPLAY_NAMES[plan]} plan
      </div>
      <div style={{ fontSize: 11.5, color: "var(--ink-soft)", marginTop: 6, lineHeight: 1.4 }}>
        {genUsed.toLocaleString()} of {genUnlimited ? "∞" : genLimit.toLocaleString()} AI generations.
      </div>
      <ProgressBar
        value={genPct}
        variant="thin"
        aria-label="AI generations used"
        style={{ marginTop: 8 }}
      />
      {showUpgrade ? (
        <Button variant="primary" size="sm" block style={{ marginTop: 10 }} onClick={onClick}>
          {plan === "FREE" ? "Upgrade to Starter" : "Upgrade to Growth"}
        </Button>
      ) : (
        null
      )}
    </Card>
  );
}
