"use client";

import { useEffect, useRef, useState } from "react";
import {
  Avatar,
  Button,
  Icon,
  IconButton,
  Input,
  type IconName,
} from "@madoo/ui";
import { useAuthStore } from "@/stores/auth";
import { useMe } from "@/hooks/use-me";
import { useLogout } from "@/hooks/use-logout";

export function TopBar() {
  const { data: user, isPending: loading } = useMe();
  const openLogin = useAuthStore((s) => s.openLogin);
  const { mutate: logout } = useLogout();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
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
                  width: 260,
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
