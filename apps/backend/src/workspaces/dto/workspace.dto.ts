import {
  MyWorkspaceSchema,
  WorkspaceSchema,
  type MyWorkspace,
  type Workspace as SharedWorkspace,
} from "@madoo/shared";
import type { Membership, Workspace } from "@prisma/client";

export type WorkspaceDto = SharedWorkspace;

export type MyWorkspaceDto = MyWorkspace;

export function toWorkspaceDto(w: Workspace): WorkspaceDto {
  return WorkspaceSchema.parse({
    id: w.id,
    name: w.name,
    slug: w.slug,
    postalAddress: w.postalAddress ?? undefined,
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
