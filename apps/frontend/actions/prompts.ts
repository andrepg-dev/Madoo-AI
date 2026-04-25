"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetcher } from "@/lib/fetch";

export type PendingPrompt = {
  id: string;
  userId: string;
  prompt: string;
  tone: string | null;
  length: string | null;
  audience: string | null;
  consumed: boolean;
  createdAt: string;
};

export type CreatePendingPromptInput = {
  prompt: string;
  tone?: string;
  length?: string;
  audience?: string;
};

export const promptKeys = {
  all: ["prompts"] as const,
  pending: () => [...promptKeys.all, "pending"] as const,
};

export const promptsApi = {
  listPending: () => fetcher.get<PendingPrompt[]>("/prompts/pending"),
  createPending: (body: CreatePendingPromptInput) =>
    fetcher.post<PendingPrompt, CreatePendingPromptInput>("/prompts/pending", body),
  consumePending: (id: string) =>
    fetcher.post<PendingPrompt>(`/prompts/pending/${id}/consume`),
};

export function usePendingPrompts() {
  return useQuery<PendingPrompt[]>({
    queryKey: promptKeys.pending(),
    queryFn: () => promptsApi.listPending(),
  });
}

export function useCreatePendingPrompt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreatePendingPromptInput) => promptsApi.createPending(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: promptKeys.pending() }),
  });
}

export function useConsumePendingPrompt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => promptsApi.consumePending(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: promptKeys.pending() }),
  });
}
