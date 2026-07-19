import Anthropic from "@anthropic-ai/sdk";
import { BadRequestException } from "@nestjs/common";
import { createHash } from "node:crypto";
import type {
  ContentBlockParam,
  MessageParam,
} from "@anthropic-ai/sdk/resources/messages";
import type { VariableSchemaRoot } from "@madoo/shared";

export class GenerationAbortedError extends Error {
  constructor() {
    super("Generation stopped.");
    this.name = "GenerationAbortedError";
  }
}

const CODE_CONTEXT_HEAD_RATIO = 0.65;
const SUBJECT_PLACEHOLDER_PATTERNS = [
  /\{\{[^}]+\}\}/,
  /\$\{[^}]+\}/,
  /%\{[^}]+\}/,
  /<%[^%]+%>/,
  /\[\[[^\]]+\]\]/,
];
const DISALLOWED_GENERATED_VARIABLE_PATTERNS = [
  /cta.*(label|text|copy)/i,
  /button.*(label|text|copy)/i,
  /closing/i,
  /^feature(\d+|one|two|three)$/i,
  /feature.*(label|text|copy|title|description)/i,
  /^(headline|subheadline|eyebrow|tagline|intro|body|paragraph|footer|signature)(Text|Copy)?$/i,
];
const MAX_ATTACHED_IMAGES = 8;

export function stripImports(code: string): string {
  return code
    .replace(/^\s*import[^\n]*\n/gm, "")
    .replace(/^\s+/, "");
}

export function shortHash(input: string): string {
  return createHash("sha256").update(input).digest("hex").slice(0, 16);
}

export function buildCodeContextSnippet(code: string, maxChars: number): string {
  if (code.length <= maxChars) return code;
  const headSize = Math.max(1, Math.floor(maxChars * CODE_CONTEXT_HEAD_RATIO));
  const tailSize = Math.max(1, maxChars - headSize);
  const head = code.slice(0, headSize);
  const tail = code.slice(-tailSize);
  const omitted = code.length - head.length - tail.length;
  return [
    head,
    "",
    `/* ... TRUNCATED ${omitted} chars ... */`,
    "",
    tail,
  ].join("\n");
}

export function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Build the user message content for a model turn. With attached images, returns
 * a content-block array: each image as a vision block (URL source) plus a text
 * block that restates the prompt and lists the hosted URLs so the model can wire
 * them straight into <Img src>. With no images, returns the plain text string.
 */
export function buildUserMessageContent(
  text: string,
  imageUrls?: string[],
): MessageParam["content"] {
  const urls = (imageUrls ?? []).slice(0, MAX_ATTACHED_IMAGES);
  if (urls.length === 0) return text;

  const imageBlocks: ContentBlockParam[] = urls.map((url) => ({
    type: "image",
    source: { type: "url", url },
  }));

  const urlList = urls.map((url, index) => `${index + 1}. ${url}`).join("\n");
  const textBlock: ContentBlockParam = {
    type: "text",
    text: [
      text,
      "",
      `Attached images (${urls.length}). You can see them above. Their public hosted URLs, in the same order, are:`,
      urlList,
      "When the email needs a matching visual, use the exact URL as the <Img src>; do not invent placeholder image URLs for these.",
    ].join("\n"),
  };

  return [...imageBlocks, textBlock];
}

export function sanitizeGeneratedVariableSchema(schema: VariableSchemaRoot): VariableSchemaRoot {
  return {
    variables: schema.variables
      .filter((variable) => {
        const searchable = `${variable.name} ${variable.label ?? ""}`;
        return !DISALLOWED_GENERATED_VARIABLE_PATTERNS.some((pattern) =>
          pattern.test(searchable),
        );
      })
      // Image URLs are template constants shared by every recipient — the model
      // occasionally marks them dynamic anyway, so force them static here.
      .map((variable) =>
        variable.role === "image" && variable.scope === "dynamic"
          ? { ...variable, scope: "static" as const }
          : variable,
      )
      .slice(0, 8),
  };
}

export function assertStaticSubject(subject: string, variableSchema: VariableSchemaRoot): void {
  const normalized = subject.trim();
  if (!normalized) {
    throw new BadRequestException("Subject cannot be empty.");
  }

  if (SUBJECT_PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(normalized))) {
    throw new BadRequestException(
      "Subject must be static plain text. Do not use placeholders or template syntax.",
    );
  }

  for (const variable of variableSchema.variables) {
    const pattern = new RegExp(`\\b${escapeRegExp(variable.name)}\\b`, "i");
    if (pattern.test(normalized)) {
      throw new BadRequestException(
        `Subject must not reference variable names. Found: ${variable.name}`,
      );
    }
  }
}

/** Transient Anthropic failures worth retrying: overloaded, 5xx, rate-limit,
 *  connection drops/timeouts. */
/** Thrown when the user stops generation (stop button / client disconnect). */
export function isAbortError(error: unknown): boolean {
  if (error instanceof GenerationAbortedError) return true;
  if (error instanceof Anthropic.APIUserAbortError) return true;
  return error instanceof Error && error.name === "AbortError";
}

export function isRetryableLlmError(error: unknown): boolean {
  if (error instanceof Anthropic.APIConnectionError) return true;
  if (error instanceof Anthropic.APIError) {
    const status = error.status;
    if (typeof status !== "number") return true;
    return status === 408 || status === 409 || status === 429 || status >= 500;
  }
  return false;
}

/** Turn an LLM/SDK failure into a short, human message — never the raw JSON
 *  error body, which otherwise lands verbatim in the chat. */
export function formatLlmError(error: unknown): string {
  if (error instanceof Anthropic.APIError) {
    const status = error.status;
    // Surface the real Anthropic reason server-side; the user only sees the
    // short message below, but we need the raw body to diagnose 4xx rejections.
    console.error(
      `[GenerationService] Anthropic APIError status=${status}: ${error.message}`,
    );
    if (status === 429) {
      return "The AI service is rate-limited right now. Please wait a moment and try again.";
    }
    if (status === 529) {
      return "The AI service is overloaded right now. Please try again shortly.";
    }
    if (typeof status === "number" && status >= 500) {
      return "The AI service hit a temporary error. Please try again.";
    }
    if (typeof status === "number" && status >= 400) {
      return "The AI request was rejected. Please tweak your message and try again.";
    }
    return "The AI service is unavailable right now. Please try again.";
  }
  const message = error instanceof Error ? error.message : String(error);
  if (!message || /^[[{]/.test(message.trim())) {
    return "Something went wrong while generating. Please try again.";
  }
  return message;
}
