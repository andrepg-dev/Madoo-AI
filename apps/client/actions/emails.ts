"use server";

import { FetchWrapper } from "@/lib/api/fetch-wrapper";
import {
  CreateEmailFromTemplateSchema,
  CreateEmailSchema,
  EmailChatMessageDtoSchema,
  EmailDtoSchema,
  EmailRatingDtoSchema,
  EmailRatingInputSchema,
  EmailShareDtoSchema,
  PublicEmailDtoSchema,
  RenameEmailSchema,
  SetEmailChatMessageFeedbackSchema,
  SetEmailStarredSchema,
  TransferEmailSchema,
  UpdateEmailShareSchema,
  UpdateEmailVariantVariableSchemaSchema,
  type CreateEmailFromTemplateInput,
  type CreateEmailInput,
  type EditEmailInput,
  type EmailChatMessageDto,
  type EmailDto,
  type EmailRatingDto,
  type EmailRatingInput,
  type EmailShareDto,
  type PublicEmailDto,
  type RenameEmailInput,
  type SetEmailChatMessageFeedbackInput,
  type TransferEmailInput,
  type UpdateEmailShareInput,
  type UpdateEmailVariantVariableSchemaInput,
} from "@madoo/shared";
import { z } from "zod";

export type {
  CreateEmailFromTemplateInput,
  CreateEmailInput,
  EditEmailInput,
  EmailChatMessageDto,
  EmailDto,
  EmailRatingDto,
  EmailRatingInput,
  EmailShareDto,
  PublicEmailDto,
  RenameEmailInput,
  SetEmailChatMessageFeedbackInput,
  TransferEmailInput,
  UpdateEmailShareInput,
  UpdateEmailVariantVariableSchemaInput,
} from "@madoo/shared";

const EmailListDtoSchema = z.array(EmailDtoSchema);
const EmailChatMessageListSchema = z.array(EmailChatMessageDtoSchema);
const NullableEmailRatingDtoSchema = EmailRatingDtoSchema.nullable();

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

// NOTE: image upload moved to the `/api/emails/[id]/images` route handler +
// `@/lib/upload-email-image` client helper. Server Actions silently failed to
// reach the backend in production, so the multipart upload never landed.

export async function truncateEmailChat(
  emailId: string,
  from: string,
): Promise<void> {
  await FetchWrapper<unknown>(`/emails/${emailId}/chat/truncate`, {
    method: "POST",
    body: JSON.stringify({ from }),
  });
}

export async function setEmailChatMessageFeedback(
  emailId: string,
  messageId: string,
  input: SetEmailChatMessageFeedbackInput,
): Promise<EmailChatMessageDto> {
  const body = SetEmailChatMessageFeedbackSchema.parse(input);
  const raw = await FetchWrapper<unknown>(
    `/emails/${emailId}/chat/${messageId}/feedback`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
  );
  return EmailChatMessageDtoSchema.parse(raw);
}

export async function getEmailRating(
  emailId: string,
): Promise<EmailRatingDto | null> {
  const raw = await FetchWrapper<unknown>(`/emails/${emailId}/rating`);
  return NullableEmailRatingDtoSchema.parse(raw);
}

export async function submitEmailRating(
  emailId: string,
  input: EmailRatingInput,
): Promise<EmailRatingDto> {
  const body = EmailRatingInputSchema.parse(input);
  const raw = await FetchWrapper<unknown>(`/emails/${emailId}/rating`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return EmailRatingDtoSchema.parse(raw);
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

export async function setEmailStarred(
  emailId: string,
  starred: boolean,
): Promise<EmailDto> {
  const body = SetEmailStarredSchema.parse({ starred });
  const raw = await FetchWrapper<unknown>(`/emails/${emailId}/star`, {
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

export async function updateEmailShare(
  emailId: string,
  input: UpdateEmailShareInput,
): Promise<EmailShareDto> {
  const body = UpdateEmailShareSchema.parse(input);
  const raw = await FetchWrapper<unknown>(`/emails/${emailId}/share`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return EmailShareDtoSchema.parse(raw);
}

/** Public, unauthenticated read for the share page. Works for logged-out viewers. */
export async function fetchPublicEmail(
  publicId: string,
): Promise<PublicEmailDto> {
  const raw = await FetchWrapper<unknown>(`/public/emails/${publicId}`);
  return PublicEmailDtoSchema.parse(raw);
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
