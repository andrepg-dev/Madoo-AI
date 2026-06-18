"use client";

import { getMe, updateMe, uploadAvatar } from "@/actions/auth";
import { BillingPanel } from "@/components/settings/BillingPanel";
import { createSupportTicket } from "@/actions/support";
import {
  createWorkspaceInvite,
  deleteCurrentWorkspace,
  deleteWorkspaceInvite,
  fetchWorkspaceInvites,
  fetchWorkspaceMembers,
  fetchWorkspaces,
  leaveCurrentWorkspace,
  removeWorkspaceMember,
  setActiveWorkspace,
  updateCurrentWorkspace,
  updateWorkspaceMemberRole,
  uploadWorkspaceAvatar,
} from "@/actions/workspaces";
import {
  playCompletionSound,
  readSoundPref,
  saveSoundPref,
  type SoundPref,
} from "@/lib/storage";
import { useAuthStore } from "@/stores/auth-store";
import { useClientStore } from "@/stores/client-store";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  NativeSelect,
  cx,
  Icon,
  Input,
  SegmentedControl,
  Textarea,
  useToast,
} from "@madoo/design-system";
import type {
  MyWorkspace,
  Role,
  SupportCategory,
  WorkspaceInvite,
  WorkspaceInviteRole,
  WorkspaceMember,
} from "@madoo/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import posthog from "posthog-js";

type SettingsArea = "account" | "workspace" | "support";
type AccountSection = "profile" | "billing" | "sound";
type WorkspaceSection = "overview" | "avatar" | "members" | "danger";

type NavIcon =
  | "user"
  | "barChart"
  | "bell"
  | "settings"
  | "image"
  | "copy"
  | "lock"
  | "message";

type NavItem = {
  area: SettingsArea;
  section?: AccountSection | WorkspaceSection;
  label: string;
  description: string;
  icon: NavIcon;
};

type NavGroup = { label: string; items: NavItem[] };

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

const supportCategoryOptions = [
  { value: "WORKSPACE", label: "Workspace" },
  { value: "BILLING", label: "Billing" },
  { value: "GENERATION", label: "Generation" },
  { value: "EXPORT", label: "Export" },
  { value: "ACCOUNT", label: "Account" },
  { value: "OTHER", label: "Other" },
];

const inviteRoleOptions = [
  { value: "MEMBER", label: "Member" },
  { value: "ADMIN", label: "Admin" },
];

const memberRoleOptions = [
  { value: "MEMBER", label: "Member" },
  { value: "ADMIN", label: "Admin" },
  { value: "OWNER", label: "Owner" },
];

