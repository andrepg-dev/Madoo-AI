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
} from "@anthropic-ai/sdk/resources/messages";
import type {
  EmailChatKind,
  EmailChatRole,
  GenerationRunKind,
  GenerationRunStatus,
} from "@prisma/client";
import { Observable } from "rxjs";
import { randomUUID } from "node:crypto";
import {
  buildRenderVariables,
  EmailChatToolCallPayloadSchema,
  parseVariableSchemaJson,
} from "@madoo/shared";
import { PrismaService } from "../prisma/prisma.service";
import { BillingService } from "../billing/billing.service";
import {
  EMIT_EMAIL_TOOL,
  FIND_BRAND_IMAGES_TOOL,
  FIND_IMAGES_TOOL,
  GENERATE_CHART_TOOL,
  GET_EMAIL_VERSION_TOOL,
  INSPECT_WEBSITE_BRAND_TOOL,
  buildQuickChartUrl,
} from "./generation.tools";
import {
  CHAT_HISTORY_LIMIT,
  CODE_CONTEXT_LIMIT,
  FEW_SHOT_TEXT,
  PREVIEW_MAX_ATTEMPTS,
  STATIC_INSTRUCTION,
} from "./generation.prompts";
import { ReactToHtmlService } from "./react-to-html.service";
import { ScreenshotService } from "./screenshot.service";
import { S3Service } from "../s3/s3.service";
import { WebsiteBrandService } from "./website-brand.service";
import { ConversationTitleAgent } from "./conversation-title.agent";
import type { ChartToolInput } from "./generation.tools";
import {
  GenerationAbortedError,
  assertStaticSubject,
  buildCodeContextSnippet,
  buildUserMessageContent,
  formatLlmError,
  isAbortError,
  isRetryableLlmError,
  sanitizeGeneratedVariableSchema,
  shortHash,
} from "./generation.util";


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
    this.anthropic = key
      ? new Anthropic({ apiKey: key, maxRetries: 3 })
      : null;
  }

  /**
   * Web images (from find_images) are often hotlink-protected, expiring, or
   * blocked to server-side fetchers — they render in the browser editor but
   * break in the screenshot pipeline, exported HTML, and recipient inboxes.
   * Download and rehost on our own S3 so every render path gets a stable URL.
   * Returns null on any failure so the caller can skip the candidate.
   */
  private async rehostImageUrl(sourceUrl: string): Promise<string | null> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8_000);
      let res: Response;
      try {
        res = await fetch(sourceUrl, {
          signal: controller.signal,
          headers: {
            // Browser-like UA + referer so hotlink checks behave as in-app.
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
            Accept: "image/avif,image/webp,image/png,image/jpeg,*/*",
          },
        });
      } finally {
        clearTimeout(timer);
      }
      if (!res.ok) return null;
      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.startsWith("image/")) return null;
      const arrayBuffer = await res.arrayBuffer();
      // Skip absurdly large assets (> 8 MB) to keep emails light.
      if (arrayBuffer.byteLength > 8 * 1024 * 1024) return null;
      const buffer = Buffer.from(arrayBuffer);
      return await this.s3.uploadBuffer(buffer, contentType, "found-images");
    } catch {
      return null;
    }
  }

  /** Extended thinking (model-level). Off if `ANTHROPIC_EXTENDED_THINKING=false`. */
  private extendedThinkingConfig(): ThinkingConfigParam | undefined {
    const raw = this.config.get<string>("ANTHROPIC_EXTENDED_THINKING");
    if (raw === "0" || raw === "false") {
      return undefined;
    }
    return { type: "adaptive", display: "summarized" };
  }

  /**
   * Effort caps how much the model thinks/explores. Sonnet 4.6 defaults to
   * `high` when unset — too much for email edits and the main cost driver.
   * Default `medium`; override with `ANTHROPIC_EFFORT` (low|medium|high|max).
   */
  private effortLevel(): "low" | "medium" | "high" | "max" {
    const raw = (this.config.get<string>("ANTHROPIC_EFFORT") ?? "medium").toLowerCase();
    if (raw === "low" || raw === "high" || raw === "max") return raw;
    return "medium";
  }

  private async loadRecentChatContext(
    emailId: string,
    upTo?: Date,
  ): Promise<string> {
    const rows = await this.prisma.emailChatMessage.findMany({
      where: {
        emailId,
        ...(upTo ? { createdAt: { lte: upTo } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: CHAT_HISTORY_LIMIT,
    });
    // Collapse response-version groups to their latest sibling (rows are desc,
    // so the first one seen per group is the newest) — older regenerations must
    // not leak back into the model's context.
    const seenGroups = new Set<string>();
    const deduped = rows.filter((row) => {
      if (!row.groupId) return true;
      if (seenGroups.has(row.groupId)) return false;
      seenGroups.add(row.groupId);
      return true;
    });
    if (!deduped.length) return "No previous chat context.";
    return deduped
      .reverse()
      .map((row) => {
        const role = row.role.toLowerCase();
        const compact = row.content.replace(/\s+/g, " ").trim().slice(0, 500);
        if (row.kind === "TOOL_CALL") {
          try {
            const parsed = EmailChatToolCallPayloadSchema.safeParse(
              JSON.parse(row.content),
            );
            if (parsed.success) {
              const call = parsed.data;
              const detail = call.detail ? `(${call.detail})` : "";
              const summary =
                call.summary ??
                (call.images?.length ? `${call.images.length} images` : "");
              return `${role}/tool_call: ${call.name}${detail}${summary ? ` -> ${summary}` : ""}`;
            }
          } catch {
            // Fall through to raw content.
          }
        }
        const kind = row.kind.toLowerCase();
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
    groupId?: string;
    imageUrls?: string[];
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
        groupId: args.groupId ?? null,
        imageUrls: args.imageUrls ?? [],
      },
    });
  }

  generateEmailStream(
    emailId: string,
    workspaceId: string,
    body?: { prompt?: string; imageUrls?: string[] },
  ): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      const ac = new AbortController();
      void (async () => {
        try {
          subscriber.next({
            data: JSON.stringify({ type: "step", message: "Preparing generation..." }),
          } as MessageEvent);
          await this.runInitial(
            emailId,
            workspaceId,
            (payload) =>
              subscriber.next({ data: JSON.stringify(payload) } as MessageEvent),
            undefined,
            body?.imageUrls,
            body?.prompt,
            ac.signal,
          );
          subscriber.complete();
        } catch (e) {
          if (isAbortError(e)) {
            subscriber.complete();
            return;
          }
          subscriber.next({
            data: JSON.stringify({ type: "error", message: formatLlmError(e) }),
          } as MessageEvent);
          subscriber.complete();
        }
      })();
      // Client disconnect / stop button → Nest unsubscribes → abort the stream.
      return () => ac.abort(new GenerationAbortedError());
    });
  }

  editEmailStream(
    emailId: string,
    workspaceId: string,
    body: { instruction: string; baseVariantId?: string; imageUrls?: string[] },
  ): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      const ac = new AbortController();
      void (async () => {
        try {
          subscriber.next({
            data: JSON.stringify({ type: "step", message: "Applying AI edits..." }),
          } as MessageEvent);
          await this.runEdit(
            emailId,
            workspaceId,
            body,
            (payload) =>
              subscriber.next({ data: JSON.stringify(payload) } as MessageEvent),
            undefined,
            ac.signal,
          );
          subscriber.complete();
        } catch (e) {
          if (isAbortError(e)) {
            subscriber.complete();
            return;
          }
          subscriber.next({
            data: JSON.stringify({ type: "error", message: formatLlmError(e) }),
          } as MessageEvent);
          subscriber.complete();
        }
      })();
      return () => ac.abort(new GenerationAbortedError());
    });
  }

  regenerateEmailStream(
    emailId: string,
    workspaceId: string,
  ): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      const ac = new AbortController();
      void (async () => {
        try {
          subscriber.next({
            data: JSON.stringify({
              type: "step",
              message: "Regenerating response...",
            }),
          } as MessageEvent);
          await this.regenerate(
            emailId,
            workspaceId,
            (payload) =>
              subscriber.next({ data: JSON.stringify(payload) } as MessageEvent),
            ac.signal,
          );
          subscriber.complete();
        } catch (e) {
          if (isAbortError(e)) {
            subscriber.complete();
            return;
          }
          subscriber.next({
            data: JSON.stringify({ type: "error", message: formatLlmError(e) }),
          } as MessageEvent);
          subscriber.complete();
        }
      })();
      return () => ac.abort(new GenerationAbortedError());
    });
  }

  /**
   * Re-run the latest turn's instruction, appending a new assistant response as
   * a sibling of the previous one (same `groupId`) so the UI can offer version
   * navigation. The response being regenerated is excluded from the model's
   * context so the new attempt is independent.
   */
  async regenerate(
    emailId: string,
    workspaceId: string,
    emit: (p: Record<string, unknown>) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    await this.assertEmailInWorkspace(emailId, workspaceId);

    const rows = await this.prisma.emailChatMessage.findMany({
      where: { emailId },
      orderBy: { createdAt: "asc" },
    });
    const userMessages = rows.filter((row) => row.role === "USER");
    const lastUser = userMessages[userMessages.length - 1];
    if (!lastUser) {
      throw new BadRequestException("Nothing to regenerate yet.");
    }

    // Assistant rows after the last user message are the turn being regenerated.
    // Group them so the existing + new responses become navigable siblings.
    const turnAssistantRows = rows.filter(
      (row) => row.role === "ASSISTANT" && row.createdAt > lastUser.createdAt,
    );
    let groupId = turnAssistantRows.find((row) => row.groupId)?.groupId ?? null;
    if (!groupId) {
      groupId = randomUUID();
      if (turnAssistantRows.length) {
        await this.prisma.emailChatMessage.updateMany({
          where: { id: { in: turnAssistantRows.map((row) => row.id) } },
          data: { groupId },
        });
      }
    }

    const isFirstTurn =
      userMessages.length === 1 && rows[0]?.id === lastUser.id;
    if (isFirstTurn) {
      await this.runInitial(
        emailId,
        workspaceId,
        emit,
        groupId,
        undefined,
        undefined,
        signal,
      );
    } else {
      await this.runEdit(
        emailId,
        workspaceId,
        { instruction: lastUser.content },
        emit,
        { groupId, skipUserMessage: true, contextUpTo: lastUser.createdAt },
        signal,
      );
    }
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
        const buffer = await this.screenshot.screenshotHtml(compiledHtml, {
          highlightVariables: true,
        });
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
    groupId?: string,
    imageUrls?: string[],
    promptOverride?: string,
    signal?: AbortSignal,
  ): Promise<void> {
    await this.billing.assertCanGenerate(workspaceId);
    await this.assertEmailInWorkspace(emailId, workspaceId);
    const replacementPrompt = promptOverride?.trim();
    if (replacementPrompt) {
      await this.prisma.$transaction([
        this.prisma.email.update({
          where: { id: emailId },
          data: { prompt: replacementPrompt },
        }),
        this.prisma.emailChatMessage.create({
          data: {
            workspaceId,
            emailId,
            role: "USER",
            kind: "TEXT",
            content: replacementPrompt,
            imageUrls: imageUrls ?? [],
          },
        }),
      ]);
    } else if (imageUrls?.length) {
      // First generation from the home flow: images are uploaded after the brief
      // is created, so attach them to that latest user message for restore.
      const brief = await this.prisma.emailChatMessage.findFirst({
        where: { emailId, workspaceId, role: "USER" },
        orderBy: { createdAt: "desc" },
      });
      if (brief) {
        await this.prisma.emailChatMessage.update({
          where: { id: brief.id },
          data: { imageUrls },
        });
      }
    }
    const ctx = await this.loadGenerationContext(emailId, workspaceId);

    // Carry the prior conversation so a generation that follows chat-only turns
    // (e.g. the user answered the assistant's questions, then "go ahead") keeps
    // the full context instead of treating it as a brand-new conversation.
    const recentChat = await this.loadRecentChatContext(emailId);
    const hasPriorChat = recentChat !== "No previous chat context.";

    const userPrompt = [
      `User brief:\n${ctx.prompt}`,
      ctx.tone ? `Tone: ${ctx.tone}` : "",
      ctx.length ? `Length preference: ${ctx.length}` : "",
      ctx.audience ? `Audience: ${ctx.audience}` : "",
      hasPriorChat
        ? `Conversation context (most recent first):\n${recentChat}`
        : "",
      ctx.template?.componentCode
        ? `Reference Madoo email template (do not copy verbatim; adapt):\n${ctx.template.componentCode.slice(0, 12000)}`
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
          content: buildUserMessageContent(userPrompt, imageUrls),
        },
      ],
      titleContext: {
        prompt: ctx.prompt,
        tone: ctx.tone,
        audience: ctx.audience,
      },
      emit,
      signal,
    });

    for (const call of result.toolCalls) {
      await this.appendChatMessage({
        workspaceId,
        emailId,
        role: "ASSISTANT",
        kind: "TOOL_CALL",
        content: JSON.stringify(call),
        groupId,
      });
    }

    await this.appendChatMessage({
      workspaceId,
      emailId,
      role: "ASSISTANT",
      kind: "THINKING",
      content: result.thinkingText,
      groupId,
    });
    // Always persist a conversational reply. With the emit_email tool the model
    // often returns an empty text block; without this fallback the streamed
    // reply would vanish on the next chat refetch, leaving a lone user message.
    await this.appendChatMessage({
      workspaceId,
      emailId,
      role: "ASSISTANT",
      kind: "TEXT",
      content:
        result.assistantText.trim() ||
        (result.applied
          ? "I drafted your email — open the preview on the right to review it, then tell me what you'd like to adjust."
          : "I added some guidance above. Ask me for a concrete draft whenever you're ready."),
      groupId,
    });
  }

  private async runEdit(
    emailId: string,
    workspaceId: string,
    body: { instruction: string; baseVariantId?: string; imageUrls?: string[] },
    emit: (p: Record<string, unknown>) => void,
    opts?: { groupId?: string; skipUserMessage?: boolean; contextUpTo?: Date },
    signal?: AbortSignal,
  ): Promise<void> {
    // Each edit/chat message consumes one AI credit, same as an initial generation.
    await this.billing.assertCanGenerate(workspaceId);
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
    const recentChat = await this.loadRecentChatContext(
      emailId,
      opts?.contextUpTo,
    );
    const codeContext = buildCodeContextSnippet(snapshot.componentCode, CODE_CONTEXT_LIMIT);

    const latestVariant = await this.prisma.emailVariant.findFirst({
      where: { emailId },
      orderBy: { seq: "desc" },
      select: { seq: true },
    });
    const versionCount = latestVariant?.seq ?? 0;
    const versionLine =
      versionCount > 0
        ? `Saved versions: 1..${versionCount} (version ${versionCount} is the current/latest). To reuse or revert to an earlier one, call get_email_version with its number — do not guess its code.`
        : "No earlier saved versions yet.";

    const editPrompt = [
      "Edit the current Madoo TSX email component according to the instruction.",
      `Instruction:\n${instruction}`,
      "",
      versionLine,
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

    if (!opts?.skipUserMessage) {
      await this.appendChatMessage({
        workspaceId,
        emailId,
        role: "USER",
        kind: "TEXT",
        content: instruction,
        imageUrls: body.imageUrls,
      });
    }

    const result = await this.executeAnthropicTurn({
      emailId,
      workspaceId,
      kind: "EDIT",
      modelMessages: [
        {
          role: "user",
          content: buildUserMessageContent(editPrompt, body.imageUrls),
        },
      ],
      fullCodeForRetry: snapshot.componentCode,
      emit,
      signal,
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

    for (const call of result.toolCalls) {
      await this.appendChatMessage({
        workspaceId,
        emailId,
        role: "ASSISTANT",
        kind: "TOOL_CALL",
        content: JSON.stringify(call),
        groupId: opts?.groupId,
      });
    }

    await this.appendChatMessage({
      workspaceId,
      emailId,
      role: "ASSISTANT",
      kind: "THINKING",
      content: result.thinkingText,
      groupId: opts?.groupId,
    });
    await this.appendChatMessage({
      workspaceId,
      emailId,
      role: "ASSISTANT",
      kind: "TEXT",
      content:
        result.assistantText.trim() ||
        (result.applied
          ? "Done — I updated the email. Check the preview and tell me the next change."
          : "I couldn't turn that into an edit. Try rephrasing what you'd like changed."),
      groupId: opts?.groupId,
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
    signal?: AbortSignal;
  }): Promise<{
    assistantText: string;
    thinkingText: string;
    toolCalls: Array<{
      id: string;
      name: string;
      title: string;
      detail?: string;
      summary?: string;
      images?: string[];
    }>;
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
      signal,
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
      const toolCalls: Array<{
        id: string;
        name: string;
        title: string;
        detail?: string;
        summary?: string;
        images?: string[];
      }> = [];
      let turnMessages = [...modelMessages];

      for (let toolTurn = 0; toolTurn < 4; toolTurn += 1) {
        if (signal?.aborted) throw new GenerationAbortedError();
        response = await this.runStreamWithRetry({
          modelMessages: turnMessages,
          systemBlocks,
          emit,
          signal,
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

        let toolResultContent: string;
        if (requestedTool.name === "inspect_website_brand") {
          const input = requestedTool.input as { url?: unknown; purpose?: unknown };
          if (typeof input.url !== "string" || !input.url.trim()) {
            throw new BadRequestException("inspect_website_brand requires a URL.");
          }
          const url = input.url.trim();
          emit({
            type: "tool_call",
            id: requestedTool.id,
            name: "inspect_website_brand",
            status: "running",
            title: "Inspecting brand site",
            detail: url,
          });
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
          emit({
            type: "tool_call",
            id: requestedTool.id,
            name: "inspect_website_brand",
            status: "done",
            title: "Inspected brand site",
            detail: brandContext.url,
            summary: [
              brandContext.brandName ?? undefined,
              `${brandContext.colors.length} colors`,
              `${brandContext.imageUrls.length} images`,
            ]
              .filter(Boolean)
              .join(" · "),
          });
          toolCalls.push({
            id: requestedTool.id,
            name: "inspect_website_brand",
            title: "Inspected brand site",
            detail: brandContext.url,
            summary: [
              brandContext.brandName ?? undefined,
              `${brandContext.colors.length} colors`,
              `${brandContext.imageUrls.length} images`,
            ]
              .filter(Boolean)
              .join(" · "),
          });
          toolResultContent = JSON.stringify(brandContext);
        } else if (requestedTool.name === "find_brand_images") {
          const input = requestedTool.input as { url?: unknown; query?: unknown };
          if (typeof input.url !== "string" || !input.url.trim()) {
            throw new BadRequestException("find_brand_images requires a URL.");
          }
          const url = input.url.trim();
          const query = typeof input.query === "string" ? input.query.trim() : "";
          emit({
            type: "tool_call",
            id: requestedTool.id,
            name: "find_brand_images",
            status: "running",
            title: "Finding brand images",
            detail: query ? `${url} · ${query}` : url,
          });
          const found = await this.websiteBrand.findBrandImages(url, query);
          const rehosted = await Promise.all(
            found.slice(0, 4).map(async (img) => {
              const hostedUrl = await this.rehostImageUrl(img.url);
              return hostedUrl
                ? { url: hostedUrl, description: img.description }
                : null;
            }),
          );
          const images = rehosted.filter((img) => img !== null) as Array<{
            url: string;
            description?: string;
          }>;
          emit({
            type: "image_search",
            query: query || url,
            imageCount: images.length,
          });
          emit({
            type: "tool_call",
            id: requestedTool.id,
            name: "find_brand_images",
            status: "done",
            title: "Found brand images",
            detail: query ? `${url} · ${query}` : url,
            summary: images.length
              ? `Found ${images.length} brand image${images.length === 1 ? "" : "s"}`
              : "No brand images found — fall back if needed",
            images: images.slice(0, 4).map((img) => img.url),
          });
          toolCalls.push({
            id: requestedTool.id,
            name: "find_brand_images",
            title: "Found brand images",
            detail: query ? `${url} · ${query}` : url,
            summary: images.length
              ? `Found ${images.length} brand image${images.length === 1 ? "" : "s"}`
              : "No brand images found — fall back if needed",
            images: images.slice(0, 4).map((img) => img.url),
          });
          toolResultContent = JSON.stringify(
            images.length
              ? { images }
              : {
                  images: [],
                  note: "No brand images found. Use attached images first, then stock images only if needed.",
                },
          );
        } else if (requestedTool.name === "find_images") {
          const input = requestedTool.input as { query?: unknown };
          if (typeof input.query !== "string" || !input.query.trim()) {
            throw new BadRequestException("find_images requires a query.");
          }
          const query = input.query.trim();
          emit({
            type: "tool_call",
            id: requestedTool.id,
            name: "find_images",
            status: "running",
            title: "Searching images",
            detail: query,
          });
          const found = await this.websiteBrand.searchImages(query);
          // Rehost on our S3 so the chosen image renders everywhere (screenshot,
          // export, inbox) — raw web URLs are hotlink-protected and break.
          const rehosted = await Promise.all(
            found.slice(0, 4).map(async (img) => {
              const url = await this.rehostImageUrl(img.url);
              return url
                ? { url, description: img.description }
                : null;
            }),
          );
          const images = rehosted.filter((img) => img !== null) as Array<{
            url: string;
            description?: string;
          }>;
          emit({ type: "image_search", query, imageCount: images.length });
          emit({
            type: "tool_call",
            id: requestedTool.id,
            name: "find_images",
            status: "done",
            title: "Searched images",
            detail: query,
            summary: images.length
              ? `Found ${images.length} image${images.length === 1 ? "" : "s"}`
              : "No images found — using a placeholder",
            images: images.slice(0, 4).map((img) => img.url),
          });
          toolCalls.push({
            id: requestedTool.id,
            name: "find_images",
            title: "Searched images",
            detail: query,
            summary: images.length
              ? `Found ${images.length} image${images.length === 1 ? "" : "s"}`
              : "No images found — using a placeholder",
            images: images.slice(0, 4).map((img) => img.url),
          });
          toolResultContent = JSON.stringify(
            images.length
              ? { images }
              : { images: [], note: "No images found. Use a sensible placeholder image URL instead." },
          );
        } else if (requestedTool.name === "get_email_version") {
          const input = requestedTool.input as { version?: unknown };
          const version =
            typeof input.version === "number" ? Math.trunc(input.version) : NaN;
          if (!Number.isFinite(version) || version < 1) {
            throw new BadRequestException(
              "get_email_version requires a positive version number.",
            );
          }
          emit({
            type: "tool_call",
            id: requestedTool.id,
            name: "get_email_version",
            status: "running",
            title: "Reading version",
            detail: `Version ${version}`,
          });
          const variant = await this.prisma.emailVariant.findUnique({
            where: { emailId_seq: { emailId, seq: version } },
            select: {
              seq: true,
              subject: true,
              componentCode: true,
              variableSchema: true,
            },
          });
          const latest = await this.prisma.emailVariant.findFirst({
            where: { emailId },
            orderBy: { seq: "desc" },
            select: { seq: true },
          });
          emit({
            type: "tool_call",
            id: requestedTool.id,
            name: "get_email_version",
            status: "done",
            title: variant
              ? `Read version ${version}`
              : `Version ${version} not found`,
            detail: `Version ${version}`,
          });
          toolCalls.push({
            id: requestedTool.id,
            name: "get_email_version",
            title: variant
              ? `Read version ${version}`
              : `Version ${version} not found`,
            detail: `Version ${version}`,
          });
          toolResultContent = JSON.stringify(
            variant
              ? {
                  version: variant.seq,
                  subject: variant.subject,
                  componentCode: variant.componentCode,
                  variableSchema: variant.variableSchema,
                }
              : {
                  error: `Version ${version} does not exist.`,
                  latestVersion: latest?.seq ?? 0,
                },
          );
        } else if (requestedTool.name === "generate_chart") {
          const input = requestedTool.input as ChartToolInput;
          if (!input.type || !Array.isArray(input.datasets) || input.datasets.length === 0) {
            throw new BadRequestException(
              "generate_chart requires a type and at least one dataset.",
            );
          }
          emit({
            type: "tool_call",
            id: requestedTool.id,
            name: "generate_chart",
            status: "running",
            title: "Generating chart",
            detail: input.title || input.type,
          });
          const sourceUrl = buildQuickChartUrl(input);
          const hosted = await this.rehostImageUrl(sourceUrl);
          const chartUrl = hosted ?? sourceUrl;
          emit({
            type: "tool_call",
            id: requestedTool.id,
            name: "generate_chart",
            status: "done",
            title: "Generated chart",
            detail: input.title || input.type,
            summary: `${input.type} chart`,
            images: [chartUrl],
          });
          toolCalls.push({
            id: requestedTool.id,
            name: "generate_chart",
            title: "Generated chart",
            detail: input.title || input.type,
            summary: `${input.type} chart`,
            images: [chartUrl],
          });
          toolResultContent = JSON.stringify({
            chartUrl,
            type: input.type,
            note: "Use this URL as the <Img src> default (give it an explicit width and descriptive alt). It is a static PNG safe for all email clients.",
          });
        } else {
          throw new BadRequestException(`Unsupported tool requested: ${requestedTool.name}`);
        }

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
                content: toolResultContent,
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
        // The tool-turn budget ran out while the model was still gathering
        // context (e.g. several find_images turns). The last tool result is
        // already appended to turnMessages, so do one final turn forcing
        // emit_email rather than discarding all that work.
        emit({ type: "step", message: "Finalizing the email…" });
        response = await this.runStreamWithRetry({
          modelMessages: turnMessages,
          systemBlocks,
          emit,
          signal,
          toolChoice: {
            type: "tool",
            name: "emit_email",
            disable_parallel_tool_use: true,
          },
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
        emit({ type: "token_usage", ...usageTotals });
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
          toolCalls,
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
          compiledHtml = this.reactToHtml.compile(
            input.componentCode,
            buildRenderVariables(variableSchema),
          );
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
        toolCalls,
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

  /**
   * Run a model turn, retrying transient Anthropic errors (overloaded / 5xx /
   * rate limit / connection drops). A restart is only attempted while nothing
   * user-visible has streamed yet, so a retry can never duplicate assistant
   * text, the subject, or the email code that already reached the client.
   */
  private async runStreamWithRetry(args: {
    modelMessages: MessageParam[];
    systemBlocks: MessageCreateParams["system"];
    emit: (p: Record<string, unknown>) => void;
    signal?: AbortSignal;
    toolChoice?: MessageCreateParams["tool_choice"];
  }): Promise<Awaited<ReturnType<typeof this.runStream>>> {
    const maxAttempts = 3;
    for (let attempt = 1; ; attempt += 1) {
      let emittedVisible = false;
      const guardedEmit = (payload: Record<string, unknown>) => {
        const type = payload.type;
        if (
          type === "assistant-chunk" ||
          type === "code-chunk" ||
          type === "subject"
        ) {
          emittedVisible = true;
        }
        args.emit(payload);
      };

      try {
        return await this.runStream({ ...args, emit: guardedEmit });
      } catch (error) {
        // User aborted (stop button / disconnect) — don't retry, just bubble up.
        if (args.signal?.aborted || isAbortError(error)) {
          throw error;
        }
        if (
          attempt >= maxAttempts ||
          emittedVisible ||
          !isRetryableLlmError(error)
        ) {
          throw error;
        }
        const message = error instanceof Error ? error.message : String(error);
        console.warn(
          `[GenerationService] Anthropic stream attempt ${attempt} failed (retryable): ${message}; retrying`,
        );
        args.emit({ type: "step", message: "Retrying the AI service…" });
        await new Promise((resolve) => setTimeout(resolve, 800 * attempt));
      }
    }
  }

  private async runStream(args: {
    modelMessages: MessageParam[];
    systemBlocks: MessageCreateParams["system"];
    emit: (p: Record<string, unknown>) => void;
    signal?: AbortSignal;
    toolChoice?: MessageCreateParams["tool_choice"];
  }): Promise<{
    content: Message["content"];
    usage: Message["usage"] | undefined;
    assistantText: string;
    thinkingText: string;
  }> {
    if (!this.anthropic) {
      throw new InternalServerErrorException("ANTHROPIC_API_KEY is not configured.");
    }

    // Forcing a specific tool (or "any") is incompatible with extended thinking
    // on Anthropic — it 400s. Disable thinking when we force emit_email.
    const forcedTool =
      args.toolChoice?.type === "tool" || args.toolChoice?.type === "any";
    const thinking = forcedTool ? undefined : this.extendedThinkingConfig();
    const maxTokens = thinking ? 20_000 : 16_384;

    const stream = this.anthropic.messages.stream(
      {
      model: this.model,
      max_tokens: maxTokens,
      ...(thinking ? { thinking } : {}),
      output_config: { effort: this.effortLevel() },
      system: args.systemBlocks,
      tools: [
        INSPECT_WEBSITE_BRAND_TOOL,
        FIND_BRAND_IMAGES_TOOL,
        FIND_IMAGES_TOOL,
        GET_EMAIL_VERSION_TOOL,
        GENERATE_CHART_TOOL,
        EMIT_EMAIL_TOOL,
      ],
      // The tool loop pairs a tool_result for exactly one tool_use per turn.
      // Parallel tool use (e.g. inspect_website_brand + emit_email together)
      // leaves the second tool_use unpaired on replay → Anthropic 400. Force
      // at most one tool call per assistant turn.
      tool_choice: args.toolChoice ?? { type: "auto", disable_parallel_tool_use: true },
      messages: args.modelMessages,
      },
      args.signal ? { signal: args.signal } : undefined,
    );

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
