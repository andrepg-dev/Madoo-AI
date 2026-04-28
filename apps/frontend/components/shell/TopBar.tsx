"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons/Icon";
import { useAuthStore } from "@/stores/auth";
import { useMe } from "@/hooks/use-me";
import { useLogout } from "@/hooks/use-logout";

function initials(name: string | null | undefined, email: string | undefined): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return (first + last).toUpperCase() || first.toUpperCase();
  }
  return (email?.[0] ?? "?").toUpperCase();
}

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

        {mounted && !user && !loading && (
          <button
            type="button"
            onClick={() => openLogin()}
            style={{
              height: 34,
              padding: "0 14px",
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              fontSize: 13,
              fontWeight: 500,
              color: "var(--ink)",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Sign in
          </button>
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
                width: 32,
                height: 32,
                borderRadius: "50%",
                border: "none",
                padding: 0,
                background: user.avatarUrl
                  ? "transparent"
                  : "linear-gradient(135deg, #D6B98A, #A87E54)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                overflow: "hidden",
              }}
            >
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt={user.name ?? user.email}
                  width={32}
                  height={32}
                  referrerPolicy="no-referrer"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                initials(user.name, user.email)
              )}
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
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: user.avatarUrl
                        ? "transparent"
                        : "linear-gradient(135deg, #D6B98A, #A87E54)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 600,
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    {user.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.avatarUrl}
                        alt={user.name ?? user.email}
                        width={36}
                        height={36}
                        referrerPolicy="no-referrer"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      initials(user.name, user.email)
                    )}
                  </div>
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

                <MenuItem
                  icon="settings"
                  label="User settings"
                  onClick={() => setOpen(false)}
                />
                <MenuItem
                  icon="barChart"
                  label="Usage"
                  onClick={() => setOpen(false)}
                />
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
  icon: React.ComponentProps<typeof Icon>["name"];
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
        color: danger ? "#A23E2F" : "var(--ink)",
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
