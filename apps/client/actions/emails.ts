"use server";

import { FetchWrapper } from "@/lib/api/fetch-wrapper";
import {
  CreateEmailFromTemplateSchema,
  CreateEmailSchema,
  EmailChatMessageDtoSchema,
  EmailDtoSchema,
  RenameEmailSchema,
  TransferEmailSchema,
  UpdateEmailVariantVariableSchemaSchema,
  type CreateEmailFromTemplateInput,
  type CreateEmailInput,
  type EditEmailInput,
  type EmailChatMessageDto,
  type EmailDto,
  type RenameEmailInput,
  type TransferEmailInput,
  type UpdateEmailVariantVariableSchemaInput,
} from "@madoo/shared";
import { z } from "zod";

export type {
  CreateEmailFromTemplateInput,
  CreateEmailInput,
  EditEmailInput,
  EmailChatMessageDto,
  EmailDto,
  RenameEmailInput,
  TransferEmailInput,
  UpdateEmailVariantVariableSchemaInput,
} from "@madoo/shared";

const EmailListDtoSchema = z.array(EmailDtoSchema);
const EmailChatMessageListSchema = z.array(EmailChatMessageDtoSchema);

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

export async function fetchEmailChat(
  id: string,
): Promise<EmailChatMessageDto[]> {
  const raw = await FetchWrapper<unknown>(`/emails/${id}/chat`);
  return EmailChatMessageListSchema.parse(raw);
}

export async function fetchEmails(): Promise<EmailDto[]> {
  const raw = await FetchWrapper<unknown>("/emails");
  return EmailListDtoSchema.parse(raw);
}

export async function deleteEmail(emailId: string): Promise<void> {
  await FetchWrapper<unknown>(`/emails/${emailId}`, { method: "DELETE" });
}

export async function renameEmail(
  emailId: string,
  input: RenameEmailInput,
): Promise<EmailDto> {
  const body = RenameEmailSchema.parse(input);
  const raw = await FetchWrapper<unknown>(`/emails/${emailId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return EmailDtoSchema.parse(raw);
}

export async function transferEmail(
  emailId: string,
  input: TransferEmailInput,
): Promise<EmailDto> {
  const body = TransferEmailSchema.parse(input);
  const raw = await FetchWrapper<unknown>(`/emails/${emailId}/transfer`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return EmailDtoSchema.parse(raw);
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
