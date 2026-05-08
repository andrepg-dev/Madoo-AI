"use client";

import { billingApi, billingKeys } from "@/actions/billing";
import { workspacesApi, workspacesKeys } from "@/actions/workspaces.client";
import { useLogout } from "@/hooks/use-logout";
import { useMe } from "@/hooks/use-me";
import { ApiError } from "@/lib/api/fetch-wrapper";
import { readCookie, WORKSPACE_COOKIE, writeCookie } from "@/lib/cookies";
import { useAuthStore } from "@/stores/auth";
import { PLAN_LIMITS } from "@madoo/shared";
import {
  Avatar,
  Button,
  Icon,
  Input,
  Kbd,
  Modal,
  type IconName,
} from "@madoo/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CommandPalette } from "./CommandPalette";
import { SetupGuide } from "./SetupGuide";

export function TopBar() {
  const router = useRouter();
  const { data: user, isPending: loading } = useMe();
  const openLogin = useAuthStore((s) => s.openLogin);
  const { mutate: logout } = useLogout();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const [isCreateWorkspaceOpen, setIsCreateWorkspaceOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const workspacesQuery = useQuery({
    queryKey: workspacesKeys.list(),
    queryFn: () => workspacesApi.list(),
    enabled: Boolean(user),
  });

  const billingQuery = useQuery({
    queryKey: billingKeys.overview(),
    queryFn: () => billingApi.overview(),
    staleTime: 60_000,
    enabled: Boolean(user),
  });

  const activeWorkspace = (workspacesQuery.data ?? []).find(
    (w) => w.id === activeWorkspaceId,
  );

  useEffect(() => {
    setMounted(true);
    setActiveWorkspaceId(readCookie(WORKSPACE_COOKIE));
  }, []);

  // ⌘K shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const createWorkspaceMutation = useMutation({
    mutationFn: () => workspacesApi.create({ name: newWorkspaceName.trim() }),
    onSuccess: (workspace) => {
      writeCookie(WORKSPACE_COOKIE, workspace.id);
      setActiveWorkspaceId(workspace.id);
      void queryClient.invalidateQueries();
      setIsCreateWorkspaceOpen(false);
      setNewWorkspaceName("");
    },
  });

  const switchWorkspace = (workspaceId: string) => {
    if (workspaceId === activeWorkspaceId) {
      setOpen(false);
      return;
    }
    writeCookie(WORKSPACE_COOKIE, workspaceId);
    setActiveWorkspaceId(workspaceId);
    setOpen(false);
    void queryClient.invalidateQueries();
  };

  // AI generation credits data
  const genUsed = billingQuery.data?.usage.aiGenerations.used ?? 0;
  const genLimit = billingQuery.data?.usage.aiGenerations.limit ?? PLAN_LIMITS.FREE.aiGenerations;
  const genUnlimited = genLimit === -1;

  const formatCount = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
    return n.toString();
  };

  return (
    <>
      <div
        style={{
          height: 52,
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          gap: 10,
          background: "var(--bg)",
          flexShrink: 0,
          borderBottom: "1px solid var(--border-soft)",
          minWidth: 0,
          position: "relative",
          zIndex: 100,
        }}
      >
        {/* ── Workspace breadcrumb ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: 4,
              background: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--accent-fg)",
              fontSize: 9,
              fontWeight: 700,
            }}
          >
            {(activeWorkspace?.name ?? "W")[0].toUpperCase()}
          </div>
          <span style={{ color: "var(--ink)", fontWeight: 500 }}>
            {activeWorkspace?.name ?? "Workspace"}
          </span>
        </div>

        {/* ── Live status pill ── */}
        <div
          className="topbar-pill"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 10px",
            background: "var(--accent-soft)",
            borderRadius: 999,
            fontSize: 11.5,
            color: "var(--accent-deep)",
            fontWeight: 500,
            flexShrink: 0,
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ position: "relative", width: 6, height: 6 }}>
            <span
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                background: "var(--accent)",
                animation: "pulse 1.6s ease-in-out infinite",
              }}
            />
          </span>
          Active
        </div>

        {/* ── Center: ⌘K search trigger ── */}
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 8,
            height: 30,
            padding: "0 12px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            fontSize: 12.5,
            color: "var(--ink-faint)",
            cursor: "pointer",
            fontFamily: "inherit",
            flexShrink: 1,
            minWidth: 0,
            maxWidth: 280,
          }}
        >
          <Icon name="search" size={13} />
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            Find or ask AI…
          </span>
          <Kbd style={{ marginLeft: "auto", flexShrink: 0 }}>⌘K</Kbd>
        </button>

        {/* ── AI credits meter ── */}
        {mounted && user && (
          <div
            className="topbar-credits"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "0 12px",
              height: 30,
              borderRadius: 8,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            <Icon name="sparkle" size={12} stroke={1.8} />
            <div
              style={{
                fontSize: 12,
                color: "var(--ink)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              <b>{formatCount(genUsed)}</b>{" "}
              <span style={{ color: "var(--ink-faint)" }}>
                / {genUnlimited ? "∞" : formatCount(genLimit)}
              </span>
            </div>
          </div>
        )}

        {/* ── Setup guide ── */}
        <SetupGuide />

        {/* ── Auth / Avatar ── */}
        {mounted && !user && !loading && (
          <Button variant="secondary" size="md" onClick={() => openLogin()}>
            Sign in
          </Button>
        )}

        {mounted && user && (
          <div ref={wrapRef} style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={open}
              title={user.email}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "3px 4px 3px 10px",
                borderRadius: 999,
                border: "1px solid var(--border)",
                background: "var(--surface)",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <span style={{ fontSize: 12, color: "var(--ink)", fontWeight: 500 }}>
                {user.name?.split(" ")[0] ?? "Account"}
              </span>
              <Avatar
                size="sm"
                circle
                tone="accent"
                src={user.avatarUrl ?? undefined}
                name={user.name ?? user.email}
                alt={user.name ?? user.email}
              />
            </button>

            {open && (
              <div
                role="menu"
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  width: 280,
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  boxShadow: "0 20px 50px -20px rgba(20,15,10,0.35)",
                  padding: 8,
                  zIndex: 150,
                }}
              >
                <div
                  style={{
                    padding: "10px 12px",
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                    borderBottom: "1px solid var(--border)",
                    marginBottom: 6,
                  }}
                >
                  <Avatar
                    size="md"
                    circle
                    tone="accent"
                    src={user.avatarUrl ?? undefined}
                    name={user.name ?? user.email}
                    alt={user.name ?? user.email}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--ink)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {user.name ?? "Account"}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--ink-soft)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {user.email}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--ink-faint)",
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                    padding: "8px 12px 4px",
                  }}
                >
                  Workspaces
                </div>
                <div style={{ maxHeight: 160, overflowY: "auto" }}>
                  {(workspacesQuery.data ?? []).map((workspace) => {
                    const active = workspace.id === activeWorkspaceId;
                    return (
                      <button
                        key={workspace.id}
                        type="button"
                        role="menuitem"
                        onClick={() => switchWorkspace(workspace.id)}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "8px 12px",
                          background: active ? "var(--surface-2)" : "transparent",
                          border: "none",
                          borderRadius: 8,
                          cursor: "pointer",
                          fontSize: 13,
                          color: "var(--ink)",
                          textAlign: "left",
                          fontFamily: "inherit",
                        }}
                      >
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 2,
                            background: active ? "var(--accent)" : "var(--border)",
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
                        {active && <Icon name="check" size={12} />}
                      </button>
                    );
                  })}
                </div>
                <MenuItem
                  icon="plus"
                  label="Add workspace"
                  onClick={() => {
                    setOpen(false);
                    setIsCreateWorkspaceOpen(true);
                  }}
                />

                <div style={{ height: 1, background: "var(--border)", margin: "6px 0" }} />
                <MenuItem
                  icon="settings"
                  label="User settings"
                  onClick={() => {
                    setOpen(false);
                    router.push("/settings");
                  }}
                />
                <MenuItem icon="barChart" label="Usage & Billing" onClick={() => {
                  setOpen(false);
                  router.push("/settings/billing");
                }} />
                <div style={{ height: 1, background: "var(--border)", margin: "6px 0" }} />
                <MenuItem
                  icon="logOut"
                  label="Sign out"
                  danger
                  onClick={() => {
                    setOpen(false);
                    logout();
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Command Palette ── */}
      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}

      {/* ── Create workspace modal ── */}
      <Modal
        open={isCreateWorkspaceOpen}
        onClose={() => {
          setIsCreateWorkspaceOpen(false);
          setNewWorkspaceName("");
          createWorkspaceMutation.reset();
        }}
        size="sm"
        title="Create workspace"
        description="Workspaces isolate contacts, campaigns, and analytics."
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
            Workspace name *
            <Input
              value={newWorkspaceName}
              onChange={(event) => setNewWorkspaceName(event.target.value)}
              placeholder="Acme team"
              variant="filled"
              inputSize="sm"
              autoFocus
            />
          </label>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setIsCreateWorkspaceOpen(false);
                setNewWorkspaceName("");
                createWorkspaceMutation.reset();
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => createWorkspaceMutation.mutate()}
              disabled={!newWorkspaceName.trim() || createWorkspaceMutation.isPending}
            >
              {createWorkspaceMutation.isPending ? "Creating..." : "Create workspace"}
            </Button>
          </div>
          {createWorkspaceMutation.error && (
            <div style={{ color: "#b04c2e", fontSize: 12 }}>
              {toErrorMessage(createWorkspaceMutation.error)}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: IconName;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 12px",
        background: "transparent",
        border: "none",
        borderRadius: 8,
        cursor: "pointer",
        fontSize: 13,
        color: danger ? "var(--danger)" : "var(--ink)",
        textAlign: "left",
        fontFamily: "inherit",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--surface-2)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      <Icon name={icon} size={15} />
      <span>{label}</span>
    </button>
  );
}

function toErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Unexpected error.";
}
