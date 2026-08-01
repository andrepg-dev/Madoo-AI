import { config, requireServiceToken } from "./config.js";

/** Shape returned by the backend anonymous generate endpoint. */
export interface AnonGenerateResult {
  publicId: string;
  /** Fully-qualified public preview URL a client can open in a browser. */
  previewUrl: string;
  /** Edit CTA — client /share page for this email, with a path into the editor. */
  ctaUrl: string;
  /** Optional rendered subject line for display. */
  subject?: string;
  /** Pass back on the next call to keep the same free allowance. */
  continuationToken: string;
  /** Free generations left in this conversation. */
  freeRemaining: number;
  /** Where to send the user to create a free Madoo account. */
  signInUrl: string;
}

/** Free allowance spent — the user has to sign in to keep going. */
export interface AnonGenerateGate {
  requiresSignIn: true;
  message: string;
  signInUrl: string;
}

export type AnonGenerateResponse = AnonGenerateResult | AnonGenerateGate;

export function isGate(res: AnonGenerateResponse): res is AnonGenerateGate {
  return "requiresSignIn" in res;
}

/** One SSE payload from the backend generation stream. `type` drives the shape. */
export interface ProgressEvent {
  type?: string;
  [key: string]: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Minimal SSE reader: yields the parsed JSON of each `data:` frame. */
async function* readSseEvents(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<ProgressEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let split = buffer.indexOf("\n\n");
      while (split !== -1) {
        const frame = buffer.slice(0, split);
        buffer = buffer.slice(split + 2);
        const data = frame
          .split("\n")
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trim())
          .join("");
        if (data) {
          try {
            const parsed: unknown = JSON.parse(data);
            if (isRecord(parsed)) yield parsed as ProgressEvent;
          } catch {
            // Ignore malformed frames rather than killing the generation.
          }
        }
        split = buffer.indexOf("\n\n");
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export interface PublicTemplate {
  id: string;
  name: string;
  description?: string | null;
}

/** Thin client over the Madoo public backend surface. No user auth — service token only. */
export class MadooClient {
  private base = config.madooApiUrl;

  async generateAnonymous(input: {
    brief: string;
    brandName?: string;
    brandUrl?: string;
    continuationToken?: string;
  }): Promise<AnonGenerateResponse> {
    const res = await fetch(`${this.base}/public/generate`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-madoo-service-token": requireServiceToken(),
      },
      body: JSON.stringify(input),
    });
    // 402 is the sign-in gate, not a failure: the free allowance for this
    // conversation is spent and the user should continue in Madoo.
    if (res.status === 402) {
      const gate = (await res.json()) as { message?: string; signInUrl?: string };
      return {
        requiresSignIn: true,
        message: gate.message ?? "Free limit reached — create a free Madoo account to keep generating.",
        signInUrl: gate.signInUrl ?? config.madooWebUrl,
      };
    }
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Madoo generate failed (${res.status}): ${text.slice(0, 300)}`);
    }
    return (await res.json()) as AnonGenerateResult;
  }

  /**
   * Streaming generation. Calls `onProgress` for every progress payload the
   * backend emits, resolves with the terminal result (or the sign-in gate).
   */
  async generateAnonymousStreaming(
    input: {
      brief: string;
      brandName?: string;
      brandUrl?: string;
      continuationToken?: string;
    },
    onProgress: (event: ProgressEvent) => void,
  ): Promise<AnonGenerateResponse> {
    const res = await fetch(`${this.base}/public/generate/stream`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "text/event-stream",
        "x-madoo-service-token": requireServiceToken(),
      },
      body: JSON.stringify(input),
    });
    if (!res.ok || !res.body) {
      const text = await res.text().catch(() => "");
      throw new Error(`Madoo generate failed (${res.status}): ${text.slice(0, 300)}`);
    }

    let outcome: AnonGenerateResponse | null = null;
    let failure: string | null = null;

    for await (const event of readSseEvents(res.body)) {
      if (event.type === "result" && isRecord(event.result)) {
        outcome = event.result as unknown as AnonGenerateResult;
      } else if (event.type === "gate") {
        outcome = {
          requiresSignIn: true,
          message:
            typeof event.message === "string"
              ? event.message
              : "Free limit reached — create a free Madoo account to keep generating.",
          signInUrl:
            typeof event.signInUrl === "string" ? event.signInUrl : config.madooWebUrl,
        };
      } else if (event.type === "error") {
        failure = typeof event.message === "string" ? event.message : "Generation failed.";
      } else {
        onProgress(event);
      }
    }

    if (outcome) return outcome;
    throw new Error(failure ?? "Madoo generation ended without a result.");
  }

  async listTemplates(): Promise<PublicTemplate[]> {
    // Public template gallery — no auth required on the backend.
    const res = await fetch(`${this.base}/public/community-templates`);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Madoo templates failed (${res.status}): ${text.slice(0, 300)}`);
    }
    return (await res.json()) as PublicTemplate[];
  }
}

export const madoo = new MadooClient();
