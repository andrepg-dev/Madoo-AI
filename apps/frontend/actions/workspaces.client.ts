import { z } from "zod";
import {
  CreateWorkspaceInputSchema,
  MyWorkspaceSchema,
  type CreateWorkspaceInput,
  type MyWorkspace,
} from "@madoo/shared";
import { fetcher } from "@/lib/fetch";

const MyWorkspaceListSchema = z.array(MyWorkspaceSchema);

export const workspacesKeys = {
  all: ["workspaces"] as const,
  list: () => [...workspacesKeys.all, "list"] as const,
};

export const workspacesApi = {
  list: async (): Promise<MyWorkspace[]> => {
    const raw = await fetcher.get<unknown>("/workspaces/me");
    return MyWorkspaceListSchema.parse(raw);
  },
  create: async (input: CreateWorkspaceInput): Promise<MyWorkspace> => {
    const body = CreateWorkspaceInputSchema.parse(input);
    const raw = await fetcher.post<unknown, CreateWorkspaceInput>(
      "/workspaces",
      body,
    );
    return MyWorkspaceSchema.parse(raw);
  },
};

export type { MyWorkspace, CreateWorkspaceInput };
