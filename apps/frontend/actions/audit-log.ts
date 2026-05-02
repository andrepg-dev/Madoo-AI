import { z } from "zod";
import { AuditLogEntrySchema, type AuditLogEntry } from "@madoo/shared";
import { fetcher } from "@/lib/fetch";

const AuditLogListSchema = z.array(AuditLogEntrySchema);

export const auditLogKeys = {
  all: ["audit-log"] as const,
  list: () => [...auditLogKeys.all, "list"] as const,
};

export type { AuditLogEntry };

export const auditLogApi = {
  list: async (): Promise<AuditLogEntry[]> => {
    const raw = await fetcher.get<unknown>("/audit-logs");
    return AuditLogListSchema.parse(raw);
  },
};
