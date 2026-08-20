/** Provider-agnostic LLM message/content types used by generation. */

export type LlmProvider = "anthropic" | "openai" | "groq";

export type LlmImageSource =
  | { type: "url"; url: string }
  | { type: "base64"; media_type: string; data: string };

export type LlmContentBlock =
  | { type: "text"; text: string }
  | { type: "thinking"; thinking: string }
  | { type: "tool_use"; id: string; name: string; input: unknown }
  | {
      type: "tool_result";
      tool_use_id: string;
      content: string | LlmContentBlock[];
    }
  | { type: "image"; source: LlmImageSource };

export type LlmMessage = {
  role: "user" | "assistant";
  content: string | LlmContentBlock[];
};

export type LlmSystemBlock = {
  type: "text";
  text: string;
  cache_control?: { type: "ephemeral" };
};

export type LlmToolChoice =
  | { type: "auto"; disable_parallel_tool_use?: boolean }
  | { type: "tool"; name: string; disable_parallel_tool_use?: boolean }
  | { type: "any"; disable_parallel_tool_use?: boolean };

export type LlmUsage = {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens: number;
  cache_read_input_tokens: number;
};

export type LlmStreamResult = {
  content: LlmContentBlock[];
  usage?: LlmUsage;
  assistantText: string;
  thinkingText: string;
};

export type GenerationToolDefinition = {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
};
