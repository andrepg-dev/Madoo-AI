"use client";

import {
  Add01Icon,
  ArrowDown01Icon,
  BoltIcon,
  GiftIcon,
  Home01Icon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  Plug01Icon,
  Search01Icon,
  Settings01Icon,
  Tick02Icon,
  UserAdd01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  IconButton,
  Kbd,
  ProgressBar,
  SelectableCard,
} from "@madoo/design-system";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, type CSSProperties } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: IconSvgElement;
  shortcut?: string;
};

const primaryItems: NavItem[] = [
  { href: "/", label: "Home", icon: Home01Icon },
  { href: "/search", label: "Search", icon: Search01Icon, shortcut: "K" },
  { href: "/providers", label: "Providers", icon: Plug01Icon },
];

const workspace = {
  name: "Andre's Madoo",
  creditsLeft: 5,
  creditsTotal: 20,
};

function AppIcon({ icon, size = 20 }: { icon: IconSvgElement; size?: number }) {
  return (
    <HugeiconsIcon
      aria-hidden="true"
      focusable="false"
      icon={icon}
      primaryColor="currentColor"
      size={size}
      strokeWidth={1.7}
    />
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);

  const creditsPct = Math.min(
    100,
    Math.round((workspace.creditsLeft / workspace.creditsTotal) * 100),
  );

  const width = collapsed ? 64 : 244;

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href);
  };

  return (
    <aside
      style={{
        ...styles.sidebar,
        width,
        paddingInline: collapsed ? 10 : 12,
      }}
    >
      <div style={styles.logoRow}>
        <IconButton
          aria-label="Madoo home"
          size="sm"
          variant="ghost"
          onClick={() => router.push("/")}
        >
          <Image
            alt="Madoo"
            height={26}
            src="/madoo-transparent.png"
            width={26}
            style={{ borderRadius: 7 }}
            priority
          />
        </IconButton>
        <IconButton
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-pressed={collapsed}
          size="sm"
          variant="ghost"
          onClick={() => {
            setCollapsed((value) => !value);
            setWorkspaceOpen(false);
          }}
        >
          <AppIcon icon={collapsed ? PanelLeftOpenIcon : PanelLeftCloseIcon} size={18} />
        </IconButton>
      </div>

      <div style={{ position: "relative" }}>
        {collapsed ? (
          <IconButton
            aria-label="Open workspace switcher"
            aria-expanded={workspaceOpen}
            size="md"
            variant="outline"
            onClick={() => setWorkspaceOpen((value) => !value)}
          >
            <Avatar name={workspace.name} size="xs" />
          </IconButton>
        ) : (
          <Button
            aria-expanded={workspaceOpen}
            aria-haspopup="menu"
            block
            leftIcon={<Avatar name={workspace.name} size="xs" />}
            rightIcon={<AppIcon icon={ArrowDown01Icon} size={16} />}
            size="sm"
            variant="ghost"
            onClick={() => setWorkspaceOpen((value) => !value)}
            style={styles.workspaceButton}
          >
            <span style={styles.workspaceName}>{workspace.name}</span>
          </Button>
        )}

        {workspaceOpen && !collapsed ? (
          <Card role="menu" style={styles.workspaceMenu}>
            <div style={styles.menuIdentity}>
              <Avatar name={workspace.name} size="md" />
              <div style={{ minWidth: 0 }}>
                <strong style={styles.compactStrong}>{workspace.name}</strong>
              </div>
            </div>

            <div style={styles.menuActions}>
              <Button size="sm" variant="ghost" leftIcon={<AppIcon icon={Settings01Icon} size={16} />}>
                Settings
              </Button>
              <Button size="sm" variant="ghost" leftIcon={<AppIcon icon={UserAdd01Icon} size={16} />}>
                Invite
              </Button>
            </div>

            <Card surface="secondary" style={styles.menuUpgrade}>
              <div style={styles.cardTitleRow}>
                <AppIcon icon={BoltIcon} size={18} />
                <strong style={styles.compactStrong}>Turn Pro</strong>
              </div>
              <Button size="sm" variant="primary">
                Upgrade
              </Button>
            </Card>

            <Card surface="secondary" style={styles.menuCredits}>
              <div style={styles.spaceBetween}>
                <strong style={styles.compactStrong}>Credits</strong>
                <span style={styles.muted}>{workspace.creditsLeft} left</span>
              </div>
              <ProgressBar value={creditsPct} tone="ink" label="Credits left" />
              <span style={styles.muted}>Daily credits reset at midnight UTC</span>
            </Card>

            <div style={styles.workspaceList}>
              <span style={styles.muted}>All workspaces</span>
              <Button
                block
                size="sm"
                variant="ghost"
                leftIcon={<Avatar name={workspace.name} size="xs" />}
                rightIcon={<AppIcon icon={Tick02Icon} size={16} />}
                style={styles.workspaceListButton}
              >
                <span style={styles.truncate}>{workspace.name}</span>
                <Badge tone="neutral">FREE</Badge>
              </Button>
            </div>

            <Button
              block
              size="sm"
              variant="ghost"
              leftIcon={<AppIcon icon={Add01Icon} size={17} />}
              style={styles.createWorkspaceButton}
            >
              Create workspace
            </Button>
          </Card>
        ) : null}
      </div>

      <nav aria-label="Primary navigation" style={styles.nav}>
        {primaryItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Button
              aria-current={active ? "page" : undefined}
              block
              key={item.href}
              leftIcon={<AppIcon icon={item.icon} size={18} />}
              size="sm"
              title={collapsed ? item.label : undefined}
              variant="ghost"
              onClick={() => router.push(item.href)}
              style={{
                ...styles.navButton,
                background: active ? "var(--surface-2)" : "transparent",
                color: active ? "var(--ink)" : "var(--ink-soft)",
                fontWeight: active ? 600 : 500,
                justifyContent: collapsed ? "center" : "flex-start",
                paddingInline: collapsed ? 0 : 10,
              }}
            >
              {!collapsed ? (
                <>
                  <span style={styles.navLabel}>{item.label}</span>
                  {item.shortcut ? (
                    <span style={styles.shortcut}>
                      <Kbd>⌘</Kbd>
                      <Kbd>{item.shortcut}</Kbd>
                    </span>
                  ) : null}
                </>
              ) : null}
            </Button>
          );
        })}
      </nav>

      <div style={{ flex: 1 }} />

      {!collapsed ? (
        <>
          <SelectableCard style={styles.bottomCard}>
            <span style={styles.bottomCopy}>
              <strong>Share Madoo</strong>
              <small style={styles.muted}>100 credits per paid referral</small>
            </span>
            <span style={styles.roundIcon}>
              <AppIcon icon={GiftIcon} size={19} />
            </span>
          </SelectableCard>

          <SelectableCard style={styles.bottomCard}>
            <span style={styles.bottomCopy}>
              <strong>Upgrade to Pro</strong>
              <small style={styles.muted}>Unlock more capacity</small>
            </span>
            <span style={{ ...styles.roundIcon, background: "var(--accent-soft)" }}>
              <AppIcon icon={BoltIcon} size={20} />
            </span>
          </SelectableCard>
        </>
      ) : null}

      <Button
        aria-label="Open user profile"
        block
        leftIcon={<Avatar name="Andre Ponce" size="xs" circle />}
        rightIcon={!collapsed ? <AppIcon icon={UserIcon} size={18} /> : undefined}
        size="sm"
        variant="ghost"
        style={{
          ...styles.userButton,
          justifyContent: collapsed ? "center" : "flex-start",
          paddingInline: collapsed ? 0 : 8,
        }}
      >
        {!collapsed ? (
          <span style={styles.bottomCopy}>
            <strong style={styles.truncate}>Andre Ponce</strong>
            <small style={styles.muted}>andre@madoo.ai</small>
          </span>
        ) : null}
      </Button>
    </aside>
  );
}

