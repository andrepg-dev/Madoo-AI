"use client";

import { fetchBillingOverview } from "@/actions/billing";
import { getMeOrNull, logoutAction } from "@/actions/auth";
import { fetchWorkspaces, setActiveWorkspace } from "@/actions/workspaces";
import { redirectToLandingAuth } from "@/lib/auth-redirect";
import { useAuthStore } from "@/stores/auth-store";
import { useClientStore } from "@/stores/client-store";
import {
  Add01Icon,
  ArrowDown01Icon,
  Crown02Icon,
  GiftIcon,
  Grid2X2Icon,
  InboxIcon,
  PanelLeftIcon,
  PanelRightIcon,
  Search01Icon,
  StarIcon,
  Tick02Icon,
  UserIcon,
  UserMultipleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Dropdown,
  DropdownContent,
  DropdownDivider,
  DropdownItem,
  DropdownTrigger,
  IconButton,
  Kbd,
  ProgressBar,
  cx,
  useToast,
} from "@madoo/design-system";
import { PLAN_DISPLAY_NAMES } from "@madoo/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CreateWorkspaceModal } from "./CreateWorkspaceModal";
import { PricingDrawer } from "./PricingDrawer";

type NavItem = {
  href: string;
  label: string;
  icon: IconSvgElement | "home";
  shortcut?: string;
};

const primaryItems: NavItem[] = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/search", label: "Search", icon: Search01Icon, shortcut: "K" },
];

const templateProjectItems: NavItem[] = [
  { href: "/dashboard/projects", label: "All projects", icon: Grid2X2Icon },
  { href: "/dashboard/projects/starred", label: "Starred", icon: StarIcon },
  {
    href: "/dashboard/projects/created-by-me",
    label: "Created by me",
    icon: UserIcon,
  },
  {
    href: "/dashboard/projects/shared-with-me",
    label: "Shared with me",
    icon: UserMultipleIcon,
  },
];

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

type SidebarNavButtonProps = {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onSearchSelect?: () => void;
};

