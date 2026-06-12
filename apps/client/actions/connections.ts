"use server";

import { FetchWrapper } from "@/lib/api/fetch-wrapper";
import {
  AuthorizeUrlResponseSchema,
  CreateDraftResponseSchema,
  ProviderConnectionListSchema,
  type AuthorizeUrlResponse,
  type ConnectionProvider,
  type CreateDraftResponse,
  type ProviderConnectionDto,
} from "@madoo/shared";

export type {
  ConnectionProvider,
  CreateDraftResponse,
  ProviderConnectionDto,
} from "@madoo/shared";

export async function fetchConnections(): Promise<ProviderConnectionDto[]> {
  const raw = await FetchWrapper<ProviderConnectionDto[]>("/connections");
  return ProviderConnectionListSchema.parse(raw);
}

export async function getConnectionAuthorizeUrl(
  provider: ConnectionProvider,
): Promise<AuthorizeUrlResponse> {
  const raw = await FetchWrapper<AuthorizeUrlResponse>(
    `/connections/${provider}/authorize-url`,
  );
  return AuthorizeUrlResponseSchema.parse(raw);
}

export async function disconnectConnection(
  provider: ConnectionProvider,
): Promise<void> {
  await FetchWrapper(`/connections/${provider}`, { method: "DELETE" });
}

export async function createGmailDraft(
  emailId: string,
  variantId?: string,
): Promise<CreateDraftResponse> {
  const raw = await FetchWrapper<CreateDraftResponse>(
    `/emails/${emailId}/export/gmail-draft`,
    { method: "POST", body: JSON.stringify({ variantId }) },
  );
  return CreateDraftResponseSchema.parse(raw);
}

export async function createOutlookDraft(
  emailId: string,
  variantId?: string,
): Promise<CreateDraftResponse> {
  const raw = await FetchWrapper<CreateDraftResponse>(
    `/emails/${emailId}/export/outlook-draft`,
    { method: "POST", body: JSON.stringify({ variantId }) },
  );
  return CreateDraftResponseSchema.parse(raw);
}
