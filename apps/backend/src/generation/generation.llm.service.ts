import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGroq } from "@langchain/groq";
import { ChatOpenAI } from "@langchain/openai";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import {
  AIMessage,
  AIMessageChunk,
  HumanMessage,
  SystemMessage,
  type BaseMessage,
} from "@langchain/core/messages";
import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type {
  GenerationToolDefinition,
  LlmContentBlock,
  LlmMessage,
  LlmProvider,
  LlmStreamResult,
  LlmSystemBlock,
  LlmToolChoice,
  LlmUsage,
} from "./generation.llm.types";

type GenerationRunKind = "INITIAL" | "EDIT";

type StreamArgs = {
  modelMessages: LlmMessage[];
  systemBlocks: LlmSystemBlock[];
  kind: GenerationRunKind;
  tools: GenerationToolDefinition[];
  toolChoice?: LlmToolChoice;
  allowTools?: boolean;
  emit: (payload: Record<string, unknown>) => void;
  signal?: AbortSignal;
};

@Injectable()
export class GenerationLlmService {
  readonly provider: LlmProvider;
  readonly model: string;
  private readonly chatModel: BaseChatModel | null;

  constructor(private readonly config: ConfigService) {
    this.provider = this.resolveProvider();
    this.model = this.resolveModel(this.provider);
    this.chatModel = this.createChatModel(this.provider, this.model);
  }

  isConfigured(): boolean {
    return this.chatModel !== null;
  }

  configuredApiKeyEnv(): string {
    switch (this.provider) {
      case "openai":
        return "OPENAI_API_KEY";
      case "groq":
        return "GROQ_API_KEY";
      default:
        return "ANTHROPIC_API_KEY";
    }
  }

  async stream(args: StreamArgs): Promise<LlmStreamResult> {
    if (!this.chatModel) {
      throw new InternalServerErrorException(
        `${this.configuredApiKeyEnv()} is not configured.`,
      );
    }

    const messages = toLangChainMessages(args.systemBlocks, args.modelMessages);
    const tools =
      args.allowTools === false
        ? undefined
        : args.tools.map(toOpenAiToolDefinition);
    const invokeOptions = this.buildInvokeOptions(args.kind, args.toolChoice);
    const runnable =
      tools?.length && typeof this.chatModel.bindTools === "function"
        ? this.chatModel.bindTools(tools, {
            tool_choice: mapToolChoice(this.provider, args.toolChoice),
            ...(this.provider !== "anthropic"
              ? { parallel_tool_calls: false }
              : {}),
          })
        : this.chatModel;

    let assistantText = "";
    let thinkingText = "";
    let lastComponentCode = "";
    let subjectEmitted = false;
    const toolArgsByIndex = new Map<number, string>();

    const stream = await runnable.stream(messages, {
      ...invokeOptions,
      signal: args.signal,
    });

    let finalChunk: AIMessageChunk | null = null;
    for await (const chunk of stream) {
      if (!(chunk instanceof AIMessageChunk)) continue;
      finalChunk = finalChunk ? finalChunk.concat(chunk) : chunk;

      const textDelta = extractTextDelta(chunk);
      if (textDelta) {
        assistantText += textDelta;
        args.emit({ type: "assistant-chunk", value: textDelta });
      }

      const thinkingDelta = extractThinkingDelta(chunk);
      if (thinkingDelta) {
        thinkingText += thinkingDelta;
        args.emit({ type: "thinking-chunk", value: thinkingDelta });
      }

      for (const toolChunk of chunk.tool_call_chunks ?? []) {
        const index = toolChunk.index ?? 0;
        const prev = toolArgsByIndex.get(index) ?? "";
        const next = prev + (toolChunk.args ?? "");
        toolArgsByIndex.set(index, next);
        emitPartialEmitEmailArgs(next, {
          emit: args.emit,
          subjectEmittedRef: () => subjectEmitted,
          setSubjectEmitted: () => {
            subjectEmitted = true;
          },
          lastComponentCodeRef: () => lastComponentCode,
          setLastComponentCode: (value: string) => {
            lastComponentCode = value;
          },
        });
      }
    }

    const aiMessage =
      finalChunk instanceof AIMessageChunk
        ? new AIMessage(finalChunk)
        : new AIMessage({ content: "" });

    return {
      content: fromLangChainAssistantMessage(aiMessage),
      usage: extractUsage(finalChunk, this.provider),
      assistantText,
      thinkingText,
    };
  }

