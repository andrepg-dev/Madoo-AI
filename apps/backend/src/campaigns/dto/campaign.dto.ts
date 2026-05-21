import { CampaignSchema, CampaignVariableMappingSchema, type Campaign } from "@madoo/shared";
import type { Campaign as PrismaCampaign } from "@prisma/client";

function toSharedStatus(status: PrismaCampaign["status"]): Campaign["status"] {
  if (status === "SCHEDULED") return "scheduled";
  if (status === "SENDING") return "sending";
  if (status === "SENT") return "sent";
  return "draft";
}

export type CampaignDto = Campaign;

export function toCampaignDto(row: PrismaCampaign): CampaignDto {
  return CampaignSchema.parse({
    id: row.id,
    workspaceId: row.workspaceId,
    emailId: row.emailId,
    segmentId: row.segmentId,
    status: toSharedStatus(row.status),
    scheduledFor: row.scheduledFor?.toISOString(),
    sentAt: row.sentAt?.toISOString(),
    fromName: row.fromName,
    fromEmail: row.fromEmail,
    replyTo: row.replyTo ?? undefined,
    abTest: row.abTest,
    variableMapping: CampaignVariableMappingSchema.catch({}).parse(row.variableMapping),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
}
