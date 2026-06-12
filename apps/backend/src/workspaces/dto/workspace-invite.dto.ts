import {
  AcceptWorkspaceInviteResponseSchema,
  WorkspaceInvitePreviewSchema,
  WorkspaceInviteSchema,
  type AcceptWorkspaceInviteResponse,
  type WorkspaceInvite,
  type WorkspaceInvitePreview,
} from "@madoo/shared";
import type {
  Membership,
  User,
  Workspace,
  WorkspaceInvite as PrismaWorkspaceInvite,
} from "@prisma/client";
import { toMyWorkspaceDto } from "./workspace.dto";

type InviteWithRelations = PrismaWorkspaceInvite & {
  invitedBy: User;
  acceptedBy: User | null;
};

export function toWorkspaceInviteDto(
  invite: InviteWithRelations,
  inviteUrl: string,
): WorkspaceInvite {
  return WorkspaceInviteSchema.parse({
    id: invite.id,
    workspaceId: invite.workspaceId,
    email: invite.email,
    role: invite.role,
    token: invite.token,
    inviteUrl,
    invitedBy: toInviteUser(invite.invitedBy),
    acceptedBy: invite.acceptedBy ? toInviteUser(invite.acceptedBy) : null,
    expiresAt: invite.expiresAt.toISOString(),
    acceptedAt: invite.acceptedAt?.toISOString() ?? null,
    createdAt: invite.createdAt.toISOString(),
  });
}

export function toWorkspaceInvitePreviewDto(
  invite: PrismaWorkspaceInvite & { workspace: Workspace; invitedBy: User },
): WorkspaceInvitePreview {
  return WorkspaceInvitePreviewSchema.parse({
    token: invite.token,
    workspace: {
      id: invite.workspace.id,
      name: invite.workspace.name,
      slug: invite.workspace.slug,
      avatarUrl: invite.workspace.avatarUrl,
    },
    inviter: toInviteUser(invite.invitedBy),
    email: invite.email,
    role: invite.role,
    expiresAt: invite.expiresAt.toISOString(),
    acceptedAt: invite.acceptedAt?.toISOString() ?? null,
  });
}

export function toAcceptWorkspaceInviteResponseDto(
  workspace: Workspace,
  membership: Membership,
): AcceptWorkspaceInviteResponse {
  return AcceptWorkspaceInviteResponseSchema.parse({
    workspace: toMyWorkspaceDto(workspace, membership),
  });
}

function toInviteUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
}
