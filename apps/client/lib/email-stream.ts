export type StreamEmailEvent =
  | {
      type: "meta";
      model?: string;
      attempt?: number;
      maxAttempts?: number;
      warning?: string;
    }
  | { type: "subject"; value: string }
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
      type: "brand_context";
      url?: string;
      brandName?: string | null;
      colors?: string[];
      imageCount?: number;
    }
  | { type: "preview_url"; value: string }
  | {
      type: "done";
      variantId?: string;
      subject?: string;
      compiledHtml?: string;
      seq?: number;
      chatOnly?: boolean;
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
        // Fall through to text cleanup.
      }
    }

    if (!message && raw) {
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
          // Ignore incomplete SSE chunks.
        }
      }
    }
  }
}
