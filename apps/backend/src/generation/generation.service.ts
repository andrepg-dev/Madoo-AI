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
  ThinkingConfigParam,
  Tool,
} from "@anthropic-ai/sdk/resources/messages";
import type {
  EmailChatKind,
  EmailChatRole,
  GenerationRunKind,
  GenerationRunStatus,
} from "@prisma/client";
import { Observable } from "rxjs";
import { createHash } from "node:crypto";
import { parseVariableSchemaJson, type VariableSchemaRoot } from "@madoo/shared";
import { PrismaService } from "../prisma/prisma.service";
import { BillingService } from "../billing/billing.service";
import { ReactToHtmlService } from "./react-to-html.service";
import { ScreenshotService } from "./screenshot.service";
import { S3Service } from "../s3/s3.service";
import { SEED_TEMPLATES } from "../templates/seed-templates";
import { WebsiteBrandService } from "./website-brand.service";
import { ConversationTitleAgent } from "./conversation-title.agent";

const EMIT_EMAIL_TOOL: Tool = {
  name: "emit_email",
  description:
    "Return the final email as structured data: subject line, full TSX HTML Coditor component source with default export, and merge-field schema.",
  input_schema: {
    type: "object",
    properties: {
      subject: {
        type: "string",
        description:
          "Recipient-facing email subject only, aligned with the user brief. Never mention environment variables, .env, API keys, secrets, or deployment/infrastructure setup.",
      },
      componentCode: {
        type: "string",
        description:
          "Complete TSX file body using HTML Coditor. Must export default function.",
      },
      variableSchema: {
        type: "array",
        description:
          "Array of merge-field specs: { name, label?, default, role?, scope }. scope must be 'dynamic' or 'static'. Keep it small and only include meaningful fields.",
        items: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description:
                "Camel-case variable name used as the React prop, for example recipientName or ctaUrl.",
            },
            label: { type: "string" },
            default: { type: "string" },
            role: {
              type: "string",
              enum: ["text", "url", "image", "date"],
              description:
                "Data type only. Do not put variable identity values like recipient_name here.",
            },
            scope: {
              type: "string",
              enum: ["dynamic", "static"],
            },
          },
          required: ["name", "default", "scope"],
          additionalProperties: false,
        },
      },
    },
    required: ["subject", "componentCode", "variableSchema"],
  },
};

const INSPECT_WEBSITE_BRAND_TOOL: Tool = {
  name: "inspect_website_brand",
  description:
    "Inspect a public website and return compact brand context for email creation: brand name, copy snippets, CTAs, colors, fonts, logo URL, favicon URL, OpenGraph image URL, and useful image URLs. Never returns image bytes.",
  input_schema: {
    type: "object",
    properties: {
      url: {
        type: "string",
        description:
          "Public website URL to inspect. Use the official brand/product site when provided by the user.",
      },
      purpose: {
        type: "string",
        description:
          "Why this website context is needed, e.g. product launch email, newsletter, welcome email, or promotion template.",
      },
    },
    required: ["url"],
  },
};

const STATIC_INSTRUCTION = [
  "You are Madoo's transactional HTML email generator, powered by 'HTML Coditor'.",
  "Output MUST call tool emit_email once when finished only when the user request include some email modification.",
  "componentCode must be valid TSX: Import Html, Body, Container, Section, Text, Button etc from 'html-coditor'.",
  "Use inline styles or tailwind clasess",
  "Return variableSchema as an ARRAY of objects: { name, default, label?, role?, scope }.",
  "Each variable name must be camelCase and valid as a JS identifier.",
  "Every variable must include a string default value.",
  "role is optional and must only be one of: text, url, image, date. Never use role for variable identity such as recipient_name or company_name; put identity in name.",
  "Every variable must set scope: dynamic or static.",
  "Use scope=dynamic for personalized data that may be replaced outside Madoo (recipientName, companyName, ctaUrl, planName, invoiceNumber, dates from CRM).",
  "Use scope=static for template constants that stay fixed across uses (heroTitle, offerText, footerLine, buttonLabel, feature bullets).",
  "Variable discipline: use only a small set of meaningful merge fields, usually 3-6 and never more than 8 unless the user explicitly asks for many personalized fields.",
  "Create variables only for important personalized or template-specific parts: recipientName, companyName, productName, offer, discountCode, eventDate, ctaUrl, senderName.",
  "Do not create variables for CTA/button labels, closing text, feature bullets, generic body sentences, every headline fragment, colors, spacing, layout styles, decorative labels, or text that should stay fixed for all recipients.",
  "Banned variable examples: ctaLabel, ctaButtonLabel, buttonLabel, closingText, closingLine, feature1, feature2, feature3, featureOne, featureTwo, featureThree.",
  "If a value is not expected to change per recipient or template use, keep it as inline copy inside componentCode instead of adding it to variableSchema.",
  "variableSchema must match the component props exactly: every schema variable is destructured with a default, used in the component, and no extra props are invented.",
  "Component pattern must be: const Email = ({ ...defaults } = {}) => (<Html>...</Html>); export default Email;",
  "Subject line (emit_email.subject) must be normal marketing or transactional copy for the recipient. Never base it on environment variables, .env files, API keys, secrets, or other developer/deployment configuration topics—even if the user brief drifts there.",
  "When the user provides a website URL or asks to match a brand/site, call inspect_website_brand before emit_email.",
  "Use inspect_website_brand results for visual direction, copy tone, brand colors, fonts, CTA language, logo URL, and image URLs.",
  "Never ask for or expect image bytes, base64, screenshots, or vision input. You only receive compact text metadata and asset URLs.",
  "If brand inspection fails or returns partial context, continue with the available context and do not invent exact brand claims.",
  "CRITICAL: Do not never explain to the user how your internally work."
].join("\n");

