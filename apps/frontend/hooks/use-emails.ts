"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createEmail, fetchEmail, fetchEmails, saveEmailTemplate, type CreateEmailInput } from "@/actions/emails";

export function useCreateEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateEmailInput) => createEmail(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["emails"] });
    },
  });
}

export function useEmail(emailId: string | null) {
  return useQuery({
    queryKey: ["email", emailId],
    queryFn: () => fetchEmail(emailId!),
    enabled: !!emailId,
  });
}

export function useSaveTemplate(emailId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => saveEmailTemplate(emailId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["email", emailId] });
    },
  });
}

export function useEmails(enabled = true) {
  return useQuery({
    queryKey: ["emails"],
    queryFn: fetchEmails,
    enabled,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export type StreamEmailEvent =
  | {
      type: "meta";
      model?: string;
      attempt?: number;
      maxAttempts?: number;
      warning?: string;
    }
  | { type: "subject"; value: string }
  /** Model extended-thinking stream (Anthropic Messages `thinking`). */
  | { type: "thinking-chunk"; value: string }
  | { type: "assistant-chunk"; value: string }
  | { type: "code-chunk"; value: string }
  | { type: "step"; message: string }
  | {
      type: "token_usage";
      input_tokens?: number;
      output_tokens?: number;
      cache_creation_input_tokens?: number;
      cache_read_input_tokens?: number;
    }
  | {
      type: "done";
      variantId: string;
      subject: string;
      compiledHtml: string;
      seq: number;
    }
  | { type: "error"; message: string };

export async function consumeEmailSseStream(
  url: string,
  onEvent: (ev: StreamEmailEvent) => void,
  signal?: AbortSignal,
  body?: string,
): Promise<void> {
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "text/event-stream",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    signal,
    body: body ?? undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Stream failed (${res.status})`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const parts = buffer.split(/\r?\n\r?\n/);
    buffer = parts.pop() ?? "";

    for (const chunk of parts) {
      const lines = chunk.split(/\r?\n/).filter(Boolean);
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trimStart();
        if (!payload) continue;
        try {
          const parsed = JSON.parse(payload) as StreamEmailEvent;
          onEvent(parsed);
        } catch {
          /* ignore partial chunks */
        }
      }
    }
  }
}
