import { BadRequestException } from "@nestjs/common";
import { createHash } from "node:crypto";
import type { VariableSchemaRoot } from "@madoo/shared";
import type {
  LlmContentBlock,
  LlmMessage,
} from "./generation.llm.types";

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
): LlmMessage["content"] {
  const urls = (imageUrls ?? []).slice(0, MAX_ATTACHED_IMAGES);
  if (urls.length === 0) return text;

  const imageBlocks: LlmContentBlock[] = urls.map((url) => ({
    type: "image",
    source: { type: "url", url },
  }));

  const urlList = urls.map((url, index) => `${index + 1}. ${url}`).join("\n");
  const textBlock: LlmContentBlock = {
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

/** Thrown when the user stops generation (stop button / client disconnect). */
export function isAbortError(error: unknown): boolean {
  if (error instanceof GenerationAbortedError) return true;
  if (error instanceof Error && error.name === "AbortError") return true;
  return error instanceof DOMException && error.name === "AbortError";
}

export function isRetryableLlmError(error: unknown): boolean {
  const status = extractHttpStatus(error);
  if (
    status === 408 ||
    status === 409 ||
    status === 429 ||
    (typeof status === "number" && status >= 500)
  ) {
    return true;
  }
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("timeout") ||
      message.includes("network") ||
      message.includes("connection") ||
      message.includes("overloaded") ||
      message.includes("rate limit")
    );
  }
  return false;
}

/** Turn an LLM/SDK failure into a short, human message — never the raw JSON
 *  error body, which otherwise lands verbatim in the chat. */
export function formatLlmError(error: unknown): string {
  const status = extractHttpStatus(error);
  if (typeof status === "number") {
    console.error(
      `[GenerationService] LLM APIError status=${status}: ${error instanceof Error ? error.message : String(error)}`,
    );
    if (status === 429) {
      return "The AI service is rate-limited right now. Please wait a moment and try again.";
    }
    if (status === 529) {
      return "The AI service is overloaded right now. Please try again shortly.";
    }
    if (status >= 500) {
      return "The AI service hit a temporary error. Please try again.";
    }
    if (status >= 400) {
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

function extractHttpStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  if ("status" in error && typeof error.status === "number") return error.status;
  if ("statusCode" in error && typeof error.statusCode === "number") {
    return error.statusCode;
  }
  if ("response" in error && error.response && typeof error.response === "object") {
    const response = error.response as { status?: number; statusCode?: number };
    if (typeof response.status === "number") return response.status;
    if (typeof response.statusCode === "number") return response.statusCode;
  }
  return undefined;
}