const FEW_SHOT_TEXT = [
  "Reference templates (few-shot style and structure):",
  `Launch:\n${SEED_TEMPLATES.launch.componentCode}`,
  `Newsletter:\n${SEED_TEMPLATES.newsletter.componentCode}`,
  `Sale:\n${SEED_TEMPLATES.sale.componentCode}`,
  `Welcome:\n${SEED_TEMPLATES.welcome.componentCode}`,
].join("\n\n");

const CHAT_HISTORY_LIMIT = 8;
const CODE_CONTEXT_LIMIT = 24_000;
const CODE_CONTEXT_HEAD_RATIO = 0.65;
const PREVIEW_MAX_ATTEMPTS = 3;
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

function shortHash(input: string): string {
  return createHash("sha256").update(input).digest("hex").slice(0, 16);
}

function buildCodeContextSnippet(code: string, maxChars: number): string {
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

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sanitizeGeneratedVariableSchema(schema: VariableSchemaRoot): VariableSchemaRoot {
  return {
    variables: schema.variables
      .filter((variable) => {
        const searchable = `${variable.name} ${variable.label ?? ""}`;
        return !DISALLOWED_GENERATED_VARIABLE_PATTERNS.some((pattern) =>
          pattern.test(searchable),
        );
      })
      .slice(0, 8),
  };
}

function assertStaticSubject(subject: string, variableSchema: VariableSchemaRoot): void {
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


@Injectable()
export class GenerationService {
  private readonly anthropic: Anthropic | null;
  private readonly model: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly billing: BillingService,
    private readonly reactToHtml: ReactToHtmlService,
    private readonly screenshot: ScreenshotService,
    private readonly s3: S3Service,
    private readonly websiteBrand: WebsiteBrandService,
    private readonly conversationTitleAgent: ConversationTitleAgent,
  ) {
    const key = this.config.get<string>("ANTHROPIC_API_KEY");
    this.model =
      this.config.get<string>("ANTHROPIC_MODEL") ??
      "claude-sonnet-4-20250514";
    this.anthropic = key ? new Anthropic({ apiKey: key }) : null;
  }

  /** Extended thinking (model-level). Off if `ANTHROPIC_EXTENDED_THINKING=false`. */
  private extendedThinkingConfig(): ThinkingConfigParam | undefined {
    const raw = this.config.get<string>("ANTHROPIC_EXTENDED_THINKING");
    if (raw === "0" || raw === "false") {
      return undefined;
    }
    return { type: "adaptive", display: "summarized" };
  }

  private async loadRecentChatContext(emailId: string): Promise<string> {
    const rows = await this.prisma.emailChatMessage.findMany({
      where: { emailId },
      orderBy: { createdAt: "desc" },
      take: CHAT_HISTORY_LIMIT,
    });
    if (!rows.length) return "No previous chat context.";
    return rows
      .reverse()
      .map((row) => {
        const role = row.role.toLowerCase();
        const kind = row.kind.toLowerCase();
        const compact = row.content.replace(/\s+/g, " ").trim().slice(0, 500);
        return `${role}/${kind}: ${compact}`;
      })
      .join("\n");
  }

  private async appendChatMessage(args: {
    workspaceId: string;
    emailId: string;
    role: EmailChatRole;
    kind: EmailChatKind;
    content: string;
  }): Promise<void> {
    const content = args.content.trim();
    if (!content) return;
    await this.prisma.emailChatMessage.create({
      data: {
        workspaceId: args.workspaceId,
        emailId: args.emailId,
        role: args.role,
        kind: args.kind,
        content,
      },
    });
  }

  generateEmailStream(
    emailId: string,
    workspaceId: string,
  ): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      void (async () => {
        try {
          subscriber.next({
            data: JSON.stringify({ type: "step", message: "Preparing generation..." }),
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
            data: JSON.stringify({ type: "step", message: "Applying AI edits..." }),
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

  private async createAndPersistVariantPreview(
    variantId: string,
    compiledHtml: string,
  ): Promise<string | null> {
    let lastErr: unknown;
    for (let attempt = 1; attempt <= PREVIEW_MAX_ATTEMPTS; attempt += 1) {
      try {
        const buffer = await this.screenshot.screenshotHtml(compiledHtml);
        const previewUrl = await this.s3.uploadBuffer(buffer, "image/png");
        await this.prisma.emailVariant.update({
          where: { id: variantId },
          data: { previewUrl },
        });
        return previewUrl;
      } catch (err) {
        lastErr = err;
      }
    }
    console.warn(
      `[GenerationService] preview screenshot failed after ${PREVIEW_MAX_ATTEMPTS} attempts: ${lastErr instanceof Error ? lastErr.message : String(lastErr)}`,
    );
    return null;
  }

  private async runInitial(
    emailId: string,
    workspaceId: string,
    emit: (p: Record<string, unknown>) => void,
  ): Promise<void> {
    await this.billing.assertCanGenerate(workspaceId);
    await this.assertEmailInWorkspace(emailId, workspaceId);
    const ctx = await this.loadGenerationContext(emailId, workspaceId);

    const userPrompt = [
      `User brief:\n${ctx.prompt}`,
      ctx.tone ? `Tone: ${ctx.tone}` : "",
      ctx.length ? `Length preference: ${ctx.length}` : "",
      ctx.audience ? `Audience: ${ctx.audience}` : "",
      ctx.template?.componentCode
        ? `Starter HTML Coditor reference template (do not copy verbatim; adapt):\n${ctx.template.componentCode.slice(0, 12000)}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    const result = await this.executeAnthropicTurn({
      emailId,
      workspaceId,
      kind: "INITIAL",
      modelMessages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
      titleContext: {
        prompt: ctx.prompt,
        tone: ctx.tone,
        audience: ctx.audience,
      },
      emit,
    });

    await this.appendChatMessage({
      workspaceId,
      emailId,
      role: "ASSISTANT",
      kind: "THINKING",
      content: result.thinkingText,
    });
    await this.appendChatMessage({
      workspaceId,
      emailId,
      role: "ASSISTANT",
      kind: "TEXT",
      content: result.assistantText,
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
    let sourceVariantId = ctx.variants[0]?.id ?? null;
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
      sourceVariantId = v.id;
    }

    const snapshot = await this.prisma.emailVfsSnapshot.upsert({
      where: { emailId },
      create: {
        workspaceId,
        emailId,
        filePath: "Email.tsx",
        componentCode: baseCode,
        componentHash: shortHash(baseCode),
        sourceVariantId: sourceVariantId ?? undefined,
      },
      update: {
        componentCode: baseCode,
        componentHash: shortHash(baseCode),
        sourceVariantId: sourceVariantId ?? undefined,
      },
    });

    const instruction = body.instruction.trim();
    const recentChat = await this.loadRecentChatContext(emailId);
    const codeContext = buildCodeContextSnippet(snapshot.componentCode, CODE_CONTEXT_LIMIT);

    const editPrompt = [
      "Edit the current HTML Coditor TSX according to the instruction.",
      `Instruction:\n${instruction}`,
      "",
      "Conversation context (most recent first):",
      recentChat,
      "",
      "Virtual File System:",
      `- file: ${snapshot.filePath}`,
      `- hash: ${snapshot.componentHash}`,
      `- sourceVariantId: ${snapshot.sourceVariantId ?? "unknown"}`,
      `- codeLength: ${snapshot.componentCode.length}`,
      "",
      "Current TSX (authoritative source of truth):",
      codeContext,
    ].join("\n");

    await this.appendChatMessage({
      workspaceId,
      emailId,
      role: "USER",
      kind: "TEXT",
      content: instruction,
    });

    const result = await this.executeAnthropicTurn({
      emailId,
      workspaceId,
      kind: "EDIT",
      modelMessages: [
        {
          role: "user",
          content: editPrompt,
        },
      ],
      fullCodeForRetry: snapshot.componentCode,
      emit,
    });

    if (result.applied && result.componentCode && result.variantId) {
      await this.prisma.emailVfsSnapshot.update({
        where: { emailId },
        data: {
          componentCode: result.componentCode,
          componentHash: shortHash(result.componentCode),
          sourceVariantId: result.variantId,
        },
      });
    }

    await this.appendChatMessage({
      workspaceId,
      emailId,
      role: "ASSISTANT",
      kind: "THINKING",
      content: result.thinkingText,
    });
    await this.appendChatMessage({
      workspaceId,
      emailId,
      role: "ASSISTANT",
      kind: "TEXT",
      content: result.assistantText,
    });
  }

  private async executeAnthropicTurn(params: {
    emailId: string;
    workspaceId: string;
    kind: GenerationRunKind;
    modelMessages: MessageParam[];
    fullCodeForRetry?: string;
    titleContext?: {
      prompt: string;
      tone?: string | null;
      audience?: string | null;
    };
    emit: (p: Record<string, unknown>) => void;
  }): Promise<{
    assistantText: string;
    thinkingText: string;
    componentCode?: string;
    variantId?: string;
    applied: boolean;
  }> {
    const {
      emailId,
      workspaceId,
      kind,
      modelMessages,
      fullCodeForRetry,
      titleContext,
      emit,
    } = params;

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

      let response: Awaited<ReturnType<typeof this.runStream>> | null = null;
      let assistantText = "";
      let thinkingText = "";
      let turnMessages = [...modelMessages];

      for (let toolTurn = 0; toolTurn < 3; toolTurn += 1) {
        response = await this.runStream({
          modelMessages: turnMessages,
          systemBlocks,
          emit,
        });
        assistantText += response.assistantText;
        thinkingText += response.thinkingText;

        const u = response.usage;
        if (u) {
          usageTotals = {
            input_tokens: usageTotals.input_tokens + (u.input_tokens ?? 0),
            output_tokens: usageTotals.output_tokens + (u.output_tokens ?? 0),
            cache_creation_input_tokens:
              usageTotals.cache_creation_input_tokens +
              (u.cache_creation_input_tokens ?? 0),
            cache_read_input_tokens:
              usageTotals.cache_read_input_tokens +
              (u.cache_read_input_tokens ?? 0),
          };
        }

        const requestedTool = response.content.find((b) => b.type === "tool_use");
        if (!requestedTool || requestedTool.type !== "tool_use") break;
        if (requestedTool.name === "emit_email") break;

        if (requestedTool.name !== "inspect_website_brand") {
          throw new BadRequestException(`Unsupported tool requested: ${requestedTool.name}`);
        }

        const input = requestedTool.input as { url?: unknown; purpose?: unknown };
        if (typeof input.url !== "string" || !input.url.trim()) {
          throw new BadRequestException("inspect_website_brand requires a URL.");
        }

        emit({ type: "step", message: "Inspecting brand website..." });
        const brandContext = await this.websiteBrand.inspect(
          input.url,
          typeof input.purpose === "string" ? input.purpose : undefined,
        );
        emit({
          type: "brand_context",
          url: brandContext.url,
          brandName: brandContext.brandName,
          colors: brandContext.colors.map((color) => color.hex),
          imageCount: brandContext.imageUrls.length,
        });

        turnMessages = [
          ...turnMessages,
          {
            role: "assistant",
            content: response.content,
          } as MessageParam,
          {
            role: "user",
            content: [
              {
                type: "tool_result",
                tool_use_id: requestedTool.id,
                content: JSON.stringify(brandContext),
              },
            ],
          } as MessageParam,
        ];
      }

      if (!response) {
        throw new InternalServerErrorException("Madoo AI did not return a response.");
      }

      emit({
        type: "token_usage",
        ...usageTotals,
      });

      const pendingToolBlock = response.content.find(
        (b) => b.type === "tool_use" && b.name !== "emit_email",
      );
      if (pendingToolBlock?.type === "tool_use") {
        throw new BadRequestException("AI inspected context but did not return the email.");
      }

      const toolBlock = response.content.find(
        (b) => b.type === "tool_use" && b.name === "emit_email",
      );
      if (!toolBlock || toolBlock.type !== "tool_use") {
        const statusDone: GenerationRunStatus = "COMPLETED";
        const nextEmailStatus = kind === "INITIAL" ? "DRAFT" : "READY";

        await this.prisma.email.update({
          where: { id: emailId },
          data: { status: nextEmailStatus },
        });
        await this.prisma.emailGenerationRun.update({
          where: { id: run.id },
          data: {
            status: statusDone,
            inputTokens: usageTotals.input_tokens,
            cachedTokens: usageTotals.cache_read_input_tokens,
            outputTokens: usageTotals.output_tokens,
            cacheCreationInputTokens: usageTotals.cache_creation_input_tokens,
            cacheReadInputTokens: usageTotals.cache_read_input_tokens,
            latencyMs: Date.now() - runStartedAt,
            completedAt: new Date(),
          },
        });

        emit({
          type: "step",
          message: "AI shared guidance. Ask for a concrete draft when ready.",
        });
        emit({ type: "done", chatOnly: true });

        return {
          assistantText,
          thinkingText,
          applied: false,
        };
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
          variableSchema = sanitizeGeneratedVariableSchema(
            parseVariableSchemaJson(input.variableSchema),
          );
          assertStaticSubject(input.subject, variableSchema);
          emit({
            type: "meta",
            attempt: attempts,
            maxAttempts: 2,
            model: this.model,
          });
          emit({ type: "subject", value: input.subject });
          emit({ type: "step", message: "Rendering HTML preview..." });
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
                  fullCodeForRetry
                    ? `Current TSX (required for accurate retry):\n${buildCodeContextSnippet(fullCodeForRetry, CODE_CONTEXT_LIMIT)}`
                    : "",
                ].join("\n"),
              },
            ],
            systemBlocks,
            emit,
          });
          assistantText = retry.assistantText || assistantText;
          thinkingText = retry.thinkingText || thinkingText;
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

      const conversationTitle =
        kind === "INITIAL" && titleContext
          ? await this.conversationTitleAgent.generateTitle({
              prompt: titleContext.prompt,
              tone: titleContext.tone,
              audience: titleContext.audience,
              subject: input.subject,
              assistantText,
            })
          : undefined;
      if (conversationTitle) {
        emit({ type: "conversation_title", value: conversationTitle });
      }

      emit({ type: "step", message: "Generating preview screenshot..." });
      const previewUrl = await this.createAndPersistVariantPreview(
        variant.id,
        compiledHtml,
      );
      if (previewUrl) {
        emit({ type: "preview_url", value: previewUrl });
      } else {
        emit({
          type: "meta",
          warning: "Preview image generation failed; email HTML still saved.",
        });
      }

      await this.prisma.email.update({
        where: { id: emailId },
        data: {
          status: "READY",
          ...(conversationTitle ? { title: conversationTitle } : {}),
        },
      });

      const statusDone: GenerationRunStatus = "COMPLETED";
      await this.prisma.emailGenerationRun.update({
        where: { id: run.id },
        data: {
          status: statusDone,
          inputTokens: usageTotals.input_tokens,
          cachedTokens: usageTotals.cache_read_input_tokens,
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
        conversationTitle,
        compiledHtml: variant.compiledHtml,
        seq: variant.seq,
      });
      return {
        assistantText,
        thinkingText,
        componentCode: input.componentCode,
        variantId: variant.id,
        applied: true,
      };
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
  }): Promise<{
    content: Message["content"];
    usage: Message["usage"] | undefined;
    assistantText: string;
    thinkingText: string;
  }> {
    if (!this.anthropic) {
      throw new InternalServerErrorException("ANTHROPIC_API_KEY is not configured.");
    }

    const thinking = this.extendedThinkingConfig();
    const maxTokens = thinking ? 20_000 : 16_384;

    const stream = this.anthropic.messages.stream({
      model: this.model,
      max_tokens: maxTokens,
      ...(thinking ? { thinking } : {}),
      system: args.systemBlocks,
      tools: [INSPECT_WEBSITE_BRAND_TOOL, EMIT_EMAIL_TOOL],
      messages: args.modelMessages,
    });

    let lastComponentCode = "";
    let subjectEmitted = false;
    let thinkingText = "";
    let assistantText = "";

    stream.on("thinking", (delta: string) => {
      if (delta) {
        thinkingText += delta;
        args.emit({ type: "thinking-chunk", value: delta });
      }
    });

    stream.on("text", (delta: string) => {
      if (delta) {
        assistantText += delta;
        args.emit({ type: "assistant-chunk", value: delta });
      }
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

    const finalMessage = (await stream.finalMessage()) as unknown as Message;
    return {
      content: finalMessage.content,
      usage: finalMessage.usage,
      assistantText,
      thinkingText,
    };
  }
}
