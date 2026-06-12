"use server";

import { FetchWrapper } from "@/lib/api/fetch-wrapper";
import {
  CreatePendingPromptSchema,
  PendingPromptSchema,
  type CreatePendingPromptInput,
  type PendingPrompt,
} from "@madoo/shared";
import { z } from "zod";

export type { CreatePendingPromptInput, PendingPrompt } from "@madoo/shared";

const PendingPromptListSchema = z.array(PendingPromptSchema);

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
  const raw = await FetchWrapper<unknown>(
    `/prompts/pending/${encodeURIComponent(id)}/consume`,
    { method: "POST" },
  );
  return PendingPromptSchema.parse(raw);
}
