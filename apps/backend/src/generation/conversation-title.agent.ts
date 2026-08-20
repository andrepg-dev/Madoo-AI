import { Injectable } from "@nestjs/common";
import { GenerationLlmService } from "./generation.llm.service";

const MAX_TITLE_LENGTH = 48;

type GenerateConversationTitleInput = {
  prompt: string;
  subject?: string;
  assistantText?: string;
};

@Injectable()
export class ConversationTitleAgent {
  constructor(private readonly llm: GenerationLlmService) {}

  async generateTitle(input: GenerateConversationTitleInput): Promise<string> {
    const fallback = fallbackTitle(input.prompt);
    if (!this.llm.isConfigured()) return fallback;

    try {
      const raw = await this.llm.complete({
        system: [
          "You are Madoo's conversation title agent.",
          "Create a short private chat title for an email-template project.",
          "Use the same language as the user's prompt.",
          "Do not write the recipient-facing email subject.",
          "Do not describe the email template layout.",
          "Return only the title, no quotes, no punctuation at the end.",
          "Use 2 to 6 words, max 48 characters.",
        ].join(" "),
        user: [
          `User prompt: ${input.prompt}`,
          input.subject ? `Email subject: ${input.subject}` : "",
          input.assistantText
            ? `Assistant summary: ${input.assistantText.slice(0, 600)}`
            : "",
          "Generate a private conversation title distinct from the email subject.",
        ]
          .filter(Boolean)
          .join("\n"),
        maxTokens: 32,
        temperature: 0.2,
      });
      return cleanTitle(raw, fallback);
    } catch {
      return fallback;
    }
  }
}

function fallbackTitle(prompt: string): string {
  const cleaned = prompt
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "Email project";
  const words = cleaned
    .split(" ")
    .filter((word) => !/^(draft|create|make|build|write|email|template)$/i.test(word))
    .slice(0, 6);
  return cleanTitle(words.join(" ") || cleaned, "Email project");
}

function cleanTitle(raw: string, fallback: string): string {
  const title = raw
    .replace(/^["'`]+|["'`.!]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!title) return fallback;
  return title.length <= MAX_TITLE_LENGTH
    ? title
    : `${title.slice(0, MAX_TITLE_LENGTH - 3).trimEnd()}...`;
}
