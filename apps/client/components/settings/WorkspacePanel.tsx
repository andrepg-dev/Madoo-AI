"use client";

import {
  createWorkspaceInvite,
  deleteCurrentWorkspace,
  deleteWorkspaceInvite,
  fetchWorkspaceInvites,
  fetchWorkspaceMembers,
  leaveCurrentWorkspace,
  removeWorkspaceMember,
  setActiveWorkspace,
  updateCurrentWorkspace,
  updateWorkspaceMemberRole,
  uploadWorkspaceAvatar,
} from "@/actions/workspaces";
import { useAuthStore } from "@/stores/auth-store";
import { useClientStore } from "@/stores/client-store";
import {
  Avatar,
  Badge,
  Button,
  cx,
  NativeSelect,
  Input,
  useToast,
} from "@madoo/design-system";
import type {
  MyWorkspace,
  Role,
  WorkspaceInvite,
  WorkspaceInviteRole,
  WorkspaceMember,
} from "@madoo/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import posthog from "posthog-js";
import {
  canAdmin,
  formatDate,
  getErrorMessage,
  SettingsCard,
  type WorkspaceSection,
} from "./settings-ui";

const inviteRoleOptions = [
  { value: "MEMBER", label: "Member" },
  { value: "ADMIN", label: "Admin" },
];

const memberRoleOptions = [
  { value: "MEMBER", label: "Member" },
  { value: "ADMIN", label: "Admin" },
  { value: "OWNER", label: "Owner" },
];

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

export function WorkspacePanel({
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
                  setInviteRole(
                    event.currentTarget.value as WorkspaceInviteRole,
                  )
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
                  onChange={(event) =>
                    setDeleteConfirm(event.currentTarget.value)
                  }
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
