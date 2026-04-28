import { z } from "zod";
import {
  CreatePendingPromptSchema,
  PendingPromptSchema,
  type CreatePendingPromptInput,
  type PendingPrompt,
} from "@madoo/shared";
import { FetchWrapper } from "@/lib/fetch";

export type { PendingPrompt, CreatePendingPromptInput } from "@madoo/shared";

const PendingPromptListSchema = z.array(PendingPromptSchema);

export const promptKeys = {
  all: ["prompts"] as const,
  pending: () => [...promptKeys.all, "pending"] as const,
};

export async function listPendingPrompts(): Promise<PendingPrompt[]> {
  const raw = await FetchWrapper<unknown>("/prompts/pending");
  return PendingPromptListSchema.parse(raw);
}

export async function createPendingPrompt(
  input: CreatePendingPromptInput,
): Promise<PendingPrompt> {
  const body = CreatePendingPromptSchema.parse(input);
  const raw = await FetchWrapper<unknown>("/prompts/pending", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return PendingPromptSchema.parse(raw);
}

export async function consumePendingPrompt(id: string): Promise<PendingPrompt> {
  const raw = await FetchWrapper<unknown>(`/prompts/pending/${id}/consume`, {
    method: "POST",
  });
  return PendingPromptSchema.parse(raw);
}
