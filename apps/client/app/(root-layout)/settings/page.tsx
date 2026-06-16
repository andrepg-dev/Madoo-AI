"use client";

import { getMe, updateMe, uploadAvatar } from "@/actions/auth";
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
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type SettingsArea = "account" | "workspace" | "support";
type AccountSection = "profile" | "sound";
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
  icon: "user" | "lock" | "bell" | "settings" | "image" | "copy";
};

const primaryNav: PrimaryNavItem[] = [
  {
    area: "account",
    label: "User settings",
    description: "Profile and product preferences",
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
  { value: "sound", label: "Complete sound", icon: "bell" },
];

const workspaceNav: SecondaryNavItem[] = [
  { value: "overview", label: "Workspace name", icon: "settings" },
  { value: "avatar", label: "Avatar", icon: "image" },
  { value: "members", label: "Membership", icon: "copy" },
  { value: "danger", label: "Danger zone", icon: "lock" },
];

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
  return value === "profile" || value === "sound";
}

function isWorkspaceSection(value: string | null): value is WorkspaceSection {
  return (
    value === "overview" ||
    value === "avatar" ||
    value === "members" ||
    value === "danger"
  );
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
        "flex w-full cursor-pointer items-center gap-2.5 rounded-lg border-0 bg-transparent px-3 py-2.5 text-left font-madoo-sans no-underline transition-[background,color,box-shadow]",
        active
          ? "bg-madoo-surface text-madoo-ink bg-white shadow-madoo-border"
          : "text-madoo-ink-soft hover:bg-madoo-surface-2 hover:text-madoo-ink",
      )}
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-madoo-bg-2 shadow-madoo-border">
        <Icon name={icon} size={15} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-(length:--font-size-base) font-medium leading-none">
          {label}
        </span>
        {description ? (
          <span className="mt-1 block truncate text-(length:--font-size-xs) leading-none text-madoo-ink-muted">
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
        "flex h-9 w-full cursor-pointer items-center gap-2 rounded-lg border-0 px-2.5 font-madoo-sans text-(length:--font-size-base) no-underline transition-[background,color,box-shadow]",
        active
          ? "bg-madoo-surface text-madoo-ink shadow-madoo-border"
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
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="rounded-[20px]! p-5!">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold leading-none text-madoo-ink">
            {title}
          </h2>
          {description ? (
            <p className="mt-2 text-(length:--font-size-sm) leading-5 text-madoo-ink-muted">
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

  if (section === "sound") {
    const saveSound = (next: SoundPref) => {
      setSound(next);
      saveSoundPref(next);
    };

    return (
      <SettingsCard
        title="Completion sound"
        description="Choose how Madoo notifies you when generation completes."
      >
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
    <SettingsCard
      title="User profile"
      description="Change display name and account avatar."
    >
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
      <SettingsCard
        title="Workspace avatar"
        description="Set identity shown in navigation."
      >
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
        <SettingsCard
          title="Members"
          description="Manage workspace access and roles."
        >
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
      <SettingsCard
        title="Danger zone"
        description="Permanent workspace actions with backend ownership checks."
      >
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
    <SettingsCard
      title="Workspace name"
      description="Rename active workspace and edit its URL slug."
    >
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
    <SettingsCard
      title="Contact support"
      description="Send account, workspace, billing, generation, or export context to support."
    >
      <div className="grid max-w-2xl gap-4">
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
        {ticketId ? (
          <p className="text-(length:--font-size-sm) text-madoo-ink-muted">
            Ticket submitted: {ticketId}
          </p>
        ) : null}
        <Button
          size="md"
          className="w-max"
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
          Send request
        </Button>
      </div>
    </SettingsCard>
  );
}

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const workspaceId = useClientStore((state) => state.workspaceId);
  const setWorkspaceId = useClientStore((state) => state.setWorkspaceId);
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
  const activePrimary =
    primaryNav.find((item) => item.area === area) ?? primaryNav[0];
  const secondaryNav =
    area === "account" ? accountNav : area === "workspace" ? workspaceNav : [];
  const activeSecondary =
    area === "account"
      ? accountSection
      : area === "workspace"
        ? workspaceSection
        : "";

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
    <div className="grid min-h-full grid-cols-[280px_260px_minmax(0,1fr)] font-madoo-sans text-madoo-ink max-xl:grid-cols-[250px_minmax(0,1fr)] max-lg:grid-cols-1">
      <aside className="p-4 shadow-[inset_-0.5px_0_0_rgb(var(--rule-rgb)/0.18)] max-lg:shadow-(--shadow-border-bottom-soft)">
        <div className="space-y-5">
          <div>
            <div className="mb-2 px-3 text-(length:--font-size-xs) font-medium uppercase leading-none tracking-[0.08em] text-madoo-ink-muted">
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

      <aside className="p-4 max-xl:hidden">
        <div className="mb-4 flex items-center gap-3">
          <Avatar
            name={activePrimary.label}
            size="md"
            tone={area === "account" ? "ink" : "accent"}
          />
          <div className="min-w-0">
            <p className="truncate text-(length:--font-size-base) font-medium leading-none">
              {activePrimary.label}
            </p>
            <p className="mt-1 truncate text-(length:--font-size-sm) leading-none text-madoo-ink-muted">
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
            <div className="hidden max-xl:flex max-w-full gap-1 overflow-x-auto rounded-full bg-madoo-surface-2/35 p-1 shadow-madoo-border">
              {secondaryNav.map((item) => (
                <Link
                  key={item.value}
                  href={getSettingsHref(area, item.value)}
                  aria-current={
                    activeSecondary === item.value ? "page" : undefined
                  }
                  className={cx(
                    "whitespace-nowrap rounded-full px-3 py-1.5 font-madoo-sans text-[12.5px] font-medium no-underline transition-colors",
                    activeSecondary === item.value
                      ? "bg-madoo-surface text-madoo-ink shadow-madoo-border"
                      : "text-madoo-ink-muted hover:text-madoo-ink",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          ) : null}

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
