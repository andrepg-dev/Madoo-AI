import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { MessageEvent } from "@nestjs/common";
import Anthropic from "@anthropic-ai/sdk";
import type {
  Message,
  MessageCreateParams,
  MessageParam,
  Tool,
} from "@anthropic-ai/sdk/resources/messages";
import type {
  GenerationRunKind,
  GenerationRunStatus,
} from "@prisma/client";
import { Observable } from "rxjs";
import { parseVariableSchemaJson } from "@madoo/shared";
import { PrismaService } from "../prisma/prisma.service";
import { ReactToHtmlService } from "./react-to-html.service";
import { SEED_TEMPLATES } from "../templates/seed-templates";

const EMIT_EMAIL_TOOL: Tool = {
  name: "emit_email",
  description:
    "Return the final email as structured data: subject line, full TSX React Email component source with default export, and merge-field schema.",
  input_schema: {
    type: "object",
    properties: {
      subject: {
        type: "string",
        description: "Email subject line",
      },
      componentCode: {
        type: "string",
        description:
          "Complete TSX file body using import * as React from 'react' and @react-email/components. Must export default function.",
      },
      variableSchema: {
        type: "array",
        description:
          "Array of variable specs: { name, label?, default, role? }. name must be a valid JS identifier.",
      },
    },
    required: ["subject", "componentCode", "variableSchema"],
  },
};

const STATIC_INSTRUCTION = [
  "You are Madoo's transactional HTML email generator.",
  "Output MUST call tool emit_email once when finished.",
  "componentCode must be valid TSX: Import Html, Body, Container, Section, Text, Button etc from '@react-email/components'.",
  "Use inline styles; emails must render without external CSS.",
  "Return variableSchema as an ARRAY of objects: { name, default, label?, role? }.",
  "Each variable name must be camelCase and valid as a JS identifier.",
  "Every variable must include a string default value.",
  "Component pattern must be: const Email = ({ ...defaults } = {}) => (<Html>...</Html>); export default Email;",
].join("\n");

const FEW_SHOT_TEXT = [
  "Reference templates (few-shot style and structure):",
  `Launch:\n${SEED_TEMPLATES.launch.componentCode}`,
  `Newsletter:\n${SEED_TEMPLATES.newsletter.componentCode}`,
  `Sale:\n${SEED_TEMPLATES.sale.componentCode}`,
  `Welcome:\n${SEED_TEMPLATES.welcome.componentCode}`,
].join("\n\n");


