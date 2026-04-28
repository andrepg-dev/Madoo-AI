"use server";

import { FetchWrapper } from "@/lib/api/fetch-wrapper";
import { MyWorkspaceSchema, type MyWorkspace } from "@madoo/shared";
import { z } from "zod";

export type { MyWorkspace } from "@madoo/shared";

const MyWorkspacesResponseSchema = z.array(MyWorkspaceSchema);

export async function getMyWorkspaces(): Promise<MyWorkspace[]> {
  const raw = await FetchWrapper<MyWorkspace[]>("/workspaces/me");
  return MyWorkspacesResponseSchema.parse(raw);
}
