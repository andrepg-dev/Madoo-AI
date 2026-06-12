import {
  MyWorkspaceSchema,
  WorkspaceMemberSchema,
  WorkspaceSchema,
  type MyWorkspace,
  type Workspace as SharedWorkspace,
  type WorkspaceMember,
} from "@madoo/shared";
import type { Membership, User, Workspace } from "@prisma/client";

export type WorkspaceDto = SharedWorkspace;

export type MyWorkspaceDto = MyWorkspace;

export type WorkspaceMemberDto = WorkspaceMember;

export function toWorkspaceDto(w: Workspace): WorkspaceDto {
  return WorkspaceSchema.parse({
    id: w.id,
    name: w.name,
    slug: w.slug,
    avatarUrl: w.avatarUrl,
    templateCreationReason: w.templateCreationReason ?? undefined,
    createdAt: w.createdAt.toISOString(),
    updatedAt: w.updatedAt.toISOString(),
  });
}

export function toMyWorkspaceDto(
  w: Workspace,
  m: Pick<Membership, "role">,
): MyWorkspaceDto {
  return MyWorkspaceSchema.parse({ ...toWorkspaceDto(w), role: m.role });
}

export function toWorkspaceMemberDto(
  m: Membership & { user: User },
): WorkspaceMemberDto {
  return WorkspaceMemberSchema.parse({
    userId: m.userId,
    email: m.user.email,
    name: m.user.name,
    avatarUrl: m.user.avatarUrl,
    role: m.role,
    joinedAt: m.createdAt.toISOString(),
  });
}