@Injectable()
export class GenerationService {
  private readonly anthropic: Anthropic | null;
  private readonly model: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly reactToHtml: ReactToHtmlService,
  ) {
    const key = this.config.get<string>("ANTHROPIC_API_KEY");
    this.model =
      this.config.get<string>("ANTHROPIC_MODEL") ??
      "claude-sonnet-4-20250514";
    this.anthropic = key ? new Anthropic({ apiKey: key }) : null;
  }

  generateEmailStream(
    emailId: string,
    workspaceId: string,
  ): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      void (async () => {
        try {
          subscriber.next({
            data: JSON.stringify({ type: "step", message: "Preparing generation…" }),
          } as MessageEvent);
          await this.runInitial(emailId, workspaceId, (payload) =>
            subscriber.next({ data: JSON.stringify(payload) } as MessageEvent),
          );
          subscriber.complete();
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          subscriber.next({
            data: JSON.stringify({ type: "error", message: msg }),
          } as MessageEvent);
          subscriber.complete();
        }
      })();
    });
  }

  editEmailStream(
    emailId: string,
    workspaceId: string,
    body: { instruction: string; baseVariantId?: string },
  ): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      void (async () => {
        try {
          subscriber.next({
            data: JSON.stringify({ type: "step", message: "Applying AI edits…" }),
          } as MessageEvent);
          await this.runEdit(emailId, workspaceId, body, (payload) =>
            subscriber.next({ data: JSON.stringify(payload) } as MessageEvent),
          );
          subscriber.complete();
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          subscriber.next({
            data: JSON.stringify({ type: "error", message: msg }),
          } as MessageEvent);
          subscriber.complete();
        }
      })();
    });
  }

  /** Fire-and-forget generation used by PendingPrompt.consume() flow. */
  async generateEmailInBackground(emailId: string, workspaceId: string): Promise<void> {
    try {
      await this.runInitial(emailId, workspaceId, () => undefined);
    } catch {
      // Background trigger is best-effort; state and errors are still persisted in DB.
    }
  }

  private async assertEmailInWorkspace(
    emailId: string,
    workspaceId: string,
  ): Promise<void> {
    const row = await this.prisma.email.findFirst({
      where: { id: emailId, workspaceId },
      select: { id: true },
    });
    if (!row) throw new NotFoundException("Email not found.");
  }

  private async loadGenerationContext(emailId: string, workspaceId: string) {
    const email = await this.prisma.email.findFirst({
      where: { id: emailId, workspaceId },
      include: {
        template: true,
        variants: { orderBy: { seq: "desc" }, take: 1 },
      },
    });
    if (!email) throw new NotFoundException("Email not found.");
    return email;
  }

  private async nextVariantSeq(emailId: string): Promise<number> {
    const agg = await this.prisma.emailVariant.aggregate({
      where: { emailId },
      _max: { seq: true },
    });
    return (agg._max.seq ?? 0) + 1;
  }

  private async runInitial(
    emailId: string,
    workspaceId: string,
    emit: (p: Record<string, unknown>) => void,
  ): Promise<void> {
    await this.assertEmailInWorkspace(emailId, workspaceId);
    const ctx = await this.loadGenerationContext(emailId, workspaceId);

    const userPrompt = [
      `User brief:\n${ctx.prompt}`,
      ctx.tone ? `Tone: ${ctx.tone}` : "",
      ctx.length ? `Length preference: ${ctx.length}` : "",
      ctx.audience ? `Audience: ${ctx.audience}` : "",
      ctx.template?.componentCode
        ? `Starter React Email reference template (do not copy verbatim; adapt):\n${ctx.template.componentCode.slice(0, 12000)}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    await this.executeAnthropicTurn({
      emailId,
      workspaceId,
      kind: "INITIAL",
      modelMessages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
      emit,
    });
  }

  private async runEdit(
    emailId: string,
    workspaceId: string,
    body: { instruction: string; baseVariantId?: string },
    emit: (p: Record<string, unknown>) => void,
  ): Promise<void> {
    await this.assertEmailInWorkspace(emailId, workspaceId);
    const ctx = await this.loadGenerationContext(emailId, workspaceId);

    let baseCode = ctx.variants[0]?.componentCode ?? "";
    if (body.baseVariantId) {
      const v = await this.prisma.emailVariant.findFirst({
        where: {
          id: body.baseVariantId,
          emailId,
          workspaceId,
        },
      });
      if (!v) throw new BadRequestException("baseVariantId not found.");
      baseCode = v.componentCode;
    }

    const editPrompt = [
      "Edit the following React Email TSX according to the instruction.",
      `Instruction:\n${body.instruction.trim()}`,
      baseCode ? `\nCurrent TSX:\n${baseCode.slice(0, 24000)}` : "",
    ].join("\n");

    await this.executeAnthropicTurn({
      emailId,
      workspaceId,
      kind: "EDIT",
      modelMessages: [
        {
          role: "user",
          content: editPrompt,
        },
      ],
      emit,
    });
  }

  private async executeAnthropicTurn(params: {
    emailId: string;
    workspaceId: string;
    kind: GenerationRunKind;
    modelMessages: MessageParam[];
    emit: (p: Record<string, unknown>) => void;
  }): Promise<void> {
    const { emailId, workspaceId, kind, modelMessages, emit } = params;

    if (!this.anthropic) {
      throw new InternalServerErrorException("ANTHROPIC_API_KEY is not configured.");
    }

    await this.prisma.email.update({
      where: { id: emailId },
      data: { status: "GENERATING" },
    });

    const runStartedAt = Date.now();
    const run = await this.prisma.emailGenerationRun.create({
      data: {
        workspaceId,
        emailId,
        kind,
        status: "STREAMING",
      },
    });

    let usageTotals = {
      input_tokens: 0,
      output_tokens: 0,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 0,
    };

    try {
      emit({ type: "step", message: "Calling Claude…" });

      const systemBlocks: MessageCreateParams["system"] = [
        {
          type: "text",
          text: STATIC_INSTRUCTION,
          cache_control: { type: "ephemeral" },
        },
        {
          type: "text",
          text: FEW_SHOT_TEXT,
          cache_control: { type: "ephemeral" },
        },
      ];

      const response = await this.runStream({
        modelMessages,
        systemBlocks,
        emit,
      });

      const u = response.usage;
      if (u) {
        usageTotals = {
          input_tokens: u.input_tokens ?? 0,
          output_tokens: u.output_tokens ?? 0,
          cache_creation_input_tokens: u.cache_creation_input_tokens ?? 0,
          cache_read_input_tokens: u.cache_read_input_tokens ?? 0,
        };
      }

      emit({
        type: "token_usage",
        ...usageTotals,
      });

      const toolBlock = response.content.find(
        (b) => b.type === "tool_use" && b.name === "emit_email",
      );
      if (!toolBlock || toolBlock.type !== "tool_use") {
        throw new InternalServerErrorException("Model did not return emit_email tool output.");
      }

      const input = toolBlock.input as {
        subject?: string;
        componentCode?: string;
        variableSchema?: unknown;
      };

      if (
        !input?.subject ||
        typeof input.componentCode !== "string" ||
        input.variableSchema === undefined
      ) {
        throw new BadRequestException("Invalid emit_email tool payload.");
      }

      let variableSchema: ReturnType<typeof parseVariableSchemaJson> | null = null;
      let compiledHtml = "";
      let validated = false;
      let attempts = 0;
      let lastErr: Error | null = null;

      while (attempts < 2) {
        attempts += 1;
        try {
          variableSchema = parseVariableSchemaJson(input.variableSchema);
          emit({
            type: "meta",
            attempt: attempts,
            maxAttempts: 2,
            model: this.model,
          });
          emit({ type: "subject", value: input.subject });
          emit({ type: "step", message: "Rendering HTML preview…" });
          compiledHtml = this.reactToHtml.compile(input.componentCode, {});
          validated = true;
          break;
        } catch (err) {
          lastErr = err instanceof Error ? err : new Error(String(err));
          if (attempts >= 2) break;
          emit({
            type: "meta",
            attempt: attempts,
            maxAttempts: 2,
            warning: "Invalid component/schema. Retrying once with validator feedback.",
          });
          const retry = await this.runStream({
            modelMessages: [
              ...modelMessages,
              {
                role: "user",
                content: [
                  "Validation failed on your previous output.",
                  "Return a corrected emit_email payload only.",
                  `Reason: ${lastErr.message}`,
                  "Keep the same intent and audience.",
                ].join("\n"),
              },
            ],
            systemBlocks,
            emit,
          });
          const retryTool = retry.content.find(
            (b) => b.type === "tool_use" && b.name === "emit_email",
          );
          if (!retryTool || retryTool.type !== "tool_use") {
            throw new BadRequestException("Retry did not return emit_email tool output.");
          }
          const nextInput = retryTool.input as {
            subject?: string;
            componentCode?: string;
            variableSchema?: unknown;
          };
          if (
            !nextInput?.subject ||
            typeof nextInput.componentCode !== "string" ||
            nextInput.variableSchema === undefined
          ) {
            throw new BadRequestException("Invalid emit_email payload on retry.");
          }
          input.subject = nextInput.subject;
          input.componentCode = nextInput.componentCode;
          input.variableSchema = nextInput.variableSchema;
        }
      }
      if (!variableSchema || !validated) {
        throw new BadRequestException(lastErr?.message ?? "Invalid component or variableSchema.");
      }

      const seq = await this.nextVariantSeq(emailId);

      const variant = await this.prisma.emailVariant.create({
        data: {
          workspaceId,
          emailId,
          seq,
          subject: input.subject,
          componentCode: input.componentCode,
          compiledHtml,
          variableSchema: variableSchema as object,
        },
      });

      await this.prisma.email.update({
        where: { id: emailId },
        data: {
          status: "READY",
          title: input.subject,
        },
      });

      const statusDone: GenerationRunStatus = "COMPLETED";
      await this.prisma.emailGenerationRun.update({
        where: { id: run.id },
        data: {
          status: statusDone,
          inputTokens: usageTotals.input_tokens,
          outputTokens: usageTotals.output_tokens,
          cacheCreationInputTokens: usageTotals.cache_creation_input_tokens,
          cacheReadInputTokens: usageTotals.cache_read_input_tokens,
          latencyMs: Date.now() - runStartedAt,
          completedAt: new Date(),
        },
      });

      emit({
        type: "done",
        variantId: variant.id,
        subject: variant.subject,
        compiledHtml: variant.compiledHtml,
        seq: variant.seq,
      });
    } catch (e) {
      await this.prisma.emailGenerationRun.update({
        where: { id: run.id },
        data: {
          status: "FAILED",
          errorMessage: e instanceof Error ? e.message : String(e),
          latencyMs: Date.now() - runStartedAt,
          completedAt: new Date(),
        },
      });
      await this.prisma.email.update({
        where: { id: emailId },
        data: { status: "ERROR" },
      });
      throw e;
    }
  }

  private async runStream(args: {
    modelMessages: MessageParam[];
    systemBlocks: MessageCreateParams["system"];
    emit: (p: Record<string, unknown>) => void;
  }): Promise<Message> {
    if (!this.anthropic) {
      throw new InternalServerErrorException("ANTHROPIC_API_KEY is not configured.");
    }

    const stream = this.anthropic.messages.stream({
      model: this.model,
      max_tokens: 16384,
      system: args.systemBlocks,
      tools: [EMIT_EMAIL_TOOL],
      messages: args.modelMessages,
    });

    let lastComponentCode = "";
    let subjectEmitted = false;

    stream.on("text", (delta: string) => {
      if (delta) args.emit({ type: "assistant-chunk", value: delta });
    });

    stream.on("inputJson", (_partial: string, snapshot: unknown) => {
      if (!snapshot || typeof snapshot !== "object") return;
      const view = snapshot as { subject?: unknown; componentCode?: unknown };
      if (
        !subjectEmitted &&
        typeof view.subject === "string" &&
        view.subject.length > 0
      ) {
        args.emit({ type: "subject", value: view.subject });
        subjectEmitted = true;
      }
      if (
        typeof view.componentCode === "string" &&
        view.componentCode.length > lastComponentCode.length
      ) {
        const delta = view.componentCode.slice(lastComponentCode.length);
        lastComponentCode = view.componentCode;
        if (delta) args.emit({ type: "code-chunk", value: delta });
      }
    });

    return (await stream.finalMessage()) as unknown as Message;
  }
}
