"use server";

import { FetchWrapper } from "@/lib/api/fetch-wrapper";
import {
  SendTestEmailInputSchema,
  SendTestEmailResponseSchema,
  type SendTestEmailInput,
  type SendTestEmailResponse,
} from "@madoo/shared";

export async function sendTestEmail(
  emailId: string,
  input: SendTestEmailInput,
): Promise<SendTestEmailResponse> {
  const body = SendTestEmailInputSchema.parse(input);
  const raw = await FetchWrapper<unknown>(`/emails/${emailId}/test/send`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return SendTestEmailResponseSchema.parse(raw);
}
