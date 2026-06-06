"use client";

import {
  Add01Icon,
  ArrowDown01Icon,
  GiftIcon,
  InboxIcon,
  PanelLeftIcon,
  PanelRightIcon,
  Plug01Icon,
  Search01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownTrigger,
  IconButton,
  Kbd,
  ProgressBar,
  cx,
} from "@madoo/design-system";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: IconSvgElement | "home";
  shortcut?: string;
};

const primaryItems: NavItem[] = [
  { href: "/", label: "Home", icon: "home" },
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
      strokeWidth={1.35}
    />
  );
}

function HomeSmileIcon({ size = 15 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
    >
      <path
        d="M22 10.5L12.8825 2.82207C12.6355 2.61407 12.3229 2.5 12 2.5C11.6771 2.5 11.3645 2.61407 11.1175 2.82207L2 10.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20.5 5V15.5C20.5 18.3284 20.5 19.7426 19.6213 20.6213C18.7426 21.5 17.3284 21.5 14.5 21.5H9.5C6.67157 21.5 5.25736 21.5 4.37868 20.6213C3.5 19.7426 3.5 18.3284 3.5 15.5V9.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.0002 17C14.2007 17.6224 13.1504 18 12.0002 18C10.8499 18 9.79971 17.6224 9.00018 17"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NavIcon({
  icon,
  size = 15,
}: {
  icon: NavItem["icon"];
  size?: number;
}) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
    >
      {icon === "home" ? (
        <HomeSmileIcon size={size} />
      ) : (
        <AppIcon icon={icon} size={size} />
      )}
    </span>
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

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href);
  };

  return (
    <aside
      className={cx(
        "group/sidebar flex h-[100dvh] flex-col gap-2.5 bg-madoo-surface py-3 shadow-[inset_-1px_0_0_var(--border-soft)] transition-[width] duration-[var(--duration-base)] ease-[var(--ease-out)]",
        collapsed
          ? "w-[60px] px-3"
          : "w-[260px] px-3",
      )}
    >
      <div
        className={cx(
          "relative flex min-h-[30px] items-center",
          "w-full justify-between px-0.5",
        )}
      >
        <IconButton
          aria-label="Madoo home"
          size="sm"
          variant="ghost"
          onClick={() => router.push("/")}
          className={cx(
            "transition-opacity duration-[var(--duration-fast)]",
            collapsed &&
            "group-hover/sidebar:pointer-events-none group-hover/sidebar:opacity-0",
          )}
        >
          <Image
            alt="Madoo"
            height={26}
            src="/madoo-transparent.png"
            width={26}
            className="rounded-[7px] object-contain"
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
          className={cx(
            collapsed &&
            "pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 opacity-0 shadow-[var(--shadow-border)] transition-[opacity,transform] duration-[var(--duration-fast)] group-hover/sidebar:pointer-events-auto group-hover/sidebar:opacity-100 group-hover/sidebar:translate-y-0 focus-visible:pointer-events-auto focus-visible:opacity-100",
          )}
        >
          <AppIcon
            icon={collapsed ? PanelRightIcon : PanelLeftIcon}
            size={15}
          />
        </IconButton>
      </div>

      <Dropdown
        open={workspaceOpen}
        onOpenChange={setWorkspaceOpen}
        className="w-full"
      >
        <DropdownTrigger asChild>
          <Button
            aria-label="Open workspace switcher"
            block
            leftIcon={
              <Avatar
                name={workspace.name}
                size="sm"
                className="bg-madoo-rule rounded-[7.5px]"
              />
            }
            rightIcon={
              <span
                className={cx(
                  "ml-auto inline-flex overflow-hidden transition-[opacity,max-width] duration-[var(--duration-base)] ease-[var(--ease-out)]",
                  collapsed
                    ? "max-w-0 opacity-0"
                    : "max-w-4 opacity-100",
                )}
              >
                <AppIcon icon={ArrowDown01Icon} size={13} />
              </span>
            }
            size="sm"
            variant={collapsed ? "secondary" : "ghost"}
            className={cx(
              "h-8! min-h-8! overflow-hidden py-0! font-normal! transition-[width,padding,background,color,box-shadow] duration-[var(--duration-base)] ease-[var(--ease-out)]",
              "justify-start! gap-2! px-1! pr-3!",
            )}
          >
            <span
              className={cx(
                "min-w-0 flex-1 overflow-hidden text-left text-(length:--font-size-base) font-normal text-ellipsis whitespace-nowrap transition-[opacity,max-width] duration-[var(--duration-base)] ease-[var(--ease-out)]",
                collapsed ? "max-w-0 opacity-0" : "max-w-44 opacity-100",
              )}
            >
              {workspace.name}
            </span>
          </Button>
        </DropdownTrigger>

        <DropdownContent className="!grid w-80 gap-2 !p-2">
          <div className="flex items-center gap-2.5 p-1">
            <Avatar name={workspace.name} size="sm" />
            <div className="min-w-0">
              <span className="text-[length:var(--font-size-base)] font-normal">
                {workspace.name}
              </span>
            </div>
          </div>

          <Card surface="secondary" className="grid gap-2 !p-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[length:var(--font-size-base)] font-normal">
                Credits
              </span>
              <span className="text-[length:var(--font-size-sm)] text-madoo-ink-muted">
                {workspace.creditsLeft} left
              </span>
            </div>
            <ProgressBar value={creditsPct} tone="ink" label="Credits left" />
            <span className="text-[length:var(--font-size-sm)] text-madoo-ink-muted">
              Daily credits reset at midnight UTC
            </span>
          </Card>

          <div className="grid gap-1.5 p-1">
            <span className="text-[length:var(--font-size-sm)] text-madoo-ink-muted">
              All workspaces
            </span>
            <DropdownItem className="!px-0">
              <Avatar name={workspace.name} size="xs" />
              <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                {workspace.name}
              </span>
              <Badge tone="neutral">FREE</Badge>
              <AppIcon icon={Tick02Icon} size={13} />
            </DropdownItem>
          </div>

          <DropdownItem className="!justify-start !text-[length:var(--font-size-base)] !font-normal">
            <AppIcon icon={Add01Icon} size={14} />
            Create workspace
          </DropdownItem>
        </DropdownContent>
      </Dropdown>

      <nav
        aria-label="Primary navigation"
        className="grid w-full gap-1 pt-0.5"
      >
        {primaryItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Button
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              block
              key={item.href}
              leftIcon={<NavIcon icon={item.icon} size={15} />}
              size="sm"
              variant="ghost"
              onClick={() => router.push(item.href)}
              className={cx(
                "h-[32px]! min-h-[32px]! overflow-hidden py-0! text-[length:var(--font-size-base)]! transition-[width,padding,background,color] duration-[var(--duration-base)] ease-[var(--ease-out)]",
                active
                  ? "bg-madoo-accent! font-normal! text-madoo-accent-fg! hover:bg-madoo-accent-deep! hover:text-madoo-accent-fg!"
                  : "bg-transparent! font-normal! text-madoo-ink-soft! hover:bg-[rgb(var(--rule-rgb)_/_0.12)]! hover:text-madoo-accent!",
                "justify-start! gap-2.5! px-2.5!",
              )}
            >
              <span
                className={cx(
                  "min-w-0 flex-1 overflow-hidden text-left text-ellipsis whitespace-nowrap transition-[opacity,max-width] duration-[var(--duration-base)] ease-[var(--ease-out)]",
                  collapsed ? "max-w-0 opacity-0" : "max-w-36 opacity-100",
                )}
              >
                {item.label}
              </span>
              {item.shortcut ? (
                <span
                  className={cx(
                    "ml-auto inline-flex gap-0.5 overflow-hidden transition-[opacity,max-width] duration-[var(--duration-base)] ease-[var(--ease-out)]",
                    collapsed ? "max-w-0 opacity-0" : "max-w-12 opacity-100",
                  )}
                >
                  <Kbd className="!h-[18px] !w-[18px] !text-[9.5px]">⌘</Kbd>
                  <Kbd className="!h-[18px] !w-[18px] !text-[9.5px]">
                    {item.shortcut}
                  </Kbd>
                </span>
              ) : null}
            </Button>
          );
        })}
      </nav>

      <div className="flex-1" />

      {!collapsed ? (
        <div className="madoo-paper-border flex min-h-[68px] items-center justify-between gap-3 rounded-[var(--radius-xl)] bg-madoo-bg-2/50 px-3.5 py-3">
          <span className="grid min-w-0 flex-1 gap-1">
            <span className="truncate font-madoo-sans text-[length:var(--font-size-base)] leading-none text-madoo-ink">
              Share Madoo
            </span>
            <span className="truncate text-[length:var(--font-size-xs)] leading-none">
              100 credits per paid referral
            </span>
          </span>
          <span className="madoo-paper-border grid h-10 w-10 shrink-0 place-items-center rounded-full bg-madoo-bg">
            <AppIcon icon={GiftIcon} size={18} />
          </span>
        </div>
      ) : null}

      <div
        className={cx(
          "flex w-full gap-1.5 justify-between",
          collapsed && "grid",
        )}
      >
        <Button
          aria-label="Open user profile"
          block
          leftIcon={<Avatar name="Andre Ponce" size="xs" circle />}
          size="sm"
          variant="ghost"
          className="w-max"
        />

        <Button
          aria-label="Open inbox menu"
          leftIcon={<AppIcon icon={InboxIcon} size={15} />}
          rightIcon={
            !collapsed ? (
              <AppIcon icon={ArrowDown01Icon} size={12} />
            ) : undefined
          }
          size="sm"
          variant="ghost"
          className="w-max"
        />
      </div>
    </aside>
  );
}
