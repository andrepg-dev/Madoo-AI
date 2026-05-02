"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Avatar,
  Button,
  Icon,
  IconButton,
  Input,
  Modal,
  type IconName,
} from "@madoo/ui";
import { useAuthStore } from "@/stores/auth";
import { useMe } from "@/hooks/use-me";
import { useLogout } from "@/hooks/use-logout";
import { ApiError } from "@/lib/api/fetch-wrapper";
import { workspacesApi, workspacesKeys } from "@/actions/workspaces.client";
import { readCookie, writeCookie, WORKSPACE_COOKIE } from "@/lib/cookies";

export function TopBar() {
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

  useEffect(() => {
    setMounted(true);
    setActiveWorkspaceId(readCookie(WORKSPACE_COOKIE));
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

  const workspacesQuery = useQuery({
    queryKey: workspacesKeys.list(),
    queryFn: () => workspacesApi.list(),
    enabled: Boolean(user),
  });

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
      <div style={{ flex: 1, maxWidth: 360 }}>
        <Input
          variant="filled"
          inputSize="md"
          placeholder="Search templates, drafts, anything…"
          startAdornment={<Icon name="search" size={14} />}
          aria-label="Search"
        />
      </div>
      <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
        <IconButton variant="outline" size="md" aria-label="Notifications">
          <Icon name="bell" size={16} />
        </IconButton>

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
                border: "none",
                padding: 0,
                background: "transparent",
                cursor: "pointer",
                borderRadius: "50%",
                lineHeight: 0,
              }}
            >
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
                <MenuItem icon="settings" label="User settings" onClick={() => setOpen(false)} />
                <MenuItem icon="barChart" label="Usage" onClick={() => setOpen(false)} />
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
    </div>
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