const styles = {
  sidebar: {
    display: "flex",
    height: "100dvh",
    flexDirection: "column",
    gap: 10,
    paddingBlock: 12,
    background: "var(--surface)",
    boxShadow: "inset -1px 0 0 var(--border-soft)",
    transition: "width var(--duration-base) var(--ease-out)",
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 30,
    paddingInline: 2,
  },
  workspaceButton: {
    minHeight: 34,
    justifyContent: "flex-start",
    paddingInline: 8,
  },
  workspaceName: {
    minWidth: 0,
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontSize: "var(--font-size-base)",
    fontWeight: 500,
    textAlign: "left",
  },
  workspaceMenu: {
    position: "absolute",
    left: 0,
    top: "calc(100% + 8px)",
    zIndex: 40,
    display: "grid",
    width: 320,
    gap: 8,
    padding: 8,
  },
  menuIdentity: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: 4,
  },
  muted: {
    color: "var(--ink-muted)",
    fontSize: "var(--font-size-sm)",
  },
  compactStrong: {
    fontSize: "var(--font-size-base)",
    fontWeight: 600,
  },
  menuActions: {
    display: "flex",
    gap: 6,
  },
  menuUpgrade: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    padding: 10,
  },
  menuCredits: {
    display: "grid",
    gap: 8,
    padding: 10,
  },
  cardTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  spaceBetween: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  workspaceList: {
    display: "grid",
    gap: 6,
    padding: 4,
  },
  workspaceListButton: {
    justifyContent: "flex-start",
    gap: 8,
    paddingInline: 0,
  },
  createWorkspaceButton: {
    justifyContent: "flex-start",
    fontSize: "var(--font-size-base)",
  },
  nav: {
    display: "grid",
    gap: 4,
    paddingTop: 2,
  },
  navButton: {
    minHeight: 34,
    gap: 10,
    fontSize: "var(--font-size-base)",
  },
  navLabel: {
    minWidth: 0,
    flex: 1,
    overflow: "hidden",
    textAlign: "left",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  shortcut: {
    display: "inline-flex",
    gap: 4,
    marginLeft: "auto",
  },
  truncate: {
    minWidth: 0,
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  bottomCard: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    minHeight: 68,
    padding: 10,
  },
  bottomCopy: {
    display: "grid",
    minWidth: 0,
    gap: 2,
    flex: 1,
  },
  roundIcon: {
    display: "grid",
    width: 34,
    height: 34,
    flex: "0 0 auto",
    placeItems: "center",
    borderRadius: "var(--radius-pill)",
    background: "var(--surface)",
    boxShadow: "var(--shadow-border-rule)",
  },
  userButton: {
    minHeight: 34,
    gap: 8,
  },
} satisfies Record<string, CSSProperties>;
