import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { config } from "./config.js";

/** True if at least one bridge provider key is configured. */
export function bridgeAvailable(): boolean {
  return Boolean(config.anthropicApiKey || config.openaiApiKey);
}

let anthropic: Anthropic | null = null;
let openai: OpenAI | null = null;

function getAnthropic(): Anthropic {
  if (!config.anthropicApiKey) throw new Error("ANTHROPIC_API_KEY not set.");
  return (anthropic ??= new Anthropic({ apiKey: config.anthropicApiKey }));
}

function getOpenAI(): OpenAI {
  if (!config.openaiApiKey) throw new Error("OPENAI_API_KEY not set.");
  return (openai ??= new OpenAI({ apiKey: config.openaiApiKey }));
}

export async function askModel(input: {
  prompt: string;
  model: "claude" | "gpt";
  system?: string;
}): Promise<string> {
  if (input.model === "claude") {
    const res = await getAnthropic().messages.create({
      model: "claude-sonnet-5",
      max_tokens: 2048,
      system: input.system,
      messages: [{ role: "user", content: input.prompt }],
    });
    return res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
  }

  const res = await getOpenAI().chat.completions.create({
    model: "gpt-4o",
    messages: [
      ...(input.system ? [{ role: "system" as const, content: input.system }] : []),
      { role: "user" as const, content: input.prompt },
    ],
  });
  return res.choices[0]?.message?.content?.trim() ?? "";
}