function SidebarNavButton({
  item,
  active,
  collapsed,
  onSearchSelect,
}: SidebarNavButtonProps) {
  const content = (
    <>
      <NavIcon icon={item.icon} size={15} />
      <span
        className={cx(
          "min-w-0 flex-1 overflow-hidden text-left text-ellipsis whitespace-nowrap transition-[opacity,max-width] duration-(--duration-base) ease-out",
          collapsed ? "max-w-0 opacity-0" : "max-w-36 opacity-100",
        )}
      >
        {item.label}
      </span>
      {item.shortcut ? (
        <span
          className={cx(
            "ml-auto inline-flex gap-0.5 overflow-hidden transition-[opacity,max-width] duration-(--duration-base) ease-out",
            collapsed ? "max-w-0 opacity-0" : "max-w-12 opacity-100",
          )}
        >
          <Kbd className="h-4.5! w-4.5! text-[9.5px]!">⌘</Kbd>
          <Kbd className="h-4.5! w-4.5! text-[9.5px]!">
            {item.shortcut}
          </Kbd>
        </span>
      ) : null}
    </>
  );
  const className = cx(
    "inline-flex h-8 min-h-8 w-full cursor-pointer select-none items-center overflow-hidden rounded-lg border-0 py-0 font-madoo-sans text-(length:--font-size-base) leading-none no-underline transition-[width,padding,background,color,box-shadow,opacity] duration-(--duration-base) ease-out",
    active
      ? "bg-[color-mix(in_srgb,var(--accent)_10%,white)] font-normal text-madoo-accent-deep shadow-[inset_0_0_0_0.5px_color-mix(in_srgb,var(--accent)_18%,transparent)] hover:bg-[color-mix(in_srgb,var(--accent)_14%,white)] hover:text-madoo-accent-deep"
      : "bg-transparent font-normal text-madoo-ink-soft hover:bg-[rgb(var(--rule-rgb)/0.08)] hover:text-madoo-ink",
    "justify-start gap-2.5 px-2.5",
  );

  if (item.href === "/search") {
    return (
      <button
        type="button"
        aria-label={item.label}
        aria-current={active ? "page" : undefined}
        className={className}
        onClick={onSearchSelect}
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      href={item.href}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      className={className}
    >
      {content}
    </Link>
  );
}

function DropdownLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      className={cx(
        "flex w-full cursor-pointer items-center justify-start gap-3 rounded-md border-0 bg-transparent px-2.5 py-2.25 text-left font-madoo-sans text-[14px] leading-[1.2] text-(--ink) no-underline transition-[background,color] duration-(--duration-fast) ease-out hover:bg-(--surface-2) focus-visible:bg-(--surface-2) focus-visible:outline-none",
        className,
      )}
    >
      {children}
    </Link>
  );
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function formatResetDate(value: string | undefined) {
  if (!value) return "next month";
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
    }).format(new Date(value));
  } catch {
    return "next month";
  }
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [collapsed, setCollapsed] = useState(true);
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const authUser = useAuthStore((state) => state.user);
  const setAuthUser = useAuthStore((state) => state.setUser);
  const workspaceId = useClientStore((state) => state.workspaceId);
  const setWorkspaceId = useClientStore((state) => state.setWorkspaceId);
  const pricingOpen = useClientStore((state) => state.pricingOpen);
  const setPricingOpen = useClientStore((state) => state.setPricingOpen);
  const setSearchCommandOpen = useClientStore(
    (state) => state.setSearchCommandOpen,
  );

  const { data: queriedUser } = useQuery({
    queryKey: ["me"],
    queryFn: () => getMeOrNull(),
    staleTime: 60_000,
  });
  const user = queriedUser ?? authUser;

  const { data: workspaces = [] } = useQuery({
    queryKey: ["workspaces"],
    queryFn: fetchWorkspaces,
    enabled: Boolean(user),
  });

  const activeWorkspace =
    workspaces.find((item) => item.id === workspaceId) ?? null;
  const displayWorkspace = activeWorkspace ?? workspaces[0] ?? null;
  const activeWorkspaceName = displayWorkspace?.name ?? "Madoo workspace";
  const workspaceIdIsValid = Boolean(
    workspaceId && workspaces.some((item) => item.id === workspaceId),
  );

  const { data: billingOverview, isLoading: billingLoading } = useQuery({
    queryKey: ["billing-overview", workspaceId],
    queryFn: fetchBillingOverview,
    enabled: Boolean(user && workspaceIdIsValid),
  });

  const usage = billingOverview?.usage.aiGenerations;
  const usageLimit = usage?.limit ?? 0;
  const creditsLeft =
    usageLimit === -1 ? null : Math.max(usageLimit - (usage?.used ?? 0), 0);
  const creditsPct =
    usageLimit === -1
      ? 100
      : usageLimit > 0 && creditsLeft !== null
        ? Math.min(100, Math.round((creditsLeft / usageLimit) * 100))
        : 0;
  const creditsText = billingLoading
    ? "Loading"
    : usageLimit === -1
      ? "Unlimited"
      : `${creditsLeft ?? 0} left`;
  const currentPlan = billingOverview?.subscription.plan ?? "FREE";
  // No free tier — the entry plan is a 7-day trial.
  const planLabel =
    currentPlan === "FREE"
      ? "Trial"
      : `${PLAN_DISPLAY_NAMES[currentPlan]} plan`;

  const switchWorkspaceMutation = useMutation({
    mutationFn: setActiveWorkspace,
    onSuccess: async (_result, nextWorkspaceId) => {
      setWorkspaceId(nextWorkspaceId);
      setWorkspaceOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["billing-overview"] });
    },
    onError: (error) => {
      toast({
        tone: "danger",
        title: "Workspace switch failed",
        body: getErrorMessage(error, "Try again."),
      });
    },
  });

  const signOutMutation = useMutation({
    mutationFn: logoutAction,
    onSuccess: () => {
      setAuthUser(null);
      setWorkspaceId(null);
      queryClient.setQueryData(["me"], null);
      queryClient.removeQueries({ queryKey: ["workspaces"] });
      queryClient.removeQueries({ queryKey: ["billing-overview"] });
      queryClient.removeQueries({ queryKey: ["emails"] });
      queryClient.removeQueries({ queryKey: ["templates"] });
      queryClient.removeQueries({ queryKey: ["template-preview"] });
      router.push("/");
    },
    onError: (error) => {
      toast({
        tone: "danger",
        title: "Sign out failed",
        body: getErrorMessage(error, "Try again."),
      });
    },
  });

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href);
  };

  const handleSignIn = () => {
    redirectToLandingAuth(pathname ?? "/dashboard/projects");
  };

  useEffect(() => {
    if (!user || workspaces.length === 0 || workspaceIdIsValid) return;
    const nextWorkspaceId = workspaces[0]?.id;
    if (!nextWorkspaceId) return;
    void setActiveWorkspace(nextWorkspaceId)
      .then(() => {
        setWorkspaceId(nextWorkspaceId);
        return queryClient.invalidateQueries({
          queryKey: ["billing-overview"],
        });
      })
      .catch(() => undefined);
  }, [queryClient, setWorkspaceId, user, workspaceIdIsValid, workspaces]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() !== "b" ||
        (!event.metaKey && !event.ctrlKey)
      ) {
        return;
      }

      event.preventDefault();
      setCollapsed((value) => !value);
      setWorkspaceOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <aside
      className={cx(
        "group/sidebar flex h-dvh flex-col gap-2.5 bg-[color-mix(in_srgb,var(--surface)_68%,var(--accent-soft))] py-3 transition-[width] duration-(--duration-base) ease-out",
        collapsed ? "w-15 px-3" : "w-65 px-3",
      )}
    >
      <div
        className={cx(
          "relative flex min-h-7.5 items-center",
          "w-full justify-between px-0.5",
        )}
      >
        <Link
          aria-label="Madoo home"
          href="/"
          className={cx(
            "inline-flex h-7 w-7 items-center justify-center rounded-lg text-madoo-ink-soft transition-[background,color,opacity] duration-(--duration-fast) hover:bg-madoo-surface-2 hover:text-madoo-ink",
            collapsed &&
              "group-hover/sidebar:pointer-events-none group-hover/sidebar:opacity-0",
          )}
        >
          <Image
            alt="Madoo"
            height={26}
            src="/madoo-transparent.png"
            width={26}
            className="rounded-[7px] object-contain ml-1.5"
            priority
          />
        </Link>
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
              "pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 opacity-0 transition-[opacity,transform] duration-(--duration-fast) group-hover/sidebar:pointer-events-auto group-hover/sidebar:opacity-100 group-hover/sidebar:translate-y-0 focus-visible:pointer-events-auto focus-visible:opacity-100",
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
                name={activeWorkspaceName}
                src={displayWorkspace?.avatarUrl ?? undefined}
                size="sm"
                className="bg-madoo-rule rounded-[7.5px]"
              />
            }
            rightIcon={
              <span
                className={cx(
                  "ml-auto inline-flex overflow-hidden transition-[opacity,max-width] duration-(--duration-base) ease-out",
                  collapsed ? "max-w-0 opacity-0" : "max-w-4 opacity-100",
                )}
              >
                <AppIcon icon={ArrowDown01Icon} size={13} />
              </span>
            }
            size="sm"
            variant={collapsed ? "secondary" : "ghost"}
            className={cx(
              "h-8! min-h-8! overflow-hidden py-0! font-normal! transition-[width,padding,background,color,box-shadow] duration-(--duration-base) ease-out",
              "justify-start! gap-2! px-1! pr-3!",
            )}
          >
            <span
              className={cx(
                "min-w-0 flex-1 overflow-hidden text-left text-(length:--font-size-base) font-normal text-ellipsis whitespace-nowrap transition-[opacity,max-width] duration-(--duration-base) ease-out",
                collapsed ? "max-w-0 opacity-0" : "max-w-44 opacity-100",
              )}
            >
              {activeWorkspaceName}
            </span>
          </Button>
        </DropdownTrigger>

        <DropdownContent className="w-80 max-w-[calc(100vw-1rem)] gap-2 overflow-hidden p-2!">
          <div className="flex items-center gap-2.5 p-1">
            <Avatar
              name={activeWorkspaceName}
              src={displayWorkspace?.avatarUrl ?? undefined}
              size="sm"
            />
            <div className="min-w-0">
              <span className="block truncate text-(length:--font-size-base) font-normal">
                {activeWorkspaceName}
              </span>
              {user ? (
                <span className="block truncate text-(length:--font-size-sm) text-madoo-ink-muted">
                  {planLabel}
                </span>
              ) : null}
            </div>
          </div>

          <Card surface="secondary" className="grid gap-2 p-2.5!">
            <div className="flex items-center justify-between gap-2">
              <span className="text-(length:--font-size-base) font-normal">
                Credits
              </span>
              <span className="text-(length:--font-size-sm) text-madoo-ink-muted">
                {creditsText}
              </span>
            </div>
            <ProgressBar value={creditsPct} tone="ink" label="Credits left" />
            <span className="text-(length:--font-size-sm) text-madoo-ink-muted">
              Credits reset {formatResetDate(usage?.resetsAt)}
            </span>
          </Card>

          <div className="grid gap-1.5 p-1">
            <span className="text-(length:--font-size-sm) text-madoo-ink-muted">
              All workspaces
            </span>
            {workspaces.length > 0 ? (
              workspaces.map((item) => {
                const selected = item.id === workspaceId;
                return (
                  <DropdownItem
                    key={item.id}
                    className="px-0!"
                    disabled={switchWorkspaceMutation.isPending}
                    onSelect={() => switchWorkspaceMutation.mutate(item.id)}
                  >
                    <Avatar
                      name={item.name}
                      src={item.avatarUrl ?? undefined}
                      size="xs"
                    />
                    <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                      {item.name}
                    </span>
                    <Badge tone="neutral">{item.role}</Badge>
                    {selected ? <AppIcon icon={Tick02Icon} size={13} /> : null}
                  </DropdownItem>
                );
              })
            ) : (
              <span className="px-1 py-2 text-(length:--font-size-sm) text-madoo-ink-muted">
                {user ? "No workspaces found" : "Sign in to sync workspaces"}
              </span>
            )}
          </div>

          {user ? (
            <DropdownItem
              className="justify-start! text-(length:--font-size-base)! font-normal! shadow-madoo-border"
              onSelect={() => {
                setWorkspaceOpen(false);
                setCreateWorkspaceOpen(true);
              }}
            >
              <AppIcon icon={Add01Icon} size={14} />
              Create workspace
            </DropdownItem>
          ) : (
            <DropdownItem
              className="justify-start! text-(length:--font-size-base)! font-normal! shadow-madoo-border"
              onSelect={() => {
                setWorkspaceOpen(false);
                handleSignIn();
              }}
            >
              <AppIcon icon={UserIcon} size={14} />
              Sign in
            </DropdownItem>
          )}
        </DropdownContent>
      </Dropdown>

      <nav aria-label="Primary navigation" className="grid w-full gap-1 pt-0.5">
        {primaryItems.map((item) => {
          const active = isActive(item.href);
          return (
            <SidebarNavButton
              active={active}
              collapsed={collapsed}
              item={item}
              key={item.href}
              onSearchSelect={() => {
                setSearchCommandOpen(true);
                setWorkspaceOpen(false);
              }}
            />
          );
        })}
      </nav>

      <div
        className={cx(
          "overflow-hidden px-2.5 pt-6 pb-1 font-madoo-sans text-(length:--font-size-base) text-ellipsis whitespace-nowrap text-madoo-ink-soft/70",
          collapsed ? "invisible" : "visible",
        )}
      >
        Template Projects
      </div>

      <nav aria-label="Template projects" className="grid w-full gap-1 pt-0.5">
        {templateProjectItems.map((item) => {
          const active =
            item.href === "/dashboard/projects"
              ? pathname === item.href
              : isActive(item.href);
          return (
            <SidebarNavButton
              active={active}
              collapsed={collapsed}
              item={item}
              key={item.href}
            />
          );
        })}
      </nav>

      <div className="flex-1" />

      {!collapsed ? (
        <div className="grid gap-2">
          <div>
            <Button
              aria-label="Upgrade to Pro"
              block
              leftIcon={
                <span className="grid size-5 place-items-center rounded-sm bg-white/18">
                  <AppIcon icon={Crown02Icon} size={15} />
                </span>
              }
              size="sm"
              variant="accent"
              onClick={() => setPricingOpen(true)}
              className="h-10! min-h-10! justify-center! rounded-lg! bg-[linear-gradient(180deg,color-mix(in_srgb,var(--accent)_92%,white),var(--accent-deep))]! text-(length:--font-size-sm)! font-medium! shadow-[inset_0_0_0_0.5px_rgb(255_255_255/0.28),var(--shadow-border-accent)]! hover:bg-[linear-gradient(180deg,color-mix(in_srgb,var(--accent-deep)_88%,white),var(--accent-deep))]!"
            >
              <span className="truncate">Upgrade to Pro</span>
            </Button>
          </div>

          <div className="madoo-paper-border flex min-h-17 items-center justify-between gap-3 rounded-xl bg-madoo-bg-2/50 px-3.5 py-3">
            <span className="grid min-w-0 flex-1 gap-1">
              <span className="truncate font-madoo-sans text-(length:--font-size-base) leading-none text-madoo-ink">
                Share Madoo
              </span>
              <span className="truncate text-(length:--font-size-xs) leading-none">
                100 credits per paid referral
              </span>
            </span>
            <span className="madoo-paper-border grid h-10 w-10 shrink-0 place-items-center rounded-full bg-madoo-bg">
              <AppIcon icon={GiftIcon} size={18} />
            </span>
          </div>
        </div>
      ) : null}

      <div
        className={cx(
          "flex w-full gap-1.5 justify-between",
          collapsed && "grid",
        )}
      >
        <Dropdown>
          <DropdownTrigger asChild>
            <Button
              aria-label="Open user profile"
              block
              leftIcon={
                <Avatar
                  name={user?.name ?? user?.email ?? "User"}
                  src={user?.avatarUrl ?? undefined}
                  size="xs"
                  circle
                />
              }
              size="sm"
              variant="ghost"
              className="w-max shadow-none! hover:shadow-none! data-[state=open]:shadow-none!"
            />
          </DropdownTrigger>
          <DropdownContent side="top" className="w-56 p-2!">
            <div className="flex items-center gap-2.5 p-1.5">
              <Avatar
                name={user?.name ?? user?.email ?? "User"}
                src={user?.avatarUrl ?? undefined}
                size="sm"
                circle
              />
              <span className="grid min-w-0 gap-0.5">
                <span className="truncate text-(length:--font-size-base) leading-none">
                  {user?.name ?? "Guest"}
                </span>
                <span className="truncate text-(length:--font-size-sm) leading-none text-madoo-ink-muted">
                  {user?.email ?? "Not signed in"}
                </span>
              </span>
            </div>
            <DropdownDivider />
            {user ? (
              <>
                <DropdownLink href="/settings">Profile</DropdownLink>
                <DropdownLink href="/settings">Settings</DropdownLink>
                <DropdownItem
                  className="justify-start! text-madoo-danger"
                  disabled={signOutMutation.isPending}
                  onSelect={() => signOutMutation.mutate()}
                >
                  Sign out
                </DropdownItem>
              </>
            ) : (
              <DropdownItem className="justify-start!" onSelect={handleSignIn}>
                Sign in
              </DropdownItem>
            )}
          </DropdownContent>
        </Dropdown>

        <Dropdown>
          <DropdownTrigger asChild>
            <Button
              aria-label="Open updates menu"
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
          </DropdownTrigger>
          <DropdownContent side="right" align="end" className="w-64 p-0!">
            <div className="grid justify-items-center gap-1.5 px-4 py-6 text-center">
              <span className="grid size-9 place-items-center rounded-full bg-madoo-surface-2 text-madoo-ink-muted">
                <AppIcon icon={InboxIcon} size={16} />
              </span>
              <span className="text-(length:--font-size-base) font-medium leading-none text-madoo-ink">
                What's new
              </span>
              <span className="text-(length:--font-size-sm) leading-5 text-madoo-ink-muted">
                Product news and updates will show up here.
              </span>
            </div>
          </DropdownContent>
        </Dropdown>
      </div>
      <CreateWorkspaceModal
        open={createWorkspaceOpen}
        onClose={() => setCreateWorkspaceOpen(false)}
      />
      <PricingDrawer open={pricingOpen} onClose={() => setPricingOpen(false)} />
    </aside>
  );
}
