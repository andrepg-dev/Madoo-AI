import { z } from "zod";
import { MyWorkspaceSchema, type MyWorkspace } from "@madoo/shared";
import { FetchWrapper } from "@/lib/fetch";

export type { MyWorkspace } from "@madoo/shared";

const MyWorkspacesResponseSchema = z.array(MyWorkspaceSchema);

export const workspaceKeys = {
  all: ["workspaces"] as const,
  me: () => [...workspaceKeys.all, "me"] as const,
};

export async function getMyWorkspaces(): Promise<MyWorkspace[]> {
  const raw = await FetchWrapper<unknown>("/workspaces/me");
  return MyWorkspacesResponseSchema.parse(raw);
}