/** URL segment for a nav item, e.g. /settings/profile, /settings/general. */
function slugOf(item: NavItem): string {
  if (item.area === "workspace" && item.section === "overview") return "general";
  return item.section ?? item.area;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function canAdmin(role: Role | undefined) {
  return role === "OWNER" || role === "ADMIN";
}

function SettingsNavRow({
  active,
  icon,
  label,
  href,
}: {
  active: boolean;
  icon: NavIcon;
  label: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cx(
        "inline-flex h-8 min-h-8 w-full cursor-pointer select-none items-center justify-start gap-2.5 overflow-hidden rounded-lg border-0 px-2.5 py-0 font-madoo-sans text-(length:--font-size-base) leading-none no-underline transition-[background,color,box-shadow] duration-(--duration-base) ease-out",
        active
          ? "bg-[color-mix(in_srgb,var(--accent)_10%,white)] font-normal text-madoo-accent-deep shadow-[inset_0_0_0_0.5px_color-mix(in_srgb,var(--accent)_18%,transparent)] hover:bg-[color-mix(in_srgb,var(--accent)_14%,white)] hover:text-madoo-accent-deep"
          : "bg-transparent font-normal text-madoo-ink-soft hover:bg-[rgb(var(--rule-rgb)/0.08)] hover:text-madoo-ink",
      )}
    >
      <span
        className="inline-flex shrink-0 items-center justify-center"
        style={{ width: 15, height: 15 }}
      >
        <Icon name={icon} size={15} />
      </span>
      <span className="truncate">{label}</span>
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
      <div className="text-(length:--font-size-xs) font-medium uppercase leading-none tracking-[0.08em] text-madoo-ink-muted">
        {eyebrow}
      </div>
      <h1 className="mt-2 text-3xl font-semibold leading-none text-madoo-ink">
        {title}
      </h1>
      <p className="mt-3 max-w-2xl text-(length:--font-size-base) leading-6 text-madoo-ink-muted">
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
  title?: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-[20px]! p-5!">
      {title || description ? (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title ? (
              <h2 className="text-lg font-semibold leading-none text-madoo-ink">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="mt-2 text-(length:--font-size-sm) leading-5 text-madoo-ink-muted">
                {description}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
      {children}
    </Card>
  );
}

function AccountPanel({ section }: { section: AccountSection }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const setAuthUser = useAuthStore((state) => state.setUser);
  const { data: user, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    staleTime: 60_000,
  });
  const [name, setName] = useState("");
  const [sound, setSound] = useState<SoundPref>("soft");

  useEffect(() => {
    if (user) setName(user.name ?? "");
  }, [user]);

  useEffect(() => {
    setSound(readSoundPref());
  }, []);

  const profileMutation = useMutation({
    mutationFn: updateMe,
    onSuccess: (updated) => {
      queryClient.setQueryData(["me"], updated);
      setAuthUser(updated);
      toast({ tone: "success", title: "Profile saved" });
    },
    onError: (error) => {
      toast({
        tone: "danger",
        title: "Profile save failed",
        body: getErrorMessage(error, "Try again."),
      });
    },
  });

  const avatarMutation = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: (updated) => {
      queryClient.setQueryData(["me"], updated);
      setAuthUser(updated);
      toast({ tone: "success", title: "Avatar updated" });
    },
    onError: (error) => {
      toast({
        tone: "danger",
        title: "Avatar upload failed",
        body: getErrorMessage(error, "Use a PNG or JPEG under 4 MB."),
      });
    },
  });

  if (section === "billing") {
    return <BillingPanel />;
  }

  if (section === "sound") {
    const saveSound = (next: SoundPref) => {
      setSound(next);
      saveSoundPref(next);
    };

    return (
      <SettingsCard>
        <div className="grid gap-4">
          <SegmentedControl
            aria-label="Completion sound"
            value={sound}
            onChange={(value) => saveSound(value as SoundPref)}
            items={[
              { value: "soft", label: "Soft" },
              { value: "bright", label: "Bright" },
              { value: "silent", label: "Silent" },
            ]}
          />
          <Checkbox
            checked={sound !== "silent"}
            label="Play sound after email generation"
            description="Stored locally on this device."
            onChange={(event) =>
              saveSound(event.currentTarget.checked ? "soft" : "silent")
            }
          />
          <Button
            size="md"
            variant="secondary"
            className="w-max"
            disabled={sound === "silent"}
            onClick={playCompletionSound}
          >
            Test sound
          </Button>
        </div>
      </SettingsCard>
    );
  }

  return (
    <SettingsCard>
      <div className="grid max-w-xl gap-4">
        <div className="flex items-center gap-3">
          <Avatar
            name={user?.name ?? user?.email ?? "User"}
            src={user?.avatarUrl ?? undefined}
            size="xl"
            circle
            tone="ink"
          />
          <div className="min-w-0">
            <p className="text-(length:--font-size-base) font-medium leading-none text-madoo-ink">
              {isLoading ? "Loading..." : user?.name || "Unnamed user"}
            </p>
            <p className="mt-1 text-(length:--font-size-sm) leading-none text-madoo-ink-muted">
              {user?.email ?? ""}
            </p>
          </div>
        </div>
        <Input
          label="Username"
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
        />
        <Input label="Email" value={user?.email ?? ""} disabled readOnly />
        <div className="flex flex-wrap gap-2">
          <Button
            size="md"
            disabled={!name.trim() || profileMutation.isPending}
            onClick={() => profileMutation.mutate({ name: name.trim() })}
          >
            Save profile
          </Button>
          <label className="inline-flex">
            <input
              className="sr-only"
              type="file"
              accept="image/png,image/jpeg"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                if (!file) return;
                const formData = new FormData();
                formData.set("file", file);
                avatarMutation.mutate(formData);
                event.currentTarget.value = "";
              }}
            />
            <span className="inline-flex cursor-pointer items-center rounded-lg bg-madoo-surface px-3.5 py-2 font-madoo-sans text-[13.5px] font-medium leading-none text-madoo-ink shadow-madoo-border transition-colors hover:bg-madoo-bg">
              {avatarMutation.isPending ? "Uploading..." : "Upload avatar"}
            </span>
          </label>
        </div>
      </div>
    </SettingsCard>
  );
}

