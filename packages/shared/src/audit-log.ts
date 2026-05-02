import { z } from "zod";

const IsoDateTimeSchema = z.string().datetime();

export const AuditLogEntrySchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  action: z.string().min(1),
  actorUserId: z.string().min(1),
  payload: z.record(z.string(), z.unknown()),
  createdAt: IsoDateTimeSchema,
});

export type AuditLogEntry = z.infer<typeof AuditLogEntrySchema>;
