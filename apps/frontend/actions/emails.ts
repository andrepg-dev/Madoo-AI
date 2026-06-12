"use server";

import { FetchWrapper } from "@/lib/api/fetch-wrapper";
import {
  CreateEmailFromTemplateSchema,
  CreateEmailSchema,
  EditEmailSchema,
  EmailDtoSchema,
  UpdateEmailVariantVariableSchemaSchema,
  type CreateEmailFromTemplateInput,
  type CreateEmailInput,
  type EditEmailInput,
  type EmailDto,
  type UpdateEmailVariantVariableSchemaInput,
} from "@madoo/shared";

export type {
  CreateEmailFromTemplateInput,
  CreateEmailInput,
  EditEmailInput,
  EmailDto,
  UpdateEmailVariantVariableSchemaInput,
};

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

const EmailListDtoSchema = EmailDtoSchema.array();

export async function fetchEmails(): Promise<EmailDto[]> {
  const raw = await FetchWrapper<unknown>("/emails");
  return EmailListDtoSchema.parse(raw);
}

export async function saveEmailTemplate(emailId: string): Promise<void> {
  await FetchWrapper<unknown>(`/emails/${emailId}/save`, { method: "POST" });
}

export async function updateEmailVariantVariableSchema(
  emailId: string,
  variantId: string,
  input: UpdateEmailVariantVariableSchemaInput,
): Promise<EmailDto> {
  const body = UpdateEmailVariantVariableSchemaSchema.parse(input);
  const raw = await FetchWrapper<unknown>(
    `/emails/${emailId}/variants/${variantId}/variable-schema`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
  );
  return EmailDtoSchema.parse(raw);
}

export async function createEmailFromTemplate(
  input: CreateEmailFromTemplateInput,
): Promise<EmailDto> {
  const body = CreateEmailFromTemplateSchema.parse(input);
  const raw = await FetchWrapper<unknown>("/emails/from-template", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return EmailDtoSchema.parse(raw);
}
