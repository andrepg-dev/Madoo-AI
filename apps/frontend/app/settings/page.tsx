"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Button, Card, Skeleton } from "@madoo/ui";
import { workspacesApi, workspacesKeys } from "@/actions/workspaces.client";
import { WORKSPACE_COOKIE, readCookie } from "@/lib/cookies";
import { useWorkspaceStore } from "@/stores/workspace";

export default function SettingsPage() {
  const hydrateWorkspaceId = useWorkspaceStore((s) => s.hydrateWorkspaceId);

  useEffect(() => {
    hydrateWorkspaceId();
  }, [hydrateWorkspaceId]);

  const workspacesQuery = useQuery({
    queryKey: workspacesKeys.list(),
    queryFn: () => workspacesApi.list(),
  });

  const activeId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? readCookie(WORKSPACE_COOKIE);
  const current = (workspacesQuery.data ?? []).find((w) => w.id === activeId) ?? (workspacesQuery.data ?? [])[0];

  return (
    <div style={{ flex: 1, overflowY: "auto", background: "var(--bg)" }}>
      <div style={{ padding: "32px 40px 60px", maxWidth: 720, margin: "0 auto" }}>
        <h1 className="display" style={{ fontSize: 32, fontWeight: 600, margin: "0 0 6px", letterSpacing: 0 }}>
          Workspace settings
        </h1>
        <p style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 24 }}>
          Manage workspace identity and billing.
        </p>

        <Card padded style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-faint)", letterSpacing: 0.4, textTransform: "uppercase" }}>
            Workspace
          </div>
          {workspacesQuery.isPending ? (
            <div style={{ display: "grid", gap: 8 }}>
              <Skeleton variant="text" width="45%" height={12} />
              <Skeleton variant="text" width="70%" height={12} />
            </div>
          ) : (
            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{current?.name ?? "Workspace"}</div>
              <div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>{current?.slug ?? "workspace"}</div>
            </div>
          )}
        </Card>

        <Card padded style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Billing & plan</div>
            <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 4 }}>
              Manage your subscription, usage limits, and invoices.
            </div>
          </div>
          <Link href="/settings/billing" style={{ textDecoration: "none" }}>
            <Button variant="ghost" size="sm">Open billing</Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