  /** Non-streaming text completion via LangChain (titles, summaries, etc.). */
  async complete(args: {
    system: string;
    user: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
  }): Promise<string> {
    const model =
      args.model?.trim() ||
      this.config.get<string>("LLM_TITLE_MODEL")?.trim() ||
      this.resolveTitleModel(this.provider);
    const chatModel = this.createChatModel(this.provider, model);
    if (!chatModel) return "";

    const response = await chatModel.invoke(
      [
        new SystemMessage(args.system),
        new HumanMessage(args.user),
      ],
      {
        maxTokens: args.maxTokens ?? 32,
        temperature: args.temperature ?? 0.2,
      } as Parameters<BaseChatModel["invoke"]>[1],
    );

    if (typeof response.content === "string") return response.content;
    if (!Array.isArray(response.content)) return "";
    return response.content
      .map((part) => {
        if (typeof part === "string") return part;
        if (
          typeof part === "object" &&
          part !== null &&
          "type" in part &&
          part.type === "text" &&
          "text" in part
        ) {
          return String(part.text);
        }
        return "";
      })
      .join("")
      .trim();
  }

  private resolveTitleModel(provider: LlmProvider): string {
    switch (provider) {
      case "openai":
        return this.config.get<string>("OPENAI_TITLE_MODEL") ?? "gpt-4o-mini";
      case "groq":
        return this.config.get<string>("GROQ_TITLE_MODEL") ?? "llama-3.1-8b-instant";
      default:
        return (
          this.config.get<string>("ANTHROPIC_TITLE_MODEL") ??
          "claude-haiku-4-5-20251001"
        );
    }
  }

  private buildInvokeOptions(
    kind: GenerationRunKind,
    toolChoice: LlmToolChoice | undefined,
  ): Record<string, unknown> {
    const maxTokens = this.resolveMaxTokens();
    const base: Record<string, unknown> = {
      maxTokens,
    };

    if (this.provider === "anthropic") {
      const forcedTool =
        toolChoice?.type === "tool" || toolChoice?.type === "any";
      const thinking = forcedTool ? undefined : this.extendedThinkingConfig();
      if (thinking) base.thinking = thinking;
      base.outputConfig = { effort: this.effortLevel(kind) };
    }

    return base;
  }

  private resolveProvider(): LlmProvider {
    const raw = (this.config.get<string>("LLM_PROVIDER") ?? "anthropic")
      .trim()
      .toLowerCase();
    if (raw === "openai" || raw === "groq" || raw === "anthropic") {
      return raw;
    }
    return "anthropic";
  }

  private resolveModel(provider: LlmProvider): string {
    const unified = this.config.get<string>("LLM_MODEL")?.trim();
    if (unified) return unified;

    switch (provider) {
      case "openai":
        return (
          this.config.get<string>("OPENAI_MODEL") ??
          this.config.get<string>("ANTHROPIC_MODEL") ??
          "gpt-4o"
        );
      case "groq":
        return (
          this.config.get<string>("GROQ_MODEL") ??
          "llama-3.3-70b-versatile"
        );
      default:
        return this.config.get<string>("ANTHROPIC_MODEL") ?? "claude-sonnet-5";
    }
  }

  private createChatModel(
    provider: LlmProvider,
    model: string,
  ): BaseChatModel | null {
    switch (provider) {
      case "openai": {
        const apiKey = this.config.get<string>("OPENAI_API_KEY");
        if (!apiKey) return null;
        return new ChatOpenAI({
          model,
          apiKey,
          maxRetries: 3,
          streaming: true,
        });
      }
      case "groq": {
        const apiKey = this.config.get<string>("GROQ_API_KEY");
        if (!apiKey) return null;
        return new ChatGroq({
          model,
          apiKey,
          maxRetries: 3,
          streaming: true,
        });
      }
      default: {
        const apiKey = this.config.get<string>("ANTHROPIC_API_KEY");
        if (!apiKey) return null;
        return new ChatAnthropic({
          model,
          apiKey,
          maxRetries: 3,
          streaming: true,
        });
      }
    }
  }

  private resolveMaxTokens(): number {
    if (this.provider === "anthropic") {
      const thinking = this.extendedThinkingConfig();
      return thinking ? 32_000 : 24_000;
    }
    if (this.provider === "openai") return 16_384;
    // Groq's free/on-demand TPM limit includes prompt tokens plus the
    // reserved completion budget. Keep this below 8,000 even for large prompts.
    if (this.provider === "groq") return 1_500;
    return 8_192;
  }

  private extendedThinkingConfig():
    | { type: "adaptive"; display: "summarized" }
    | undefined {
    if (this.provider !== "anthropic") return undefined;
    const raw = this.config.get<string>("ANTHROPIC_EXTENDED_THINKING");
    if (raw === "0" || raw === "false") return undefined;
    return { type: "adaptive", display: "summarized" };
  }

