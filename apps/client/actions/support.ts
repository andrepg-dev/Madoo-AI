"use server";

import { FetchWrapper } from "@/lib/api/fetch-wrapper";
import {
  CreateSupportTicketInputSchema,
  SupportTicketSchema,
  type CreateSupportTicketInput,
  type SupportTicket,
} from "@madoo/shared";

export type { CreateSupportTicketInput, SupportTicket } from "@madoo/shared";

export async function createSupportTicket(
  input: CreateSupportTicketInput,
): Promise<SupportTicket> {
  const body = CreateSupportTicketInputSchema.parse(input);
  const raw = await FetchWrapper<SupportTicket>("/support/contact", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return SupportTicketSchema.parse(raw);
}
