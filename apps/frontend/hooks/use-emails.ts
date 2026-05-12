"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createEmail,
  createEmailFromTemplate,
  fetchEmail,
  fetchEmails,
  saveEmailTemplate,
  updateEmailVariantVariableSchema,
  type CreateEmailFromTemplateInput,
  type CreateEmailInput,
  type UpdateEmailVariantVariableSchemaInput,
} from "@/actions/emails";

export function useCreateEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateEmailInput) => createEmail(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["emails"] });
    },
  });
}

export function useCreateEmailFromTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateEmailFromTemplateInput) => createEmailFromTemplate(input),
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

export function useUpdateEmailVariantVariableSchema(emailId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      variantId: string;
      variableSchema: UpdateEmailVariantVariableSchemaInput["variableSchema"];
    }) =>
      updateEmailVariantVariableSchema(emailId, input.variantId, {
        variableSchema: input.variableSchema,
      }),
    onSuccess: (data) => {
      qc.setQueryData(["email", emailId], data);
      void qc.invalidateQueries({ queryKey: ["email", emailId] });
      void qc.invalidateQueries({ queryKey: ["emails"] });
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
    const contentType = res.headers.get("Content-Type") ?? "";
    const raw = await res.text().catch(() => "");

    let message = "";
    if (contentType.includes("application/json")) {
      try {
        const parsed = JSON.parse(raw) as { message?: unknown };
        if (typeof parsed.message === "string" && parsed.message.trim()) {
          message = parsed.message.trim();
        }
      } catch {
        // Ignore parse errors and fall back to text heuristics.
      }
    }

    if (!message && raw) {
      // When upstream/proxy returns HTML (e.g. nginx 502 page), strip tags.
      const cleaned = raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (cleaned) message = cleaned;
    }

    if (!message && res.status === 502) {
      message =
        "Upstream gateway error (502). Check backend/proxy logs and retry.";
    }

    throw new Error(message || `Stream failed (${res.status})`);
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
