import { AuditLogEntrySchema, type AuditLogEntry } from "@madoo/shared";
import type { AuditLog as PrismaAuditLog } from "@prisma/client";

export type AuditLogEntryDto = AuditLogEntry;

function payloadToRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

export function toAuditLogDto(row: PrismaAuditLog): AuditLogEntryDto {
  return AuditLogEntrySchema.parse({
    id: row.id,
    workspaceId: row.workspaceId,
    action: row.action,
    actorUserId: row.actorUserId,
    payload: payloadToRecord(row.payload),
    createdAt: row.createdAt.toISOString(),
  });
}