  private effortLevel(
    kind: GenerationRunKind,
  ): "low" | "medium" | "high" | "max" {
    const perKindDefault: "high" | "medium" =
      kind === "INITIAL" ? "high" : "medium";
    const perKindEnv =
      kind === "INITIAL" ? "ANTHROPIC_EFFORT_INITIAL" : "ANTHROPIC_EFFORT_EDIT";
    const raw = (
      this.config.get<string>(perKindEnv) ??
      this.config.get<string>("ANTHROPIC_EFFORT") ??
      perKindDefault
    ).toLowerCase();
    if (raw === "low" || raw === "medium" || raw === "high" || raw === "max") {
      return raw;
    }
    return perKindDefault;
  }
}

function toOpenAiToolDefinition(tool: GenerationToolDefinition) {
  return {
    type: "function" as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.input_schema,
    },
  };
}

function mapToolChoice(provider: LlmProvider, toolChoice: LlmToolChoice | undefined) {
  if (provider === "anthropic") {
    if (!toolChoice) {
      return { type: "auto", disable_parallel_tool_use: true };
    }
    if (toolChoice.type === "tool") {
      return {
        type: "tool",
        name: toolChoice.name,
        disable_parallel_tool_use: toolChoice.disable_parallel_tool_use ?? true,
      };
    }
    if (toolChoice.type === "any") {
      return {
        type: "any",
        disable_parallel_tool_use: toolChoice.disable_parallel_tool_use ?? true,
      };
    }
    return {
      type: "auto",
      disable_parallel_tool_use: toolChoice.disable_parallel_tool_use ?? true,
    };
  }

  if (!toolChoice || toolChoice.type === "auto") return "auto";
  if (toolChoice.type === "any") return "required";
  return {
    type: "function",
    function: { name: toolChoice.name },
  };
}

function toLangChainMessages(
  systemBlocks: LlmSystemBlock[],
  modelMessages: LlmMessage[],
): BaseMessage[] {
  const messages: BaseMessage[] = [];

  if (systemBlocks.length > 0) {
    messages.push(
      new SystemMessage({
        content: systemBlocks.map((block) => ({
          type: "text" as const,
          text: block.text,
          ...(block.cache_control
            ? { cache_control: block.cache_control }
            : {}),
        })),
      }),
    );
  }

  for (const message of modelMessages) {
    if (message.role === "assistant") {
      messages.push(toAssistantMessage(message));
      continue;
    }
    messages.push(toHumanMessage(message));
  }

  return messages;
}

function toHumanMessage(message: LlmMessage): HumanMessage {
  if (typeof message.content === "string") {
    return new HumanMessage(message.content);
  }

  const content = message.content.map((block) => {
    if (block.type === "text") {
      return { type: "text" as const, text: block.text };
    }
    if (block.type === "image") {
      if (block.source.type === "url") {
        return {
          type: "image_url" as const,
          image_url: { url: block.source.url },
        };
      }
      return {
        type: "image_url" as const,
        image_url: {
          url: `data:${block.source.media_type};base64,${block.source.data}`,
        },
      };
    }
    if (block.type === "tool_result") {
      if (typeof block.content === "string") {
        return {
          type: "tool_result" as const,
          tool_use_id: block.tool_use_id,
          content: block.content,
        };
      }
      return {
        type: "tool_result" as const,
        tool_use_id: block.tool_use_id,
        content: block.content.map((part) => {
          if (part.type === "text") {
            return { type: "text" as const, text: part.text };
          }
          if (part.type === "image" && part.source.type === "base64") {
            return {
              type: "image" as const,
              source: {
                type: "base64" as const,
                media_type: part.source.media_type,
                data: part.source.data,
              },
            };
          }
          return { type: "text" as const, text: "" };
        }),
      };
    }
    return { type: "text" as const, text: "" };
  });

  return new HumanMessage({ content });
}

function toAssistantMessage(message: LlmMessage): AIMessage {
  if (typeof message.content === "string") {
    return new AIMessage(message.content);
  }

  const textParts: string[] = [];
  const toolCalls: Array<{ id: string; name: string; args: Record<string, unknown> }> =
    [];

  for (const block of message.content) {
    if (block.type === "text") textParts.push(block.text);
    if (block.type === "thinking") textParts.push(block.thinking);
    if (block.type === "tool_use") {
      toolCalls.push({
        id: block.id,
        name: block.name,
        args:
          block.input && typeof block.input === "object"
            ? (block.input as Record<string, unknown>)
            : {},
      });
    }
  }

  return new AIMessage({
    content: textParts.join(""),
    tool_calls: toolCalls,
  });
}