function WorkspacePanel({
  section,
  workspaces,
  activeWorkspace,
}: {
  section: WorkspaceSection;
  workspaces: MyWorkspace[];
  activeWorkspace: MyWorkspace | null;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);
  const setWorkspaceId = useClientStore((state) => state.setWorkspaceId);
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceSlug, setWorkspaceSlug] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<WorkspaceInviteRole>("MEMBER");
  const [latestInviteUrl, setLatestInviteUrl] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const activeRole = activeWorkspace?.role;
  const admin = canAdmin(activeRole);

  useEffect(() => {
    setWorkspaceName(activeWorkspace?.name ?? "");
    setWorkspaceSlug(activeWorkspace?.slug ?? "");
    setDeleteConfirm("");
  }, [activeWorkspace?.id, activeWorkspace?.name, activeWorkspace?.slug]);

  const membersQuery = useQuery({
    queryKey: ["workspace-members", activeWorkspace?.id],
    queryFn: fetchWorkspaceMembers,
    enabled: Boolean(activeWorkspace),
  });

  const invitesQuery = useQuery({
    queryKey: ["workspace-invites", activeWorkspace?.id],
    queryFn: fetchWorkspaceInvites,
    enabled: Boolean(activeWorkspace && admin),
  });

  const invalidateWorkspace = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["workspaces"] }),
      queryClient.invalidateQueries({
        queryKey: ["workspace-members", activeWorkspace?.id],
      }),
      queryClient.invalidateQueries({
        queryKey: ["workspace-invites", activeWorkspace?.id],
      }),
    ]);
  };

  const updateWorkspaceMutation = useMutation({
    mutationFn: updateCurrentWorkspace,
    onSuccess: async () => {
      await invalidateWorkspace();
      toast({ tone: "success", title: "Workspace saved" });
    },
    onError: (error) => {
      toast({
        tone: "danger",
        title: "Workspace save failed",
        body: getErrorMessage(error, "Try again."),
      });
    },
  });

  const workspaceAvatarMutation = useMutation({
    mutationFn: uploadWorkspaceAvatar,
    onSuccess: async () => {
      await invalidateWorkspace();
      toast({ tone: "success", title: "Workspace avatar updated" });
    },
    onError: (error) => {
      toast({
        tone: "danger",
        title: "Workspace avatar failed",
        body: getErrorMessage(error, "Use a PNG or JPEG under 4 MB."),
      });
    },
  });

  const memberRoleMutation = useMutation({
    mutationFn: (input: { userId: string; role: Role }) =>
      updateWorkspaceMemberRole(input.userId, { role: input.role }),
    onSuccess: async () => {
      await invalidateWorkspace();
      toast({ tone: "success", title: "Member role updated" });
    },
    onError: (error) => {
      toast({
        tone: "danger",
        title: "Role update failed",
        body: getErrorMessage(error, "Try again."),
      });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: removeWorkspaceMember,
    onSuccess: async () => {
      await invalidateWorkspace();
      toast({ tone: "success", title: "Member removed" });
    },
    onError: (error) => {
      toast({
        tone: "danger",
        title: "Remove member failed",
        body: getErrorMessage(error, "Try again."),
      });
    },
  });

  const createInviteMutation = useMutation({
    mutationFn: createWorkspaceInvite,
    onSuccess: async (invite) => {
      posthog.capture("workspace_invite_created", {
        workspace_id: activeWorkspace?.id,
        invite_role: invite.role,
        has_email: Boolean(invite.email),
      });
      setLatestInviteUrl(invite.inviteUrl);
      setInviteEmail("");
      await queryClient.invalidateQueries({
        queryKey: ["workspace-invites", activeWorkspace?.id],
      });
      toast({ tone: "success", title: "Invite created" });
    },
    onError: (error) => {
      toast({
        tone: "danger",
        title: "Invite failed",
        body: getErrorMessage(error, "Try again."),
      });
    },
  });

  const deleteInviteMutation = useMutation({
    mutationFn: deleteWorkspaceInvite,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["workspace-invites", activeWorkspace?.id],
      });
      toast({ tone: "success", title: "Invite deleted" });
    },
    onError: (error) => {
      toast({
        tone: "danger",
        title: "Delete invite failed",
        body: getErrorMessage(error, "Try again."),
      });
    },
  });

  const afterWorkspaceExit = async (removedId: string) => {
    const nextWorkspace = workspaces.find((item) => item.id !== removedId);
    if (nextWorkspace) {
      await setActiveWorkspace(nextWorkspace.id);
      setWorkspaceId(nextWorkspace.id);
    } else {
      setWorkspaceId(null);
    }
    await queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    await queryClient.invalidateQueries({ queryKey: ["billing-overview"] });
    router.push("/dashboard/projects");
  };

  const deleteWorkspaceMutation = useMutation({
    mutationFn: deleteCurrentWorkspace,
    onSuccess: async () => {
      if (activeWorkspace) await afterWorkspaceExit(activeWorkspace.id);
      toast({ tone: "success", title: "Workspace deleted" });
    },
    onError: (error) => {
      toast({
        tone: "danger",
        title: "Delete workspace failed",
        body: getErrorMessage(error, "Try again."),
      });
    },
  });

  const leaveWorkspaceMutation = useMutation({
    mutationFn: leaveCurrentWorkspace,
    onSuccess: async () => {
      if (activeWorkspace) await afterWorkspaceExit(activeWorkspace.id);
      toast({ tone: "success", title: "Workspace left" });
    },
    onError: (error) => {
      toast({
        tone: "danger",
        title: "Leave workspace failed",
        body: getErrorMessage(error, "Try again."),
      });
    },
  });

  const copyInvite = async (invite: WorkspaceInvite) => {
    await navigator.clipboard.writeText(invite.inviteUrl);
    toast({ tone: "success", title: "Invite link copied" });
  };

  if (!activeWorkspace) {
    return (
      <SettingsCard title="Workspace" description="No active workspace found.">
        <p className="text-(length:--font-size-base) text-madoo-ink-muted">
          Create or switch workspace from sidebar.
        </p>
      </SettingsCard>
    );
  }

  if (section === "avatar") {
    return (
      <SettingsCard>
        <div className="flex flex-wrap items-center gap-4">
          <Avatar
            name={activeWorkspace.name}
            src={activeWorkspace.avatarUrl ?? undefined}
            size="xl"
            tone="accent"
          />
          <label className="inline-flex">
            <input
              className="sr-only"
              type="file"
              accept="image/png,image/jpeg"
              disabled={!admin || workspaceAvatarMutation.isPending}
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                if (!file) return;
                const formData = new FormData();
                formData.set("file", file);
                workspaceAvatarMutation.mutate(formData);
                event.currentTarget.value = "";
              }}
            />
            <span
              className={cx(
                "inline-flex cursor-pointer items-center rounded-lg bg-madoo-surface px-3.5 py-2 font-madoo-sans text-[13.5px] font-medium leading-none text-madoo-ink shadow-madoo-border transition-colors hover:bg-madoo-bg",
                (!admin || workspaceAvatarMutation.isPending) &&
                  "cursor-not-allowed opacity-60",
              )}
            >
              {workspaceAvatarMutation.isPending
                ? "Uploading..."
                : "Upload avatar"}
            </span>
          </label>
        </div>
      </SettingsCard>
    );
  }

  if (section === "members") {
    const members = membersQuery.data ?? [];
    const invites = invitesQuery.data ?? [];

    return (
      <div className="grid gap-4">
        <SettingsCard>
          <div className="grid gap-2">
            {membersQuery.isLoading ? (
              <p className="text-(length:--font-size-base) text-madoo-ink-muted">
                Loading members...
              </p>
            ) : (
              members.map((member) => (
                <MemberRow
                  key={member.userId}
                  member={member}
                  currentUserId={user?.id}
                  canEditRoles={activeRole === "OWNER"}
                  canRemove={admin}
                  onRoleChange={(role) =>
                    memberRoleMutation.mutate({ userId: member.userId, role })
                  }
                  onRemove={() => removeMemberMutation.mutate(member.userId)}
                  disabled={
                    memberRoleMutation.isPending ||
                    removeMemberMutation.isPending
                  }
                />
              ))
            )}
          </div>
        </SettingsCard>

        <SettingsCard
          title="Invites"
          description="Create a link invite and optionally email it."
        >
          <div className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px_auto]">
              <Input
                label="Email"
                placeholder="teammate@example.com"
                value={inviteEmail}
                disabled={!admin}
                onChange={(event) => setInviteEmail(event.currentTarget.value)}
              />
              <NativeSelect
                label="Role"
                value={inviteRole}
                options={inviteRoleOptions}
                disabled={!admin}
                onChange={(event) =>
                  setInviteRole(event.currentTarget.value as WorkspaceInviteRole)
                }
              />
              <div className="flex items-end">
                <Button
                  size="md"
                  disabled={!admin || createInviteMutation.isPending}
                  onClick={() =>
                    createInviteMutation.mutate({
                      email: inviteEmail.trim() || undefined,
                      role: inviteRole,
                    })
                  }
                >
                  Create invite
                </Button>
              </div>
            </div>

            {latestInviteUrl ? (
              <div className="flex flex-wrap items-center gap-2 rounded-lg bg-madoo-bg-2 p-3 shadow-madoo-border">
                <code className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[12px] text-madoo-ink-muted">
                  {latestInviteUrl}
                </code>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    void navigator.clipboard.writeText(latestInviteUrl);
                    toast({ tone: "success", title: "Invite link copied" });
                  }}
                >
                  Copy
                </Button>
              </div>
            ) : null}

            <div className="grid gap-2">
              {invites.length === 0 ? (
                <p className="text-(length:--font-size-base) text-madoo-ink-muted">
                  No pending invites.
                </p>
              ) : (
                invites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-madoo-bg-2 p-3 shadow-madoo-border"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-(length:--font-size-base) font-medium leading-none text-madoo-ink">
                        {invite.email ?? "Link invite"}
                      </p>
                      <p className="mt-1 text-(length:--font-size-sm) leading-none text-madoo-ink-muted">
                        {invite.role} · expires {formatDate(invite.expiresAt)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => void copyInvite(invite)}
                      >
                        Copy
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={
                          deleteInviteMutation.isPending ||
                          Boolean(invite.acceptedAt)
                        }
                        onClick={() => deleteInviteMutation.mutate(invite.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </SettingsCard>
      </div>
    );
  }

  if (section === "danger") {
    return (
      <SettingsCard>
        <div className="grid gap-4">
          <div className="rounded-lg bg-madoo-bg-2 p-4 shadow-madoo-border">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-(length:--font-size-base) font-medium leading-none text-madoo-ink">
                  Leave {activeWorkspace.name}
                </p>
                <p className="mt-2 max-w-xl text-(length:--font-size-sm) leading-5 text-madoo-ink-muted">
                  Owners can leave only when another owner remains.
                </p>
              </div>
              <Button
                size="md"
                variant="secondary"
                disabled={leaveWorkspaceMutation.isPending}
                onClick={() => leaveWorkspaceMutation.mutate()}
              >
                Leave workspace
              </Button>
            </div>
          </div>

          <div className="rounded-lg bg-[color-mix(in_srgb,var(--danger)_7%,var(--surface))] p-4 shadow-(--shadow-border-danger)">
            <div className="grid gap-4">
              <div>
                <p className="text-(length:--font-size-base) font-medium leading-none text-madoo-ink">
                  Delete {activeWorkspace.name}
                </p>
                <p className="mt-2 max-w-xl text-(length:--font-size-sm) leading-5 text-madoo-ink-muted">
                  Type workspace slug to confirm: {activeWorkspace.slug}
                </p>
              </div>
              <div className="grid max-w-md gap-3">
                <Input
                  label="Workspace slug"
                  value={deleteConfirm}
                  onChange={(event) => setDeleteConfirm(event.currentTarget.value)}
                />
                <Button
                  size="md"
                  variant="danger"
                  className="w-max"
                  disabled={
                    activeRole !== "OWNER" ||
                    deleteConfirm !== activeWorkspace.slug ||
                    deleteWorkspaceMutation.isPending
                  }
                  onClick={() => deleteWorkspaceMutation.mutate()}
                >
                  Delete workspace
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SettingsCard>
    );
  }

  return (
    <SettingsCard>
      <div className="grid max-w-xl gap-4">
        <Input
          label="Workspace name"
          value={workspaceName}
          disabled={!admin}
          onChange={(event) => setWorkspaceName(event.currentTarget.value)}
        />
        <Input
          label="Workspace URL slug"
          value={workspaceSlug}
          disabled={!admin}
          onChange={(event) => setWorkspaceSlug(event.currentTarget.value)}
        />
        <Button
          size="md"
          className="w-max"
          disabled={
            !admin ||
            updateWorkspaceMutation.isPending ||
            (!workspaceName.trim() && !workspaceSlug.trim())
          }
          onClick={() => {
            const nextName = workspaceName.trim();
            const nextSlug = workspaceSlug.trim();
            updateWorkspaceMutation.mutate({
              ...(nextName ? { name: nextName } : {}),
              ...(nextSlug ? { slug: nextSlug } : {}),
            });
          }}
        >
          Save workspace
        </Button>
      </div>
    </SettingsCard>
  );
}

function MemberRow({
  member,
  currentUserId,
  canEditRoles,
  canRemove,
  disabled,
  onRoleChange,
  onRemove,
}: {
  member: WorkspaceMember;
  currentUserId?: string;
  canEditRoles: boolean;
  canRemove: boolean;
  disabled: boolean;
  onRoleChange: (role: Role) => void;
  onRemove: () => void;
}) {
  const isSelf = member.userId === currentUserId;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-madoo-bg-2 p-3 shadow-madoo-border">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar
          name={member.name ?? member.email}
          src={member.avatarUrl ?? undefined}
          size="md"
          circle
        />
        <div className="min-w-0">
          <p className="truncate text-(length:--font-size-base) font-medium leading-none text-madoo-ink">
            {member.name ?? member.email}
          </p>
          <p className="mt-1 truncate text-(length:--font-size-sm) leading-none text-madoo-ink-muted">
            {member.email}
          </p>
        </div>
        {isSelf ? <Badge tone="neutral">You</Badge> : null}
      </div>
      <div className="flex items-center gap-2">
        <NativeSelect
          aria-label="Member role"
          value={member.role}
          options={memberRoleOptions}
          selectSize="sm"
          disabled={!canEditRoles || disabled}
          onChange={(event) => onRoleChange(event.currentTarget.value as Role)}
        />
        <Button
          size="sm"
          variant="ghost"
          disabled={!canRemove || member.role === "OWNER" || disabled}
          onClick={onRemove}
        >
          Remove
        </Button>
      </div>
    </div>
  );
}

