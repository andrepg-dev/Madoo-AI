import { ContactSchema, type Contact } from "@madoo/shared";
import type { Contact as PrismaContact, Tag as PrismaTag } from "@prisma/client";

function jsonToStringRecord(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === "string") out[key] = value;
  }
  return out;
}

function toSharedStatus(status: PrismaContact["status"]): Contact["status"] {
  if (status === "UNSUBSCRIBED") return "unsubscribed";
  if (status === "BOUNCED") return "bounced";
  if (status === "COMPLAINED") return "complained";
  return "active";
}

export type ContactDto = Contact;

type ContactWithOptionalTags = PrismaContact & {
  tags?: Array<{
    tag: PrismaTag;
  }>;
};

export function toContactDto(contact: ContactWithOptionalTags): ContactDto {
  return ContactSchema.parse({
    id: contact.id,
    workspaceId: contact.workspaceId,
    email: contact.email,
    firstName: contact.firstName ?? undefined,
    lastName: contact.lastName ?? undefined,
    status: toSharedStatus(contact.status),
    customFields: jsonToStringRecord(contact.customFields),
    tags: (contact.tags ?? []).map(({ tag }) => ({
      id: tag.id,
      workspaceId: tag.workspaceId,
      name: tag.name,
      color: tag.color ?? undefined,
    })),
    createdAt: contact.createdAt.toISOString(),
    updatedAt: contact.updatedAt.toISOString(),
  });
}
