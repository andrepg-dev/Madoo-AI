"use server";

import { FetchWrapper } from "@/lib/api/fetch-wrapper";
import { WORKSPACE_COOKIE, WORKSPACE_COOKIE_OPTIONS } from "@/lib/cookies";
import {
  AcceptWorkspaceInviteResponseSchema,
  WorkspaceInvitePreviewSchema,
  type AcceptWorkspaceInviteResponse,
  type WorkspaceInvitePreview,
} from "@madoo/shared";
import { cookies } from "next/headers";

export type {
  AcceptWorkspaceInviteResponse,
  WorkspaceInvitePreview,
} from "@madoo/shared";

export async function fetchInvitePreview(
  token: string,
): Promise<WorkspaceInvitePreview> {
  const raw = await FetchWrapper<WorkspaceInvitePreview>(
    `/invites/${encodeURIComponent(token)}`,
  );
  return WorkspaceInvitePreviewSchema.parse(raw);
}

export async function acceptInvite(
  token: string,
): Promise<AcceptWorkspaceInviteResponse> {
  const raw = await FetchWrapper<AcceptWorkspaceInviteResponse>(
    `/invites/${encodeURIComponent(token)}/accept`,
    { method: "POST" },
  );
  const parsed = AcceptWorkspaceInviteResponseSchema.parse(raw);
  const jar = await cookies();
  jar.set(WORKSPACE_COOKIE, parsed.workspace.id, WORKSPACE_COOKIE_OPTIONS);
  return parsed;
}
