"use client";

import {
  Avatar,
  Button,
  Card,
  Checkbox,
  cx,
  Icon,
  Input,
  SegmentedControl,
  Textarea,
  useToast
} from "@madoo/design-system";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

type SettingsArea = "account" | "workspace" | "support";
type AccountSection = "profile" | "security" | "providers" | "sound";
type WorkspaceSection = "overview" | "avatar" | "members" | "danger";

type PrimaryNavItem = {
  area: SettingsArea;
  label: string;
  description: string;
  icon: "user" | "grid" | "bell";
};

type SecondaryNavItem = {
  value: AccountSection | WorkspaceSection;
  label: string;
  icon: "user" | "lock" | "plus" | "bell" | "settings" | "image" | "copy";
};

const primaryNav: PrimaryNavItem[] = [
  {
    area: "account",
    label: "User settings",
    description: "Profile, access, providers, alerts",
    icon: "user",
  },
  {
    area: "workspace",
    label: "Workspace settings",
    description: "Name, avatar, members, danger zone",
    icon: "grid",
  },
  {
    area: "support",
    label: "Support",
    description: "Get help from the Madoo team",
    icon: "bell",
  },
];

const accountNav: SecondaryNavItem[] = [
  { value: "profile", label: "Profile", icon: "user" },
  { value: "security", label: "Password", icon: "lock" },
  { value: "providers", label: "Providers", icon: "plus" },
  { value: "sound", label: "Complete sound", icon: "bell" },
];

const workspaceNav: SecondaryNavItem[] = [
  { value: "overview", label: "Workspace name", icon: "settings" },
  { value: "avatar", label: "Avatar", icon: "image" },
  { value: "members", label: "Membership", icon: "copy" },
  { value: "danger", label: "Danger zone", icon: "lock" },
];

const providerRows = [
  { name: "Google", status: "Connected", tone: "accent" as const },
  { name: "GitHub", status: "Connect", tone: "neutral" as const },
  { name: "Apple", status: "Connect", tone: "neutral" as const },
  { name: "Email", status: "Primary", tone: "solid" as const },
];

function getSettingsHref(
  area: SettingsArea,
  section?: AccountSection | WorkspaceSection,
) {
  const params = new URLSearchParams({ area });
  if (section) params.set("section", section);
  return `/settings?${params.toString()}`;
}

function isSettingsArea(value: string | null): value is SettingsArea {
  return value === "account" || value === "workspace" || value === "support";
}

function isAccountSection(value: string | null): value is AccountSection {
  return (
    value === "profile" ||
    value === "security" ||
    value === "providers" ||
    value === "sound"
  );
}

function isWorkspaceSection(value: string | null): value is WorkspaceSection {
  return (
    value === "overview" ||
    value === "avatar" ||
    value === "members" ||
    value === "danger"
  );
}

function SettingsNavLink({
  active,
  icon,
  label,
  description,
  href,
}: {
  active: boolean;
  icon: PrimaryNavItem["icon"];
  label: string;
  description?: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cx(
        "flex w-full cursor-pointer items-center gap-2.5 rounded-[var(--radius-lg)] border-0 bg-transparent px-3 py-2.5 text-left font-madoo-sans no-underline transition-[background,color,box-shadow]",
        active
          ? "bg-madoo-surface text-madoo-ink shadow-[var(--shadow-border)]"
          : "text-madoo-ink-soft hover:bg-madoo-surface-2 hover:text-madoo-ink",
      )}
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-[var(--radius-lg)] bg-madoo-bg-2 shadow-[var(--shadow-border)]">
        <Icon name={icon} size={15} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[length:var(--font-size-base)] font-medium leading-none">
          {label}
        </span>
        {description ? (
          <span className="mt-1 block truncate text-[length:var(--font-size-xs)] leading-none text-madoo-ink-muted">
            {description}
          </span>
        ) : null}
      </span>
    </Link>
  );
}

function SecondaryNavLink({
  active,
  item,
  href,
}: {
  active: boolean;
  item: SecondaryNavItem;
  href: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cx(
        "flex h-9 w-full cursor-pointer items-center gap-2 rounded-[var(--radius-lg)] border-0 px-2.5 font-madoo-sans text-[length:var(--font-size-base)] no-underline transition-[background,color,box-shadow]",
        active
          ? "bg-madoo-surface text-madoo-ink shadow-[var(--shadow-border)]"
          : "bg-transparent text-madoo-ink-muted hover:bg-madoo-surface-2 hover:text-madoo-ink",
      )}
    >
      <Icon name={item.icon} size={14} />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <div className="text-[length:var(--font-size-xs)] font-medium uppercase leading-none tracking-[0.08em] text-madoo-ink-muted">
        {eyebrow}
      </div>
      <h1 className="mt-2 text-3xl font-semibold leading-none text-madoo-ink">
        {title}
      </h1>
      <p className="mt-3 max-w-2xl text-[length:var(--font-size-base)] leading-6 text-madoo-ink-muted">
        {description}
      </p>
    </div>
  );
}

function SettingsCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="!rounded-[20px] !bg-madoo-surface !p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold leading-none text-madoo-ink">
            {title}
          </h2>
          {description ? (
            <p className="mt-2 text-[length:var(--font-size-sm)] leading-5 text-madoo-ink-muted">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {children}
    </Card>
  );
}

function AccountPanel({ section }: { section: AccountSection }) {
  const { toast } = useToast();
  const [sound, setSound] = useState("soft");

  if (section === "security") {
    return (
      <SettingsCard
        title="Password change"
        description="Update sign-in password for email-based access."
      >
        <div className="grid max-w-xl gap-3">
          <Input label="Current password" type="password" placeholder="Current password" />
          <Input label="New password" type="password" placeholder="New password" />
          <Input label="Confirm password" type="password" placeholder="Confirm password" />
          <div className="pt-1">
            <Button
              size="md"
              onClick={() =>
                toast({
                  tone: "warn",
                  title: "Password update pending",
                  body: "Backend action is not connected yet.",
                })
              }
            >
              Update password
            </Button>
          </div>
        </div>
      </SettingsCard>
    );
  }

  if (section === "providers") {
    return (
      <SettingsCard
        title="Linked providers"
        description="Connect external login methods for this user."
      >
        <div className="grid gap-2">
          {providerRows.map((provider) => (
            <div
              key={provider.name}
              className="flex items-center justify-between gap-3 rounded-[var(--radius-lg)] bg-madoo-bg-2 px-3.5 py-3 shadow-[var(--shadow-border)]"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-[var(--radius-lg)] bg-madoo-surface font-madoo-display font-semibold shadow-[var(--shadow-border)]">
                  {provider.name[0]}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[length:var(--font-size-base)] font-medium leading-none text-madoo-ink">
                    {provider.name}
                  </span>
                  <span className="mt-1 block truncate text-[length:var(--font-size-sm)] leading-none text-madoo-ink-muted">
                    {provider.name === "Email"
                      ? "andre@madoo.ai"
                      : "OAuth sign-in provider"}
                  </span>
                </span>
              </div>
              <Button
                size="sm"
                variant={provider.status === "Connect" ? "secondary" : "ghost"}
                onClick={() =>
                  toast({
                    title: `${provider.name} provider`,
                    body: "Provider linking is not connected yet.",
                  })
                }
              >
                {provider.status}
              </Button>
            </div>
          ))}
        </div>
      </SettingsCard>
    );
  }

  if (section === "sound") {
    return (
      <SettingsCard
        title="Completion sound"
        description="Choose how Madoo notifies you when generation completes."
      >
        <div className="grid gap-4">
          <SegmentedControl
            aria-label="Completion sound"
            value={sound}
            onChange={setSound}
            items={[
              { value: "soft", label: "Soft" },
              { value: "bright", label: "Bright" },
              { value: "silent", label: "Silent" },
            ]}
          />
          <Checkbox
            defaultChecked
            label="Play sound after email generation"
            description="Applies to background tasks and editor generation."
          />
          <Button
            size="md"
            variant="secondary"
            className="w-max"
            onClick={() =>
              toast({
                tone: "success",
                title: "Sound preference saved",
                body: `Selected sound: ${sound}.`,
              })
            }
          >
            Save sound
          </Button>
        </div>
      </SettingsCard>
    );
  }

  return (
    <SettingsCard
      title="User profile"
      description="Change username and account display details."
    >
      <div className="grid max-w-xl gap-4">
        <div className="flex items-center gap-3">
          <Avatar name="Andre Ponce" size="xl" circle tone="ink" />
          <div className="min-w-0">
            <p className="text-[length:var(--font-size-base)] font-medium leading-none text-madoo-ink">
              Andre Ponce
            </p>
            <p className="mt-1 text-[length:var(--font-size-sm)] leading-none text-madoo-ink-muted">
              andre@madoo.ai
            </p>
          </div>
        </div>
        <Input label="Username" defaultValue="Andre Ponce" />
        <Input label="Email" defaultValue="andre@madoo.ai" disabled />
        <Button
          size="md"
          className="w-max"
          onClick={() =>
            toast({
              tone: "success",
              title: "Profile saved",
              body: "Username change is ready for backend wiring.",
            })
          }
        >
          Save profile
        </Button>
      </div>
    </SettingsCard>
  );
}

