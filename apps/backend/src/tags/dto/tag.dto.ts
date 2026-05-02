import { TagSchema, type Tag } from "@madoo/shared";
import type { Tag as PrismaTag } from "@prisma/client";

export type TagDto = Tag;

export function toTagDto(tag: PrismaTag): TagDto {
  return TagSchema.parse({
    id: tag.id,
    workspaceId: tag.workspaceId,
    name: tag.name,
    color: tag.color ?? undefined,
  });
}
