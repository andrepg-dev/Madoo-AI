"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Banner, Button, Card, Skeleton, useToast } from "@madoo/ui";
import { workspacesApi, workspacesKeys } from "@/actions/workspaces.client";
import { ApiError } from "@/lib/api/fetch-wrapper";
import { WORKSPACE_COOKIE, readCookie } from "@/lib/cookies";
import { useWorkspaceStore } from "@/stores/workspace";

export default function SettingsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const hydrateWorkspaceId = useWorkspaceStore((s) => s.hydrateWorkspaceId);
  const [postalDraft, setPostalDraft] = useState("");

  useEffect(() => {
    hydrateWorkspaceId();
  }, [hydrateWorkspaceId]);

  const workspacesQuery = useQuery({
    queryKey: workspacesKeys.list(),
    queryFn: () => workspacesApi.list(),
  });

  const activeId = useWorkspaceStore((s) => s.activeWorkspaceId) ?? readCookie(WORKSPACE_COOKIE);

  const current = (workspacesQuery.data ?? []).find((w) => w.id === activeId) ?? (workspacesQuery.data ?? [])[0];

  useEffect(() => {
    if (current?.postalAddress) setPostalDraft(current.postalAddress);
  }, [current?.id, current?.postalAddress]);

  const updateMutation = useMutation({
    mutationFn: () => workspacesApi.updateMe({ postalAddress: postalDraft.trim() }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: workspacesKeys.all });
      void qc.invalidateQueries({ queryKey: ["workspaces", "me"] });
      toast({ tone: "success", title: "Workspace saved", body: "Postal address updated." });
    },
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Could not save workspace settings.";
      toast({ tone: "danger", title: "Save failed", body: message });
    },
  });

  const errorMessage =
    updateMutation.error instanceof ApiError
      ? updateMutation.error.message
      : updateMutation.error instanceof Error
        ? updateMutation.error.message
        : null;

  return (
    <div style={{ flex: 1, overflowY: "auto", background: "var(--bg)" }}>
      <div style={{ padding: "32px 40px 60px", maxWidth: 720, margin: "0 auto" }}>
        <Link
          href="/campaigns"
          style={{ fontSize: 12, color: "var(--ink-soft)", textDecoration: "none", display: "inline-flex", gap: 6, alignItems: "center" }}
        >
          ← Back to campaigns
        </Link>
        <h1 className="serif" style={{ fontSize: 32, fontWeight: 400, margin: "12px 0 6px", letterSpacing: -0.4 }}>
          Workspace settings
        </h1>
        <p style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 24 }}>
          CAN-SPAM requires a physical mailing address on every commercial email the product sends.
        </p>

        <Card padded style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-faint)", letterSpacing: 0.4, textTransform: "uppercase" }}>
            Postal address
          </div>
          {workspacesQuery.isPending ? (
            <div style={{ display: "grid", gap: 8 }}>
              <Skeleton variant="text" width="45%" height={12} />
              <Skeleton width="100%" height={96} />
            </div>
          ) : (
            <label htmlFor="postal-address" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)" }}>
                Visible in every campaign footer
              </span>
              <textarea
                id="postal-address"
                value={postalDraft}
                onChange={(e) => setPostalDraft(e.target.value)}
                placeholder="Acme Inc, 123 Market St, San Francisco, CA 94103"
                rows={4}
                style={{
                  fontFamily: "var(--font-inter, sans-serif)",
                  fontSize: 14,
                  lineHeight: 1.45,
                  padding: "11px 12px",
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  color: "var(--ink)",
                  resize: "vertical",
                  width: "100%",
                  outline: "none",
                }}
              />
            </label>
          )}
          {!postalDraft.trim() ? (
            <Banner tone="warn">Campaign Test and Send now actions stay disabled until this field is saved.</Banner>
          ) : null}
          {errorMessage ? <Banner tone="danger">{errorMessage}</Banner> : null}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="primary"
              size="md"
              disabled={!postalDraft.trim() || updateMutation.isPending}
              onClick={() => updateMutation.mutate()}
            >
              {updateMutation.isPending ? "Saving…" : "Save workspace"}
            </Button>
          </div>
        </Card>

        <Card padded style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Billing & plan</div>
            <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 4 }}>
              Manage your subscription, see usage limits, upgrade or downgrade.
            </div>
          </div>
          <Link href="/settings/billing" style={{ textDecoration: "none" }}>
            <Button variant="ghost" size="sm">Open billing →</Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