function WorkspacePanel({ section }: { section: WorkspaceSection }) {
  const { toast } = useToast();

  if (section === "avatar") {
    return (
      <SettingsCard
        title="Workspace avatar"
        description="Set the workspace identity shown in navigation."
      >
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name="Andre's Madoo" size="xl" tone="accent" />
          <div className="grid gap-2">
            <Button
              size="md"
              variant="secondary"
              onClick={() =>
                toast({
                  title: "Avatar upload pending",
                  body: "File upload action is not connected yet.",
                })
              }
            >
              Upload avatar
            </Button>
            <Button size="sm" variant="ghost">
              Remove avatar
            </Button>
          </div>
        </div>
      </SettingsCard>
    );
  }

  if (section === "members") {
    return (
      <SettingsCard
        title="Membership"
        description="Leave workspace if you joined by invitation."
      >
        <div className="rounded-[var(--radius-lg)] bg-madoo-bg-2 p-4 shadow-[var(--shadow-border)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[length:var(--font-size-base)] font-medium leading-none text-madoo-ink">
                Andre's Madoo
              </p>
              <p className="mt-2 text-[length:var(--font-size-sm)] leading-5 text-madoo-ink-muted">
                Current role: owner. Invited members can leave from here.
              </p>
            </div>
            <Button
              size="md"
              variant="secondary"
              disabled
              title="Owners cannot leave their own workspace"
            >
              Leave workspace
            </Button>
          </div>
        </div>
      </SettingsCard>
    );
  }

  if (section === "danger") {
    return (
      <SettingsCard
        title="Delete workspace"
        description="Permanent destructive action for this workspace."
      >
        <div className="rounded-[var(--radius-lg)] bg-[color-mix(in_srgb,var(--danger)_7%,var(--surface))] p-4 shadow-[var(--shadow-border-danger)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[length:var(--font-size-base)] font-medium leading-none text-madoo-ink">
                Delete Andre's Madoo
              </p>
              <p className="mt-2 max-w-xl text-[length:var(--font-size-sm)] leading-5 text-madoo-ink-muted">
                This removes projects, templates, members, and workspace settings.
              </p>
            </div>
            <Button
              size="md"
              variant="danger"
              onClick={() =>
                toast({
                  tone: "danger",
                  title: "Delete workspace pending",
                  body: "Confirmation flow is not connected yet.",
                })
              }
            >
              Delete workspace
            </Button>
          </div>
        </div>
      </SettingsCard>
    );
  }

  return (
    <SettingsCard
      title="Workspace name"
      description="Rename the active workspace."
    >
      <div className="grid max-w-xl gap-4">
        <Input label="Workspace name" defaultValue="Andre's Madoo" />
        <Input label="Workspace URL slug" defaultValue="andres-madoo" />
        <Button
          size="md"
          className="w-max"
          onClick={() =>
            toast({
              tone: "success",
              title: "Workspace saved",
              body: "Rename action is ready for backend wiring.",
            })
          }
        >
          Save workspace
        </Button>
      </div>
    </SettingsCard>
  );
}