function SupportPanel({
  activeWorkspace,
}: {
  activeWorkspace: MyWorkspace | null;
}) {
  const { toast } = useToast();
  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    staleTime: 60_000,
  });
  const [contactEmail, setContactEmail] = useState("");
  const [category, setCategory] = useState<SupportCategory>("WORKSPACE");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [ticketId, setTicketId] = useState("");

  useEffect(() => {
    if (user?.email) setContactEmail(user.email);
  }, [user?.email]);

  const supportMutation = useMutation({
    mutationFn: createSupportTicket,
    onSuccess: (ticket) => {
      posthog.capture("support_ticket_submitted", {
        ticket_id: ticket.id,
        category,
      });
      setTicketId(ticket.id);
      setSubject("");
      setMessage("");
      toast({ tone: "success", title: "Support request sent" });
    },
    onError: (error) => {
      toast({
        tone: "danger",
        title: "Support request failed",
        body: getErrorMessage(error, "Try again."),
      });
    },
  });

  return (
    <SettingsCard description="Tell us what's going on — pick a category and we'll route it to the right place.">
      <div className="grid gap-4">
        {ticketId ? (
          <div className="flex items-start gap-2.5 rounded-lg bg-madoo-bg-2 p-3.5 shadow-madoo-border">
            <span className="mt-0.5 text-madoo-accent-deep" aria-hidden="true">
              <Icon name="check" size={16} />
            </span>
            <div className="min-w-0">
              <p className="text-(length:--font-size-base) font-medium leading-none text-madoo-ink">
                Request sent
              </p>
              <p className="mt-1.5 text-(length:--font-size-sm) leading-snug text-madoo-ink-muted">
                Ticket {ticketId} — we usually reply in the same day you talk to us.
              </p>
            </div>
          </div>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Contact email"
            value={contactEmail}
            onChange={(event) => setContactEmail(event.currentTarget.value)}
          />
          <NativeSelect
            label="Category"
            value={category}
            options={supportCategoryOptions}
            onChange={(event) =>
              setCategory(event.currentTarget.value as SupportCategory)
            }
          />
        </div>
        <Input
          label="Subject"
          placeholder="Example: I cannot export a template"
          value={subject}
          onChange={(event) => setSubject(event.currentTarget.value)}
        />
        <Textarea
          label="What do you need help with?"
          placeholder="Share what happened, what you expected, and any project/template involved."
          rows={6}
          noResize
          value={message}
          onChange={(event) => setMessage(event.currentTarget.value)}
        />
        <div className="flex items-center justify-between gap-3">
          <p className="text-(length:--font-size-xs) text-madoo-ink-muted">
            We generally respond the same day you speak to us.
          </p>
          <Button
            size="md"
            disabled={
              supportMutation.isPending ||
              !contactEmail.trim() ||
              subject.trim().length < 3 ||
              message.trim().length < 10
            }
            onClick={() =>
              supportMutation.mutate({
                contactEmail: contactEmail.trim(),
                category,
                subject: subject.trim(),
                message: message.trim(),
                workspaceId: activeWorkspace?.id,
              })
            }
          >
            {supportMutation.isPending ? "Sending…" : "Send request"}
          </Button>
        </div>
      </div>
    </SettingsCard>
  );
}

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
    area === "workspace" ? (activeItem.section as WorkspaceSection) : "overview";
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
