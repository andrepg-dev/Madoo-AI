"use server";

import { FetchWrapper } from "@/lib/api/fetch-wrapper";
import { WORKSPACE_COOKIE, WORKSPACE_COOKIE_OPTIONS } from "@/lib/cookies";
import {
  CreateWorkspaceInputSchema,
  CreateWorkspaceInviteInputSchema,
  MyWorkspaceSchema,
  UpdateMemberRoleInputSchema,
  UpdateWorkspaceInputSchema,
  WorkspaceInviteSchema,
  WorkspaceMemberSchema,
  WorkspaceSchema,
  type CreateWorkspaceInput,
  type CreateWorkspaceInviteInput,
  type MyWorkspace,
  type UpdateMemberRoleInput,
  type UpdateWorkspaceInput,
  type Workspace,
  type WorkspaceInvite,
  type WorkspaceMember,
} from "@madoo/shared";
import { cookies } from "next/headers";
import { z } from "zod";

const MyWorkspacesResponseSchema = z.array(MyWorkspaceSchema);
const WorkspaceMembersResponseSchema = z.array(WorkspaceMemberSchema);
const WorkspaceInvitesResponseSchema = z.array(WorkspaceInviteSchema);

export type {
  CreateWorkspaceInput,
  CreateWorkspaceInviteInput,
  MyWorkspace,
  UpdateMemberRoleInput,
  UpdateWorkspaceInput,
  Workspace,
  WorkspaceInvite,
  WorkspaceMember,
} from "@madoo/shared";

export async function fetchWorkspaces(): Promise<MyWorkspace[]> {
  const raw = await FetchWrapper<MyWorkspace[]>("/workspaces/me");
  return MyWorkspacesResponseSchema.parse(raw);
}

export async function createWorkspace(
  input: CreateWorkspaceInput,
): Promise<MyWorkspace> {
  const body = CreateWorkspaceInputSchema.parse(input);
  const raw = await FetchWrapper<MyWorkspace>("/workspaces", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return MyWorkspaceSchema.parse(raw);
}

export async function setActiveWorkspace(workspaceId: string): Promise<void> {
  const jar = await cookies();
  jar.set(WORKSPACE_COOKIE, workspaceId, WORKSPACE_COOKIE_OPTIONS);
}

export async function updateCurrentWorkspace(
  input: UpdateWorkspaceInput,
): Promise<Workspace> {
  const body = UpdateWorkspaceInputSchema.parse(input);
  const raw = await FetchWrapper<Workspace>("/workspaces/current", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return WorkspaceSchema.parse(raw);
}

export async function uploadWorkspaceAvatar(
  formData: FormData,
): Promise<Workspace> {
  const raw = await FetchWrapper<Workspace>("/workspaces/current/avatar", {
    method: "POST",
    body: formData,
  });
  return WorkspaceSchema.parse(raw);
}

export async function deleteCurrentWorkspace(): Promise<void> {
  await FetchWrapper<void>("/workspaces/current", { method: "DELETE" });
}

export async function leaveCurrentWorkspace(): Promise<void> {
  await FetchWrapper<void>("/workspaces/current/leave", { method: "POST" });
}

export async function fetchWorkspaceMembers(): Promise<WorkspaceMember[]> {
  const raw = await FetchWrapper<WorkspaceMember[]>(
    "/workspaces/current/members",
  );
  return WorkspaceMembersResponseSchema.parse(raw);
}

export async function updateWorkspaceMemberRole(
  userId: string,
  input: UpdateMemberRoleInput,
): Promise<WorkspaceMember> {
  const body = UpdateMemberRoleInputSchema.parse(input);
  const raw = await FetchWrapper<WorkspaceMember>(
    `/workspaces/current/members/${encodeURIComponent(userId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
  );
  return WorkspaceMemberSchema.parse(raw);
}

export async function removeWorkspaceMember(userId: string): Promise<void> {
  await FetchWrapper<void>(
    `/workspaces/current/members/${encodeURIComponent(userId)}`,
    { method: "DELETE" },
  );
}

export async function fetchWorkspaceInvites(): Promise<WorkspaceInvite[]> {
  const raw = await FetchWrapper<WorkspaceInvite[]>(
    "/workspaces/current/invites",
  );
  return WorkspaceInvitesResponseSchema.parse(raw);
}

export async function createWorkspaceInvite(
  input: CreateWorkspaceInviteInput,
): Promise<WorkspaceInvite> {
  const body = CreateWorkspaceInviteInputSchema.parse(input);
  const raw = await FetchWrapper<WorkspaceInvite>("/workspaces/current/invites", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return WorkspaceInviteSchema.parse(raw);
}

export async function deleteWorkspaceInvite(inviteId: string): Promise<void> {
  await FetchWrapper<void>(
    `/workspaces/current/invites/${encodeURIComponent(inviteId)}`,
    { method: "DELETE" },
  );
}
