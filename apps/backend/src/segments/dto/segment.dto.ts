import {
  SegmentSchema,
  SegmentQuerySchema,
  type Segment,
  type SegmentQuery,
} from "@madoo/shared";
import type { Segment as PrismaSegment } from "@prisma/client";

export type SegmentDto = Segment;

export function toSegmentDto(segment: PrismaSegment): SegmentDto {
  return SegmentSchema.parse({
    id: segment.id,
    workspaceId: segment.workspaceId,
    name: segment.name,
    query: SegmentQuerySchema.parse(segment.query),
    createdAt: segment.createdAt.toISOString(),
  });
}

export type SegmentPreviewDto = {
  count: number;
  sampleContacts: import("../../contacts/dto/contact.dto").ContactDto[];
};

export type ParsedSegmentQuery = SegmentQuery;
