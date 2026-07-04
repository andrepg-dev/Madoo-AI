"use client";

import { fetchWorkspaces, setActiveWorkspace } from "@/actions/workspaces";
import { AccountPanel } from "@/components/settings/AccountPanel";
import { SupportPanel } from "@/components/settings/SupportPanel";
import { WorkspacePanel } from "@/components/settings/WorkspacePanel";
import { useClientStore } from "@/stores/client-store";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import {
  SectionHeader,
  SettingsNavRow,
  slugOf,
  type AccountSection,
  type NavGroup,
  type NavItem,
  type SettingsArea,
  type WorkspaceSection,
} from "@/components/settings/settings-ui";

const navGroups: NavGroup[] = [
  {
    label: "Account",
    items: [
      {
        area: "account",
        section: "profile",
        label: "Profile",
        description: "Your display name, avatar, and account email.",
        icon: "user",
      },
      {
        area: "account",
        section: "billing",
        label: "Billing & usage",
        description: "Your plan, AI credits, limits, and invoices.",
        icon: "barChart",
      },
      {
        area: "account",
        section: "referral",
        label: "Refer & earn",
        description: "Share Madoo and earn credits when invitees subscribe.",
        icon: "sparkle",
      },
      {
        area: "account",
        section: "sound",
        label: "Completion sound",
        description: "The sound Madoo plays when a generation finishes.",
        icon: "bell",
      },
    ],
  },
  {
    label: "Workspace",
    items: [
      {
        area: "workspace",
        section: "overview",
        label: "General",
        description: "Rename this workspace and edit its URL slug.",
        icon: "settings",
      },
      {
        area: "workspace",
        section: "avatar",
        label: "Avatar",
        description: "The workspace image shown across navigation.",
        icon: "image",
      },
      {
        area: "workspace",
        section: "members",
        label: "Members",
        description: "Teammates, roles, and pending invites.",
        icon: "copy",
      },
      {
        area: "workspace",
        section: "danger",
        label: "Danger zone",
        description: "Leave or permanently delete this workspace.",
        icon: "lock",
      },
    ],
  },
  {
    label: "Support",
    items: [
      {
        area: "support",
        label: "Contact support",
        description: "Get help from the Madoo team.",
        icon: "message",
      },
    ],
  },
];

const navItems: NavItem[] = navGroups.flatMap((group) => group.items);

export function SettingsView({ section: slug }: { section: string }) {
  const queryClient = useQueryClient();
  const workspaceId = useClientStore((state) => state.workspaceId);
  const setWorkspaceId = useClientStore((state) => state.setWorkspaceId);
  const activeItem =
    navItems.find((item) => slugOf(item) === slug) ?? navItems[0];
  const area: SettingsArea = activeItem.area;
  const accountSection: AccountSection =
    area === "account" ? (activeItem.section as AccountSection) : "profile";
  const workspaceSection: WorkspaceSection =
    area === "workspace"
      ? (activeItem.section as WorkspaceSection)
      : "overview";
  const activeGroup =
    navGroups.find((group) => group.items.includes(activeItem)) ?? navGroups[0];

  const { data: workspaces = [] } = useQuery({
    queryKey: ["workspaces"],
    queryFn: fetchWorkspaces,
  });

  const activeWorkspace = useMemo(() => {
    return (
      workspaces.find((item) => item.id === workspaceId) ??
      workspaces[0] ??
      null
    );
  }, [workspaceId, workspaces]);

  useEffect(() => {
    if (!activeWorkspace || workspaceId === activeWorkspace.id) return;
    void setActiveWorkspace(activeWorkspace.id).then(() => {
      setWorkspaceId(activeWorkspace.id);
      void queryClient.invalidateQueries({ queryKey: ["billing-overview"] });
    });
  }, [activeWorkspace, queryClient, setWorkspaceId, workspaceId]);

  return (
    <div className="grid min-h-full grid-cols-[264px_minmax(0,1fr)] font-madoo-sans text-madoo-ink max-lg:grid-cols-1">
      <aside className="sticky top-0 self-start max-h-[100dvh] overflow-y-auto p-4 shadow-[inset_-0.5px_0_0_rgb(var(--rule-rgb)/0.18)] max-lg:static max-lg:max-h-none max-lg:shadow-(--shadow-border-bottom-soft)">
        <nav className="grid w-full gap-1">
          {navGroups.map((group) => (
            <div key={group.label} className="grid w-full gap-1">
              <div className="overflow-hidden px-2.5 pt-6 pb-1 font-madoo-sans text-(length:--font-size-base) text-ellipsis whitespace-nowrap text-madoo-ink-soft/70">
                {group.label}
              </div>
              {group.items.map((item) => (
                <SettingsNavRow
                  key={slugOf(item)}
                  active={item === activeItem}
                  icon={item.icon}
                  label={item.label}
                  href={`/settings/${slugOf(item)}`}
                />
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <main className="min-w-0 overflow-auto">
        <div className="mx-auto grid w-full max-w-3xl gap-6 px-6 py-8 max-lg:px-4">
          <SectionHeader
            eyebrow={activeGroup.label}
            title={activeItem.label}
            description={activeItem.description}
          />

          {area === "support" ? (
            <SupportPanel activeWorkspace={activeWorkspace} />
          ) : area === "account" ? (
            <AccountPanel section={accountSection} />
          ) : (
            <WorkspacePanel
              section={workspaceSection}
              workspaces={workspaces}
              activeWorkspace={activeWorkspace}
            />
          )}
        </div>
      </main>
    </div>
  );
}
