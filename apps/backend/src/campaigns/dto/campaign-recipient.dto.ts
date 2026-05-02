import { CampaignRecipientSchema, type CampaignRecipient } from "@madoo/shared";
import type { CampaignDelivery, Contact } from "@prisma/client";

type CampaignDeliveryRow = CampaignDelivery & {
  contact: Pick<Contact, "id" | "email" | "firstName" | "lastName" | "workspaceId">;
};

function toSharedDeliveryStatus(status: CampaignDelivery["status"]): CampaignRecipient["status"] {
  const map = {
    PENDING: "pending",
    SENT: "sent",
    OPENED: "opened",
    CLICKED: "clicked",
    BOUNCED: "bounced",
    UNSUBSCRIBED: "unsubscribed",
    COMPLAINED: "complained",
  } as const satisfies Record<CampaignDelivery["status"], CampaignRecipient["status"]>;
  return map[status];
}

export function toCampaignRecipientDto(row: CampaignDeliveryRow): CampaignRecipient {
  return CampaignRecipientSchema.parse({
    deliveryId: row.id,
    contactId: row.contactId,
    email: row.contact.email,
    firstName: row.contact.firstName,
    lastName: row.contact.lastName,
    status: toSharedDeliveryStatus(row.status),
    sentAt: row.sentAt?.toISOString(),
  });
}