function fromLangChainAssistantMessage(message: AIMessage): LlmContentBlock[] {
  const blocks: LlmContentBlock[] = [];

  if (typeof message.content === "string" && message.content.trim()) {
    blocks.push({ type: "text", text: message.content });
  } else if (Array.isArray(message.content)) {
    for (const part of message.content as unknown[]) {
      if (typeof part === "string" && part.trim()) {
        blocks.push({ type: "text", text: part });
        continue;
      }
      if (typeof part !== "object" || part === null) continue;
      if ("type" in part && part.type === "text" && "text" in part) {
        blocks.push({ type: "text", text: String(part.text) });
      }
      if ("type" in part && part.type === "thinking" && "thinking" in part) {
        blocks.push({ type: "thinking", thinking: String(part.thinking) });
      }
    }
  }

  for (const call of message.tool_calls ?? []) {
    blocks.push({
      type: "tool_use",
      id: call.id ?? "",
      name: call.name,
      input: call.args,
    });
  }

  return blocks;
}

function extractTextDelta(chunk: AIMessageChunk): string {
  if (typeof chunk.content === "string") return chunk.content;
  if (!Array.isArray(chunk.content)) return "";

  let text = "";
  for (const part of chunk.content) {
    if (typeof part === "string") {
      text += part;
      continue;
    }
    if (typeof part !== "object" || part === null) continue;
    if ("type" in part && part.type === "text" && "text" in part) {
      text += String(part.text);
    }
  }
  return text;
}

function extractThinkingDelta(chunk: AIMessageChunk): string {
  if (!Array.isArray(chunk.content)) return "";
  let text = "";
  for (const part of chunk.content) {
    if (typeof part !== "object" || part === null) continue;
    if ("type" in part && part.type === "thinking" && "thinking" in part) {
      text += String(part.thinking);
    }
  }
  return text;
}

function extractUsage(
  chunk: AIMessageChunk | null,
  provider: LlmProvider,
): LlmUsage | undefined {
  const usage = chunk?.usage_metadata;
  if (!usage) return undefined;

  const inputTokens = usage.input_tokens ?? 0;
  const outputTokens = usage.output_tokens ?? 0;
  const inputDetails = usage.input_token_details as
    | { cache_creation?: number; cache_read?: number }
    | undefined;

  return {
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    cache_creation_input_tokens:
      provider === "anthropic" ? (inputDetails?.cache_creation ?? 0) : 0,
    cache_read_input_tokens:
      provider === "anthropic" ? (inputDetails?.cache_read ?? 0) : 0,
  };
}

function emitPartialEmitEmailArgs(
  partialJson: string,
  ctx: {
    emit: (payload: Record<string, unknown>) => void;
    subjectEmittedRef: () => boolean;
    setSubjectEmitted: () => void;
    lastComponentCodeRef: () => string;
    setLastComponentCode: (value: string) => void;
  },
) {
  if (!partialJson.includes("componentCode") && !partialJson.includes("subject")) {
    return;
  }

  let snapshot: { subject?: unknown; componentCode?: unknown } | null = null;
  try {
    snapshot = JSON.parse(partialJson) as {
      subject?: unknown;
      componentCode?: unknown;
    };
  } catch {
    snapshot = extractPartialEmitEmailFields(partialJson);
  }
  if (!snapshot) return;

  if (
    !ctx.subjectEmittedRef() &&
    typeof snapshot.subject === "string" &&
    snapshot.subject.length > 0
  ) {
    ctx.emit({ type: "subject", value: snapshot.subject });
    ctx.setSubjectEmitted();
  }

  if (typeof snapshot.componentCode === "string") {
    const last = ctx.lastComponentCodeRef();
    if (snapshot.componentCode.length > last.length) {
      const delta = snapshot.componentCode.slice(last.length);
      ctx.setLastComponentCode(snapshot.componentCode);
      if (delta) ctx.emit({ type: "code-chunk", value: delta });
    }
  }
}

function extractPartialEmitEmailFields(partialJson: string): {
  subject?: string;
  componentCode?: string;
} | null {
  const subjectMatch = partialJson.match(/"subject"\s*:\s*"((?:\\.|[^"\\])*)"/);
  const codeMatch = partialJson.match(
    /"componentCode"\s*:\s*"((?:\\.|[^"\\])*)"/,
  );
  if (!subjectMatch && !codeMatch) return null;

  const unescape = (value: string) =>
    value
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "\r")
      .replace(/\\t/g, "\t")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");

  return {
    ...(subjectMatch ? { subject: unescape(subjectMatch[1]) } : {}),
    ...(codeMatch ? { componentCode: unescape(codeMatch[1]) } : {}),
  };
}
