import {
  SupportTicketSchema,
  type SupportTicket as SharedSupportTicket,
} from "@madoo/shared";
import type { SupportTicket } from "@prisma/client";

export type SupportTicketDto = SharedSupportTicket;

export function toSupportTicketDto(ticket: SupportTicket): SupportTicketDto {
  return SupportTicketSchema.parse({
    id: ticket.id,
    workspaceId: ticket.workspaceId,
    emailId: ticket.emailId,
    userId: ticket.userId,
    contactEmail: ticket.contactEmail,
    category: ticket.category,
    subject: ticket.subject,
    message: ticket.message,
    status: ticket.status,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
  });
}
