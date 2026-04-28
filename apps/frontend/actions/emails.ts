"use server";

import { FetchWrapper } from "@/lib/api/fetch-wrapper";
import {
  CreateEmailSchema,
  EditEmailSchema,
  EmailDtoSchema,
  type CreateEmailInput,
  type EditEmailInput,
  type EmailDto,
} from "@madoo/shared";

export type { CreateEmailInput, EditEmailInput, EmailDto };

export async function createEmail(input: CreateEmailInput): Promise<EmailDto> {
  const body = CreateEmailSchema.parse(input);
  const raw = await FetchWrapper<unknown>("/emails", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return EmailDtoSchema.parse(raw);
}

export async function fetchEmail(id: string): Promise<EmailDto> {
  const raw = await FetchWrapper<unknown>(`/emails/${id}`);
  return EmailDtoSchema.parse(raw);
}