function SupportPanel() {
  const { toast } = useToast();

  return (
    <div className="grid gap-4">
      <SettingsCard
        title="Contact support"
        description="Send context to the Madoo team so they can help with account, workspace, billing, or generation issues."
      >
        <div className="grid max-w-2xl gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Contact email" defaultValue="andre@madoo.ai" />
            <Input label="Category" defaultValue="Workspace support" />
          </div>
          <Input
            label="Subject"
            placeholder="Example: I cannot export a template"
          />
          <Textarea
            label="What do you need help with?"
            placeholder="Share what happened, what you expected, and any project/template involved."
            rows={6}
            noResize
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="md"
              onClick={() =>
                toast({
                  tone: "success",
                  title: "Support request prepared",
                  body: "Support submission is ready for backend wiring.",
                })
              }
            >
              Send request
            </Button>
            <Button size="md" variant="secondary">
              Open help center
            </Button>
          </div>
        </div>
      </SettingsCard>

      <div className="grid gap-3 md:grid-cols-3">
        {[
          {
            title: "Billing",
            body: "Plan changes, credits, invoices, and workspace payment questions.",
          },
          {
            title: "Generation",
            body: "Prompt quality, export errors, previews, and provider output issues.",
          },
          {
            title: "Account",
            body: "Login providers, passwords, user access, and workspace membership.",
          },
        ].map((item) => (
          <Card key={item.title} className="!rounded-[18px] !bg-madoo-surface !p-4">
            <div className="mb-3 grid size-9 place-items-center rounded-[var(--radius-lg)] bg-madoo-bg-2 shadow-[var(--shadow-border)]">
              <Icon name="bell" size={15} />
            </div>
            <h2 className="text-[length:var(--font-size-base)] font-semibold leading-none text-madoo-ink">
              {item.title}
            </h2>
            <p className="mt-2 text-[length:var(--font-size-sm)] leading-5 text-madoo-ink-muted">
              {item.body}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const areaParam = searchParams.get("area");
  const sectionParam = searchParams.get("section");
  const area: SettingsArea = isSettingsArea(areaParam) ? areaParam : "account";
  const accountSection: AccountSection =
    area === "account" && isAccountSection(sectionParam)
      ? sectionParam
      : "profile";
  const workspaceSection: WorkspaceSection =
    area === "workspace" && isWorkspaceSection(sectionParam)
      ? sectionParam
      : "overview";
  const activePrimary = primaryNav.find((item) => item.area === area) ?? primaryNav[0];
  const secondaryNav =
    area === "account" ? accountNav : area === "workspace" ? workspaceNav : [];
  const activeSecondary =
    area === "account"
      ? accountSection
      : area === "workspace"
        ? workspaceSection
        : "";

  return (
    <div className="grid min-h-full grid-cols-[280px_260px_minmax(0,1fr)] bg-[var(--madoo-page)] font-madoo-sans text-madoo-ink max-xl:grid-cols-[250px_minmax(0,1fr)] max-lg:grid-cols-1">
      <aside className="bg-[var(--madoo-page)] p-4 shadow-[inset_-0.5px_0_0_rgb(var(--rule-rgb)_/_0.18)] max-lg:shadow-[var(--shadow-border-bottom-soft)]">
        <div className="space-y-5">
          <div>
            <div className="mb-2 px-3 text-[length:var(--font-size-xs)] font-medium uppercase leading-none tracking-[0.08em] text-madoo-ink-muted">
              Settings
            </div>
            <div className="grid gap-1.5">
              {primaryNav.map((item) => (
                <SettingsNavLink
                  key={item.area}
                  active={area === item.area}
                  icon={item.icon}
                  label={item.label}
                  description={item.description}
                  href={getSettingsHref(
                    item.area,
                    item.area === "account"
                      ? "profile"
                      : item.area === "workspace"
                        ? "overview"
                        : undefined,
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </aside>

      <aside className="bg-[var(--madoo-page)] p-4 shadow-[inset_-0.5px_0_0_rgb(var(--rule-rgb)_/_0.18)] max-xl:hidden">
        <div className="mb-4 flex items-center gap-3">
          <Avatar
            name={activePrimary.label}
            size="md"
            tone={area === "account" ? "ink" : "accent"}
          />
          <div className="min-w-0">
            <p className="truncate text-[length:var(--font-size-base)] font-medium leading-none">
              {activePrimary.label}
            </p>
            <p className="mt-1 truncate text-[length:var(--font-size-sm)] leading-none text-madoo-ink-muted">
              {activePrimary.description}
            </p>
          </div>
        </div>
        {secondaryNav.length ? (
          <div className="grid gap-1.5">
            {secondaryNav.map((item) => (
              <SecondaryNavLink
                key={item.value}
                active={activeSecondary === item.value}
                item={item}
                href={getSettingsHref(area, item.value)}
              />
            ))}
          </div>
        ) : null}
      </aside>

      <main className="min-w-0 overflow-auto">
        <div className="mx-auto grid w-full max-w-5xl gap-5 px-6 py-8 max-lg:px-4">
          <SectionHeader
            eyebrow={
              area === "account"
                ? "Account"
                : area === "workspace"
                  ? "Workspace"
                  : "Support"
            }
            title={activePrimary.label}
            description={activePrimary.description}
          />

          {secondaryNav.length ? (
            <div className="hidden max-xl:flex max-w-full gap-1 overflow-x-auto rounded-full bg-madoo-surface-2/35 p-1 shadow-[var(--shadow-border)]">
              {secondaryNav.map((item) => (
                <Link
                  key={item.value}
                  href={getSettingsHref(area, item.value)}
                  aria-current={activeSecondary === item.value ? "page" : undefined}
                  className={cx(
                    "whitespace-nowrap rounded-full px-3 py-1.5 font-madoo-sans text-[12.5px] font-medium no-underline transition-colors",
                    activeSecondary === item.value
                      ? "bg-madoo-surface text-madoo-ink shadow-[var(--shadow-border)]"
                      : "text-madoo-ink-muted hover:text-madoo-ink",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          ) : null}

          {area === "support" ? (
            <SupportPanel />
          ) : area === "account" ? (
            <AccountPanel section={accountSection} />
          ) : (
            <WorkspacePanel section={workspaceSection} />
          )}
        </div>
      </main>
    </div>
  );
}
