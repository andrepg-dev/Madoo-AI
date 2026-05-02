import type { Prisma } from "@prisma/client";
import type { SegmentQuery } from "@madoo/shared";

function toPrismaStatus(status: SegmentQuery["status"]) {
  if (status === "unsubscribed") return "UNSUBSCRIBED";
  if (status === "bounced") return "BOUNCED";
  if (status === "complained") return "COMPLAINED";
  return "ACTIVE";
}

export function buildPrismaWhere(
  workspaceId: string,
  query: SegmentQuery,
): Prisma.ContactWhereInput {
  const and: Prisma.ContactWhereInput[] = [{ workspaceId }];

  if (query.status) and.push({ status: toPrismaStatus(query.status) });
  if (query.createdAfter) and.push({ createdAt: { gte: new Date(query.createdAfter) } });
  if (query.createdBefore) and.push({ createdAt: { lte: new Date(query.createdBefore) } });
  if (query.tags && query.tags.length > 0) {
    and.push({
      tags: {
        some: {
          tagId: { in: query.tags },
        },
      },
    });
  }

  // lastOpenAfter intentionally ignored until tracking/open events exist (phase 4).
  return { AND: and };
}
