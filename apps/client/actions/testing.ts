"use server";

import { FetchWrapper } from "@/lib/api/fetch-wrapper";
import {
  SendTestEmailInputSchema,
  SendTestEmailResponseSchema,
  TestLinksResponseSchema,
  TestSpamResponseSchema,
  type SendTestEmailInput,
  type SendTestEmailResponse,
  type TestLinksResponse,
  type TestSpamResponse,
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

export async function testEmailLinks(
  emailId: string,
): Promise<TestLinksResponse> {
  const raw = await FetchWrapper<unknown>(`/emails/${emailId}/test/links`, {
    method: "POST",
  });
  return TestLinksResponseSchema.parse(raw);
}

export async function testEmailSpam(
  emailId: string,
): Promise<TestSpamResponse> {
  const raw = await FetchWrapper<unknown>(`/emails/${emailId}/test/spam`, {
    method: "POST",
  });
  return TestSpamResponseSchema.parse(raw);
}
