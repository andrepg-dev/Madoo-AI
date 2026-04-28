import type { Workspace, Membership, Role } from "@prisma/client";

export type WorkspaceDto = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
};

export type MyWorkspaceDto = WorkspaceDto & { role: Role };

export function toWorkspaceDto(w: Workspace): WorkspaceDto {
  return {
    id: w.id,
    name: w.name,
    slug: w.slug,
    createdAt: w.createdAt.toISOString(),
    updatedAt: w.updatedAt.toISOString(),
  };
}

export function toMyWorkspaceDto(
  w: Workspace,
  m: Pick<Membership, "role">,
): MyWorkspaceDto {
  return { ...toWorkspaceDto(w), role: m.role };
}
