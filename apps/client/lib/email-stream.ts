export type StreamEmailEvent =
  | {
      type: "meta";
      model?: string;
      attempt?: number;
      maxAttempts?: number;
      warning?: string;
    }
  | { type: "subject"; value: string }
  | { type: "conversation_title"; value: string }
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
      conversationTitle?: string;
      compiledHtml?: string;
      seq?: number;
      chatOnly?: boolean;
    }
  | { type: "error"; message: string };

// A streamed generation that goes silent (backend hang, stalled proxy, dropped
// upstream) would otherwise leave `reader.read()` pending forever, so the
// caller's loading flag never resets and the UI looks frozen. We abort the
// request when no bytes arrive for this long and surface it as a normal error.
const STREAM_IDLE_TIMEOUT_MS = 120_000;

export async function consumeEmailSseStream(
  url: string,
  onEvent: (ev: StreamEmailEvent) => void,
  signal?: AbortSignal,
  body?: string,
): Promise<void> {
  // Internal controller so the idle watchdog can abort; chained to the caller's
  // signal so an external abort still tears the request down.
  const controller = new AbortController();
  const onExternalAbort = () => controller.abort(signal?.reason);
  if (signal) {
    if (signal.aborted) controller.abort(signal.reason);
    else signal.addEventListener("abort", onExternalAbort, { once: true });
  }

  let idleTimer: ReturnType<typeof setTimeout> | undefined;
  const armIdleTimer = () => {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      controller.abort(
        new Error("Generation stalled with no response — please retry."),
      );
    }, STREAM_IDLE_TIMEOUT_MS);
  };
  const clearIdleTimer = () => {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = undefined;
  };

  try {
    armIdleTimer();
    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "text/event-stream",
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      signal: controller.signal,
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
        const cleaned = raw
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
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
      // Reset the silence watchdog every time bytes (or a close) arrive.
      armIdleTimer();
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
  } finally {
    clearIdleTimer();
    signal?.removeEventListener("abort", onExternalAbort);
  }
}
