import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Anthropic from "@anthropic-ai/sdk";

const DEFAULT_TITLE_MODEL = "claude-haiku-4-5-20251001";
const MAX_TITLE_LENGTH = 48;

type GenerateConversationTitleInput = {
  prompt: string;
  subject?: string;
  assistantText?: string;
};

@Injectable()
export class ConversationTitleAgent {
  private readonly anthropic: Anthropic | null;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    const key = this.config.get<string>("ANTHROPIC_API_KEY");
    this.model =
      this.config.get<string>("ANTHROPIC_TITLE_MODEL") ?? DEFAULT_TITLE_MODEL;
    this.anthropic = key ? new Anthropic({ apiKey: key }) : null;
  }

  async generateTitle(input: GenerateConversationTitleInput): Promise<string> {
    const fallback = fallbackTitle(input.prompt);
    if (!this.anthropic) return fallback;

    try {
      const message = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 32,
        temperature: 0.2,
        system: [
          "You are Madoo's conversation title agent.",
          "Create a short private chat title for an email-template project.",
          "Use the same language as the user's prompt.",
          "Do not write the recipient-facing email subject.",
          "Do not describe the email template layout.",
          "Return only the title, no quotes, no punctuation at the end.",
          "Use 2 to 6 words, max 48 characters.",
        ].join(" "),
        messages: [
          {
            role: "user",
            content: [
              `User prompt: ${input.prompt}`,
              input.subject ? `Email subject: ${input.subject}` : "",
              input.assistantText
                ? `Assistant summary: ${input.assistantText.slice(0, 600)}`
                : "",
              "Generate a private conversation title distinct from the email subject.",
            ]
              .filter(Boolean)
              .join("\n"),
          },
        ],
      });
      const raw =
        message.content.find((block) => block.type === "text")?.text ?? "";
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
