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
  ContentBlockParam,
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
  mergeUserVariableOverrides,
  parseVariableSchemaJson,
} from "@madoo/shared";
import { PrismaService } from "../prisma/prisma.service";
import { BillingService } from "../billing/billing.service";
import { extractElementSnippet } from "../emails/tsx-visual-ops";
import {
  EMIT_EMAIL_TOOL,
  FIND_BRAND_IMAGES_TOOL,
  FIND_IMAGES_TOOL,
  GENERATE_CHART_TOOL,
  GET_EMAIL_ICONS_TOOL,
  GET_EMAIL_VERSION_TOOL,
  INSPECT_WEBSITE_BRAND_TOOL,
  VIEW_CURRENT_EMAIL_TOOL,
  buildQuickChartUrl,
} from "./generation.tools";
import {
  CHAT_HISTORY_LIMIT,
  CODE_CONTEXT_LIMIT,
  PREVIEW_MAX_ATTEMPTS,
  STATIC_INSTRUCTION,
  buildFewShotText,
} from "./generation.prompts";
import { ReactToHtmlService } from "./react-to-html.service";
import { ScreenshotService } from "./screenshot.service";
import { S3Service } from "../s3/s3.service";
import { assertPublicUrl } from "../common/ssrf-guard";
import { WebsiteBrandService } from "./website-brand.service";
import { ConversationTitleAgent } from "./conversation-title.agent";
import type { ChartToolInput } from "./generation.tools";
import {
  EmailVariantRetentionService,
  MAX_EMAIL_VERSIONS,
} from "../emails/email-variant-retention.service";
import {
  EMAIL_ICON_NAMES,
  EmailIconCatalogService,
  type EmailIconName,
  type EmailIconTone,
} from "./email-icon-catalog.service";
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
    private readonly variantRetention: EmailVariantRetentionService,
    private readonly emailIcons: EmailIconCatalogService,
  ) {
    const key = this.config.get<string>("ANTHROPIC_API_KEY");
    this.model =
      this.config.get<string>("ANTHROPIC_MODEL") ??
      "claude-sonnet-5";
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
        // SSRF guard: URLs originate from the model / find_images tool, so
        // validate the host (and every redirect hop) resolves to a public IP.
        res = await this.fetchImageFollowingRedirects(sourceUrl, controller.signal);
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

  /**
   * Fetch an image with `redirect: "manual"`, re-validating each hop against the
   * SSRF guard so a public URL cannot 302 into an internal host. Caps at 3 hops.
   */
  private async fetchImageFollowingRedirects(
    startUrl: string,
    signal: AbortSignal,
    maxHops = 3,
  ): Promise<Response> {
    let target = (await assertPublicUrl(startUrl)).toString();
    for (let hop = 0; hop <= maxHops; hop++) {
      const res = await fetch(target, {
        signal,
        redirect: "manual",
        headers: {
          // Browser-like UA so hotlink checks behave as in-app.
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
          Accept: "image/avif,image/webp,image/png,image/jpeg,*/*",
        },
      });
      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        if (!location || hop === maxHops) return res;
        const next = new URL(location, target).toString();
        target = (await assertPublicUrl(next)).toString();
        continue;
      }
      return res;
    }
    throw new Error("Too many redirects.");
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
   * Effort caps how much the model thinks/explores. It is the main cost driver,
   * so route it per run kind: INITIAL drafts get `high` (worth the extra design
   * quality on a blank canvas), EDIT and other kinds get `medium`. Override with
   * `ANTHROPIC_EFFORT_INITIAL` / `ANTHROPIC_EFFORT_EDIT`, then the shared
   * `ANTHROPIC_EFFORT`, then the per-kind default. Values: low|medium|high|max.
   */
  private effortLevel(kind: GenerationRunKind): "low" | "medium" | "high" | "max" {
    const perKindDefault: "high" | "medium" = kind === "INITIAL" ? "high" : "medium";
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

  /** Self-review is off unless `GENERATION_SELF_REVIEW=true`. */
  private selfReviewEnabled(): boolean {
    return this.config.get<string>("GENERATION_SELF_REVIEW") === "true";
  }

  /**
   * Load the workspace's persisted brand kit as a compact prompt block, or "" if
   * none exists. Placed in the volatile user prompt (never the cached system
   * blocks). Bounded to keep the prompt small.
   */
  private async loadWorkspaceBrandBlock(workspaceId: string): Promise<string> {
    try {
      const profile = await this.prisma.workspaceBrandProfile.findUnique({
        where: { workspaceId },
      });
      if (!profile) return "";
      const colors = Array.isArray(profile.colors)
        ? (profile.colors as unknown[]).map(String).slice(0, 6)
        : [];
      const fonts = Array.isArray(profile.fonts)
        ? (profile.fonts as unknown[]).map(String).slice(0, 4)
        : [];
      const block = [
        `Workspace brand kit (persisted from ${profile.url}):`,
        `- name: ${profile.brandName ?? "unknown"}, logo: ${profile.logoUrl ?? "none"}, colors: [${colors.join(", ")}], fonts: [${fonts.join(", ")}], tone: ${(profile.copyTone ?? "").slice(0, 160)}`,
        "Use it for visual direction unless the user asks for a different brand.",
      ].join("\n");
      return block.slice(0, 600);
    } catch {
      return "";
    }
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
    body: {
      instruction: string;
      baseVariantId?: string;
      imageUrls?: string[];
      selectedElement?: { nodeId: string; label: string };
    },
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
    const priorAssistantCount = await this.prisma.emailChatMessage.count({
      where: {
        emailId,
        workspaceId,
        role: "ASSISTANT",
      },
    });
    const isFirstInitialDraftTurn =
      ctx.variants.length === 0 && priorAssistantCount === 0;

    // Carry the prior conversation so a generation that follows chat-only turns
    // (e.g. the user answered the assistant's questions, then "go ahead") keeps
    // the full context instead of treating it as a brand-new conversation.
    const recentChat = await this.loadRecentChatContext(emailId);
    const hasPriorChat = recentChat !== "No previous chat context.";
    const brandKitBlock = await this.loadWorkspaceBrandBlock(workspaceId);

    const userPrompt = [
      isFirstInitialDraftTurn
        ? [
            "This is the first turn for a brand-new initial email draft.",
            "Decide whether the brief is specific enough to draft now.",
            "If key specifics are missing, ask 3-5 short clarifying questions and do not call emit_email this turn.",
            "If the brief is specific enough, draft immediately and call emit_email this turn.",
            "When unsure, prefer drafting over asking more questions.",
          ].join("\n")
        : [
            "This is not the first intake turn for this email.",
            "If the user answered the intake questions or asked you to use best judgment, generate the email now.",
          ].join("\n"),
      `User brief:\n${ctx.prompt}`,
      hasPriorChat
        ? `Conversation context (most recent first):\n${recentChat}`
        : "",
      brandKitBlock,
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
      briefForFewShot: ctx.prompt,
      modelMessages: [
        {
          role: "user",
          content: buildUserMessageContent(userPrompt, imageUrls),
        },
      ],
      titleContext: {
        prompt: ctx.prompt,
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
          : isFirstInitialDraftTurn
          ? [
              "Before I draft, quick questions:",
              "1. What is the main goal of this email?",
              "2. Who should receive it?",
              "3. What brand or website should it match?",
              "4. What offer, product, date, link, or detail must be included?",
              "5. What should the primary CTA say and link to?",
              "",
              'Reply with answers, or say "go" / "use your best judgment" and I will draft with smart defaults.',
            ].join("\n")
          : "I added some guidance above. Ask me for a concrete draft whenever you're ready."),
      groupId,
    });
  }

  private async runEdit(
    emailId: string,
    workspaceId: string,
    body: {
      instruction: string;
      baseVariantId?: string;
      imageUrls?: string[];
      selectedElement?: { nodeId: string; label: string };
    },
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
    let baseVariableSchema: unknown = ctx.variants[0]?.variableSchema ?? null;
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
      baseVariableSchema = v.variableSchema;
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

    // Visual-editor targeting: the user clicked an element in the preview, so
    // pin the edit to that exact node instead of letting the model guess which
    // part of the email the instruction refers to.
    let selectedElementBlock = "";
    if (body.selectedElement) {
      const selected = extractElementSnippet(
        baseCode,
        body.selectedElement.nodeId,
      );
      if (selected) {
        selectedElementBlock = [
          "",
          `The user visually selected this <${selected.name}> element in the preview. Apply the instruction to exactly this element (keep the rest of the email unchanged unless the instruction says otherwise):`,
          "```tsx",
          selected.snippet,
          "```",
        ].join("\n");
      }
    }

    const recentChat = await this.loadRecentChatContext(
      emailId,
      opts?.contextUpTo,
    );
    const codeContext = buildCodeContextSnippet(snapshot.componentCode, CODE_CONTEXT_LIMIT);

    const retainedVersions = await this.prisma.emailVariant.findMany({
      where: { emailId },
      orderBy: { seq: "desc" },
      take: MAX_EMAIL_VERSIONS,
      select: { seq: true },
    });
    const latestVersion = retainedVersions[0]?.seq ?? 0;
    const earliestVersion = retainedVersions.at(-1)?.seq ?? 0;
    const versionLine =
      latestVersion > 0
        ? `Retained saved versions: ${earliestVersion}..${latestVersion} (version ${latestVersion} is current/latest; at most ${MAX_EMAIL_VERSIONS} versions are kept). To reuse or revert to one in this range, call get_email_version with its number — do not guess its code.`
        : "No earlier saved versions yet.";

    const brandKitBlock = await this.loadWorkspaceBrandBlock(workspaceId);

    // The stored schema is where panel edits (uploaded images, value changes)
    // live — the code defaults can be stale, so the model must see these.
    let currentVariablesBlock = "";
    try {
      const currentSchema = parseVariableSchemaJson(baseVariableSchema);
      if (currentSchema.variables.length > 0) {
        currentVariablesBlock = [
          "",
          "Current variables (authoritative user-set values — keep each value verbatim in variableSchema unless the instruction changes that variable):",
          JSON.stringify(
            currentSchema.variables.map((variable) => ({
              name: variable.name,
              value: variable.default,
              scope: variable.scope,
            })),
          ),
        ].join("\n");
      }
    } catch {
      // Malformed stored schema — the model just won't get the block.
    }

    const editPrompt = [
      "Edit the current Madoo TSX email component according to the instruction.",
      `Instruction:\n${instruction}`,
      selectedElementBlock,
      currentVariablesBlock,
      brandKitBlock ? `\n${brandKitBlock}` : "",
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
      briefForFewShot: ctx.prompt,
      modelMessages: [
        {
          role: "user",
          content: buildUserMessageContent(editPrompt, body.imageUrls),
        },
      ],
      fullCodeForRetry: snapshot.componentCode,
      preserveVariablesFrom: {
        componentCode: baseCode,
        variableSchema: baseVariableSchema,
      },
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
    briefForFewShot: string;
    modelMessages: MessageParam[];
    fullCodeForRetry?: string;
    /** Base variant whose user-set variable values must survive the edit. */
    preserveVariablesFrom?: {
      componentCode: string;
      variableSchema: unknown;
    };
    titleContext?: {
      prompt: string;
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
      briefForFewShot,
      modelMessages,
      fullCodeForRetry,
      preserveVariablesFrom,
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
          text: buildFewShotText(briefForFewShot),
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
          kind,
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

        let toolResultContent: string | ContentBlockParam[];
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
          // Persist the brand kit for this workspace so later emails stay
          // on-brand. Fire-and-forget: a persistence failure must never break
          // generation.
          try {
            const colors = brandContext.colors.map((color) => color.hex);
            const copyTone =
              brandContext.valueProps[0] ??
              brandContext.copySnippets[0] ??
              brandContext.description ??
              null;
            const brandData = {
              url: brandContext.url,
              brandName: brandContext.brandName ?? null,
              logoUrl: brandContext.logoUrl ?? null,
              colors,
              fonts: brandContext.fonts,
              copyTone: copyTone ? copyTone.slice(0, 240) : null,
              imageUrls: brandContext.imageUrls,
              raw: brandContext as unknown as object,
            };
            await this.prisma.workspaceBrandProfile.upsert({
              where: { workspaceId },
              create: { workspaceId, ...brandData },
              update: brandData,
            });
          } catch (err) {
            console.warn(
              `[GenerationService] brand profile upsert failed: ${err instanceof Error ? err.message : String(err)}`,
            );
          }
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
        } else if (requestedTool.name === "get_email_icons") {
          const input = requestedTool.input as {
            names?: unknown;
            tone?: unknown;
          };
          const names = Array.isArray(input.names)
            ? [...new Set(input.names)]
            : [];
          const validNames = names.every(
            (name): name is EmailIconName =>
              typeof name === "string" &&
              EMAIL_ICON_NAMES.includes(name as EmailIconName),
          );
          const tone = input.tone;
          if (
            !validNames ||
            names.length < 1 ||
            names.length > 8 ||
            (tone !== "dark" && tone !== "light")
          ) {
            throw new BadRequestException(
              "get_email_icons requires 1-8 valid icon names and a dark or light tone.",
            );
          }
          emit({
            type: "tool_call",
            id: requestedTool.id,
            name: "get_email_icons",
            status: "running",
            title: "Preparing email icons",
            detail: names.join(", "),
          });
          const icons = await this.emailIcons.getIcons(
            names,
            tone as EmailIconTone,
          );
          emit({
            type: "tool_call",
            id: requestedTool.id,
            name: "get_email_icons",
            status: "done",
            title: "Prepared email icons",
            detail: `${icons.length} ${tone} icon${icons.length === 1 ? "" : "s"}`,
            images: icons.map((icon) => icon.url),
          });
          toolCalls.push({
            id: requestedTool.id,
            name: "get_email_icons",
            title: "Prepared email icons",
            detail: `${icons.length} ${tone} icon${icons.length === 1 ? "" : "s"}`,
            images: icons.map((icon) => icon.url),
          });
          toolResultContent = JSON.stringify({
            icons,
            usage:
              "Use each URL as a direct <Img src> constant at 20-28px display width. Keep alt text empty for decorative icons or use the supplied alt for linked social/contact icons.",
          });
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
          const retained = await this.prisma.emailVariant.findMany({
            where: { emailId },
            orderBy: { seq: "desc" },
            take: MAX_EMAIL_VERSIONS,
            select: { seq: true },
          });
          const latest = retained[0]?.seq ?? 0;
          const earliest = retained.at(-1)?.seq ?? 0;
          const variant =
            version >= earliest && version <= latest
              ? await this.prisma.emailVariant.findUnique({
                  where: { emailId_seq: { emailId, seq: version } },
                  select: {
                    seq: true,
                    subject: true,
                    componentCode: true,
                    variableSchema: true,
                  },
                })
              : null;
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
                  error: `Version ${version} is not retained.`,
                  retainedVersionRange:
                    latest > 0 ? { earliest, latest } : null,
                },
          );
        } else if (requestedTool.name === "view_current_email") {
          const input = requestedTool.input as { version?: unknown };
          const requestedVersion =
            typeof input.version === "number" ? Math.trunc(input.version) : undefined;
          emit({
            type: "tool_call",
            id: requestedTool.id,
            name: "view_current_email",
            status: "running",
            title: "Viewing current email design",
            detail: requestedVersion ? `Version ${requestedVersion}` : "Latest version",
          });
          const variant = await this.prisma.emailVariant.findFirst({
            where: {
              emailId,
              workspaceId,
              ...(requestedVersion && requestedVersion >= 1
                ? { seq: requestedVersion }
                : {}),
            },
            orderBy: { seq: "desc" },
            select: {
              seq: true,
              compiledHtml: true,
              componentCode: true,
              variableSchema: true,
            },
          });
          if (!variant) {
            emit({
              type: "tool_call",
              id: requestedTool.id,
              name: "view_current_email",
              status: "done",
              title: "No saved version to view",
              detail: requestedVersion ? `Version ${requestedVersion}` : "Latest version",
            });
            toolCalls.push({
              id: requestedTool.id,
              name: "view_current_email",
              title: "No saved version to view",
              detail: requestedVersion ? `Version ${requestedVersion}` : "Latest version",
            });
            toolResultContent = requestedVersion
              ? `Version ${requestedVersion} has not been saved yet. Emit the email first, then view it.`
              : "No saved version of this email exists yet. Emit the email first, then view it.";
          } else {
            const html =
              variant.compiledHtml && variant.compiledHtml.trim().length > 0
                ? variant.compiledHtml
                : this.reactToHtml.compile(
                    variant.componentCode,
                    buildRenderVariables(
                      parseVariableSchemaJson(variant.variableSchema),
                    ),
                  );
            const shot = await this.screenshot.screenshotHtml(html, {
              highlightVariables: false,
              maxHeight: 2400,
            });
            emit({
              type: "tool_call",
              id: requestedTool.id,
              name: "view_current_email",
              status: "done",
              title: "Viewed current email design",
              detail: `Version ${variant.seq}`,
            });
            toolCalls.push({
              id: requestedTool.id,
              name: "view_current_email",
              title: "Viewed current email design",
              detail: `Version ${variant.seq}`,
            });
            toolResultContent = [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/png",
                  data: shot.toString("base64"),
                },
              },
              {
                type: "text",
                text: `Screenshot of version ${variant.seq}. Review the visual design critically before responding.`,
              },
            ];
          }
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
          kind,
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
          if (preserveVariablesFrom) {
            variableSchema = mergeUserVariableOverrides(
              variableSchema,
              preserveVariablesFrom.componentCode,
              preserveVariablesFrom.variableSchema,
            );
          }
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
            kind,
            emit,
            // Force the tool so the retry can't come back as plain prose —
            // an unforced retry sometimes explained the failure in text and
            // surfaced "Retry did not return emit_email tool output".
            toolChoice: {
              type: "tool",
              name: "emit_email",
              disable_parallel_tool_use: true,
            },
          });
          assistantText = retry.assistantText || assistantText;
          thinkingText = retry.thinkingText || thinkingText;
          const retryTool = retry.content.find(
            (b) => b.type === "tool_use" && b.name === "emit_email",
          );
          if (!retryTool || retryTool.type !== "tool_use") {
            throw new BadRequestException(
              "The AI could not produce a corrected email this time — send the request again.",
            );
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

      // Self-review may replace this with an improved second variant below; the
      // "done" event and return value report whichever is final.
      let finalVariant: {
        id: string;
        seq: number;
        subject: string;
        compiledHtml: string;
      } = variant;
      let finalComponentCode = input.componentCode;

      const conversationTitle =
        kind === "INITIAL" && titleContext
          ? await this.conversationTitleAgent.generateTitle({
              prompt: titleContext.prompt,
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
      await this.variantRetention.prune(emailId);

      // Optional self-review pass (env-gated, default OFF): let the model SEE its
      // own rendered draft and revise once if it spots visual problems.
      if (kind === "INITIAL" && this.selfReviewEnabled()) {
        const reviewed = await this.runSelfReview({
          emailId,
          workspaceId,
          systemBlocks,
          componentCode: finalComponentCode,
          compiledHtml,
          emit,
          signal,
        });
        if (reviewed) {
          finalVariant = reviewed.variant;
          finalComponentCode = reviewed.componentCode;
          assistantText += reviewed.assistantText;
          usageTotals = {
            input_tokens: usageTotals.input_tokens + reviewed.usage.input_tokens,
            output_tokens: usageTotals.output_tokens + reviewed.usage.output_tokens,
            cache_creation_input_tokens:
              usageTotals.cache_creation_input_tokens +
              reviewed.usage.cache_creation_input_tokens,
            cache_read_input_tokens:
              usageTotals.cache_read_input_tokens +
              reviewed.usage.cache_read_input_tokens,
          };
          emit({ type: "token_usage", ...usageTotals });
        }
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
        variantId: finalVariant.id,
        subject: finalVariant.subject,
        conversationTitle,
        compiledHtml: finalVariant.compiledHtml,
        seq: finalVariant.seq,
      });
      return {
        assistantText,
        thinkingText,
        toolCalls,
        componentCode: finalComponentCode,
        variantId: finalVariant.id,
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
   * Env-gated self-review (Feature A): show the model a screenshot of its own
   * rendered draft and let it revise once. Returns the improved variant when it
   * chooses to re-emit, or null when it judges the draft final (or on any error
   * — self-review is strictly best-effort and never breaks the saved draft).
   */
  private async runSelfReview(args: {
    emailId: string;
    workspaceId: string;
    systemBlocks: MessageCreateParams["system"];
    componentCode: string;
    compiledHtml: string;
    emit: (p: Record<string, unknown>) => void;
    signal?: AbortSignal;
  }): Promise<{
    variant: { id: string; seq: number; subject: string; compiledHtml: string };
    componentCode: string;
    assistantText: string;
    usage: {
      input_tokens: number;
      output_tokens: number;
      cache_creation_input_tokens: number;
      cache_read_input_tokens: number;
    };
  } | null> {
    try {
      args.emit({ type: "step", message: "Reviewing the rendered design…" });
      const shot = await this.screenshot.screenshotHtml(args.compiledHtml, {
        highlightVariables: false,
        maxHeight: 2400,
      });
      const reviewMessages: MessageParam[] = [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/png",
                data: shot.toString("base64"),
              },
            },
            {
              type: "text",
              text: [
                "Here is the rendered result of your draft.",
                "If you see visual problems (spacing, contrast, hierarchy, image fit, imbalance), call emit_email once with an improved version; if it looks good, reply briefly that it is final.",
                "Current TSX:",
                buildCodeContextSnippet(args.componentCode, CODE_CONTEXT_LIMIT),
              ].join("\n"),
            },
          ],
        },
      ];
      const resp = await this.runStream({
        modelMessages: reviewMessages,
        systemBlocks: args.systemBlocks,
        kind: "INITIAL",
        emit: args.emit,
        signal: args.signal,
      });
      const usage = {
        input_tokens: resp.usage?.input_tokens ?? 0,
        output_tokens: resp.usage?.output_tokens ?? 0,
        cache_creation_input_tokens: resp.usage?.cache_creation_input_tokens ?? 0,
        cache_read_input_tokens: resp.usage?.cache_read_input_tokens ?? 0,
      };
      const toolBlock = resp.content.find(
        (b) => b.type === "tool_use" && b.name === "emit_email",
      );
      if (!toolBlock || toolBlock.type !== "tool_use") {
        // Model judged the draft final (or gathered no revision) — keep original.
        return null;
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
        return null;
      }
      const variableSchema = sanitizeGeneratedVariableSchema(
        parseVariableSchemaJson(input.variableSchema),
      );
      assertStaticSubject(input.subject, variableSchema);
      const compiledHtml = this.reactToHtml.compile(
        input.componentCode,
        buildRenderVariables(variableSchema),
      );
      const seq = await this.nextVariantSeq(args.emailId);
      const variant = await this.prisma.emailVariant.create({
        data: {
          workspaceId: args.workspaceId,
          emailId: args.emailId,
          seq,
          subject: input.subject,
          componentCode: input.componentCode,
          compiledHtml,
          variableSchema: variableSchema as object,
        },
      });
      args.emit({ type: "subject", value: variant.subject });
      const previewUrl = await this.createAndPersistVariantPreview(
        variant.id,
        compiledHtml,
      );
      if (previewUrl) args.emit({ type: "preview_url", value: previewUrl });
      await this.variantRetention.prune(args.emailId);
      return {
        variant: {
          id: variant.id,
          seq: variant.seq,
          subject: variant.subject,
          compiledHtml,
        },
        componentCode: input.componentCode,
        assistantText: resp.assistantText,
        usage,
      };
    } catch (err) {
      console.warn(
        `[GenerationService] self-review skipped: ${err instanceof Error ? err.message : String(err)}`,
      );
      return null;
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
    kind: GenerationRunKind;
    emit: (p: Record<string, unknown>) => void;
    signal?: AbortSignal;
    toolChoice?: MessageCreateParams["tool_choice"];
    allowTools?: boolean;
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
    kind: GenerationRunKind;
    emit: (p: Record<string, unknown>) => void;
    signal?: AbortSignal;
    toolChoice?: MessageCreateParams["tool_choice"];
    allowTools?: boolean;
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
    // Sonnet 5 tokenizes ~30% heavier than 4.6, so give both paths more headroom
    // (previously 20k / 16k). Still streams, so latency is unaffected.
    const maxTokens = thinking ? 32_000 : 24_000;
    const toolConfig =
      args.allowTools === false
        ? {}
        : {
            tools: [
              INSPECT_WEBSITE_BRAND_TOOL,
              FIND_BRAND_IMAGES_TOOL,
              FIND_IMAGES_TOOL,
              GET_EMAIL_ICONS_TOOL,
              GET_EMAIL_VERSION_TOOL,
              VIEW_CURRENT_EMAIL_TOOL,
              GENERATE_CHART_TOOL,
              EMIT_EMAIL_TOOL,
            ],
            tool_choice: args.toolChoice ?? {
              type: "auto",
              disable_parallel_tool_use: true,
            },
          };

    const stream = this.anthropic.messages.stream(
      {
      model: this.model,
      max_tokens: maxTokens,
      ...(thinking ? { thinking } : {}),
      output_config: { effort: this.effortLevel(args.kind) },
      system: args.systemBlocks,
      // The tool loop pairs a tool_result for exactly one tool_use per turn.
      // Parallel tool use (e.g. inspect_website_brand + emit_email together)
      // leaves the second tool_use unpaired on replay → Anthropic 400. Force
      // at most one tool call per assistant turn.
      ...toolConfig,
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
