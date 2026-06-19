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
  Tool,
} from "@anthropic-ai/sdk/resources/messages";
import type {
  EmailChatKind,
  EmailChatRole,
  GenerationRunKind,
  GenerationRunStatus,
} from "@prisma/client";
import { Observable } from "rxjs";
import { createHash, randomUUID } from "node:crypto";
import {
  buildRenderVariables,
  parseVariableSchemaJson,
  type VariableSchemaRoot,
} from "@madoo/shared";
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
  "componentCode must be valid TSX with a single default-exported component. Do NOT write any import statements — React and all email components are already available in scope. The components you may use as JSX tags are: Html, Head, Preview, Body, Container, Section, Row, Column, Text, Button, Hr, Img, Link. Just use them directly, e.g. <Body>…</Body>.",
  "Style every component with inline `style` objects (email-safe), exactly like the reference templates. Do not rely on Tailwind classes, external CSS, flexbox, grid, position, or float — email clients ignore them.",
  "EMAIL STRUCTURE (required for every email): wrap everything in <Html lang> with <Head /> and a one-line <Preview> inbox preheader, then <Body> (page background color) > <Container> centered at maxWidth 600 (use 560-600). Put a white content surface on the inner Sections.",
  "Inside the Container, stack clear <Section>s in this order: (1) brand header (logo <Img> or brand name), (2) hero — a small uppercase eyebrow <Text>, a large headline <Text>, and a supporting paragraph <Text>, (3) a primary <Button> CTA with href, (4) optional supporting content using <Row>/<Column> for columns or stacked cards, (5) a <Hr> divider, (6) a footer <Section> with a context line and an Unsubscribe <Link>.",
  "Use a consistent spacing scale with generous padding (Section padding around 28-44px horizontal and comfortable vertical rhythm); never cram content edge-to-edge.",
  "Typographic hierarchy: eyebrow ~11px uppercase, letter-spaced, muted; headline ~30-40px bold with tight line-height; body 15-16px with line-height ~1.6-1.75; footer ~11-12px muted.",
  "Build any multi-column layout with <Row>/<Column> (table-based) so it survives Outlook/Gmail and collapses gracefully on mobile; keep the email single-column overall.",
  "Always give <Img> an explicit width and meaningful alt text; give the <Button> inline padding and display:inline-block.",
  "Set borderRadius: 0 on every element by default — Container, Sections, cards, Buttons, Images, and dividers. Sharp 90-degree corners are the house style. Use a non-zero border-radius ONLY when the user explicitly asks for rounded/soft corners, or for an element that must be round (e.g. a circular avatar). When in doubt, keep it 0.",
  "Do not use emojis anywhere — not in the subject, headings, body, buttons, eyebrow, or footer. Use real words, and an <Img> when a visual is needed. Include an emoji only if the user explicitly asks for one.",
  "For a brand logo or hero image, render an <Img> bound to an image variable (role=image, scope=static) with a sensible placeholder image URL default, so the user can upload their own image in Madoo. Don't fake a logo with text/emoji when a real image fits.",
  "IMAGE ATTACHMENTS: The user may attach images, which you can SEE directly (vision). Each attached image also has a public hosted URL listed in the message text. When the email needs a visual that matches an attached image (logo, hero, product shot, banner, screenshot), use that exact URL as the <Img src> default — do NOT invent a placeholder URL and do NOT describe the image as text. Look at the attached image to choose alt text, layout, colors, and where it fits. If an attached image is clearly a logo, place it in the header; a product/hero shot belongs in the hero section.",
  "Even for 'simple' briefs keep the full skeleton (header, hero, CTA, footer with unsubscribe). Simple means less copy and fewer sections — not missing structure.",
  "Every meaningful link must point to a URL variable, never a bare href='#'. The primary CTA uses href={ctaUrl} with scope=static (the same destination for everyone). The footer unsubscribe link uses href={unsubscribeUrl} with scope=dynamic (role=url) so the sending platform can inject the real opt-out URL. Add unsubscribeUrl to variableSchema whenever the email has an unsubscribe link.",
  "Return variableSchema as an ARRAY of objects: { name, default, label?, role?, scope }.",
  "Each variable name must be camelCase and valid as a JS identifier.",
  "Every variable must include a string default value.",
  "role is optional and must only be one of: text, url, image, date. Never use role for variable identity such as recipient_name or company_name; put identity in name.",
  "Every variable must set scope: dynamic or static.",
  "Use scope=dynamic for personalized data that may be replaced outside Madoo (recipientName, companyName, unsubscribeUrl, planName, invoiceNumber, dates from CRM).",
  "Use scope=static for template constants that stay fixed across uses (heroTitle, offerText, footerLine, buttonLabel, feature bullets).",
  "Links/URLs are generally NOT dynamic: a URL variable (role=url) defaults to scope=static because the same link is shown to every recipient (ctaUrl, store/product/landing links, social links). Use scope=dynamic for a URL ONLY when each recipient gets a different value injected by the sending platform — primarily unsubscribeUrl (and per-recipient tracked links if the user explicitly asks for them).",
  "Variable discipline: use only a small set of meaningful merge fields, usually 3-6 and never more than 8 unless the user explicitly asks for many personalized fields.",
  "Create variables only for important personalized or template-specific parts: recipientName, companyName, productName, offer, discountCode, eventDate, ctaUrl, unsubscribeUrl, senderName.",
  "Do not create variables for CTA/button labels, closing text, feature bullets, generic body sentences, every headline fragment, colors, spacing, layout styles, decorative labels, or text that should stay fixed for all recipients.",
  "Banned variable examples: ctaLabel, ctaButtonLabel, buttonLabel, closingText, closingLine, feature1, feature2, feature3, featureOne, featureTwo, featureThree.",
  "If a value is not expected to change per recipient or template use, keep it as inline copy inside componentCode instead of adding it to variableSchema.",
  "variableSchema must match the component props exactly: every schema variable is destructured with a default, used in the component, and no extra props are invented.",
  "Component pattern must be: const Email = ({ ...defaults } = {}) => (<Html>...</Html>); export default Email;",
  "Subject line (emit_email.subject) must be normal marketing or transactional copy for the recipient. Never base it on environment variables, .env files, API keys, secrets, or other developer/deployment configuration topics—even if the user brief drifts there.",
  "When the user provides a website URL or asks to match a brand/site, call inspect_website_brand before emit_email.",
  "Use inspect_website_brand results for visual direction, copy tone, brand colors, fonts, CTA language, logo URL, and image URLs.",
  "When no image is attached for a needed visual, fall back to an image variable with a sensible placeholder URL default as described above.",
  "If brand inspection fails or returns partial context, continue with the available context and do not invent exact brand claims.",
  "CRITICAL: Do not never explain to the user how your internally work."
].join("\n");

/** Drop import lines so the few-shot examples match the "no imports" rule —
 *  the runtime injects React and all email components globally. */
function stripImports(code: string): string {
  return code
    .replace(/^\s*import[^\n]*\n/gm, "")
    .replace(/^\s+/, "");
}

const FEW_SHOT_TEXT = [
  "Reference templates (few-shot style and structure). Note: no import statements — use the components directly:",
  `Launch:\n${stripImports(SEED_TEMPLATES.launch.componentCode)}`,
  `Newsletter:\n${stripImports(SEED_TEMPLATES.newsletter.componentCode)}`,
  `Sale:\n${stripImports(SEED_TEMPLATES.sale.componentCode)}`,
  `Welcome:\n${stripImports(SEED_TEMPLATES.welcome.componentCode)}`,
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

const MAX_ATTACHED_IMAGES = 8;

/**
 * Build the user message content for a model turn. With attached images, returns
 * a content-block array: each image as a vision block (URL source) plus a text
 * block that restates the prompt and lists the hosted URLs so the model can wire
 * them straight into <Img src>. With no images, returns the plain text string.
 */
function buildUserMessageContent(
  text: string,
  imageUrls?: string[],
): MessageParam["content"] {
  const urls = (imageUrls ?? []).slice(0, MAX_ATTACHED_IMAGES);
  if (urls.length === 0) return text;

  const imageBlocks: ContentBlockParam[] = urls.map((url) => ({
    type: "image",
    source: { type: "url", url },
  }));

  const urlList = urls.map((url, index) => `${index + 1}. ${url}`).join("\n");
  const textBlock: ContentBlockParam = {
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


/** Transient Anthropic failures worth retrying: overloaded, 5xx, rate-limit,
 *  connection drops/timeouts. */
function isRetryableLlmError(error: unknown): boolean {
  if (error instanceof Anthropic.APIConnectionError) return true;
  if (error instanceof Anthropic.APIError) {
    const status = error.status;
    if (typeof status !== "number") return true;
    return status === 408 || status === 409 || status === 429 || status >= 500;
  }
  return false;
}

/** Turn an LLM/SDK failure into a short, human message — never the raw JSON
 *  error body, which otherwise lands verbatim in the chat. */
function formatLlmError(error: unknown): string {
  if (error instanceof Anthropic.APIError) {
    const status = error.status;
    if (status === 429) {
      return "The AI service is rate-limited right now. Please wait a moment and try again.";
    }
    if (status === 529) {
      return "The AI service is overloaded right now. Please try again shortly.";
    }
    if (typeof status === "number" && status >= 500) {
      return "The AI service hit a temporary error. Please try again.";
    }
    if (typeof status === "number" && status >= 400) {
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

  /** Extended thinking (model-level). Off if `ANTHROPIC_EXTENDED_THINKING=false`. */
  private extendedThinkingConfig(): ThinkingConfigParam | undefined {
    const raw = this.config.get<string>("ANTHROPIC_EXTENDED_THINKING");
    if (raw === "0" || raw === "false") {
      return undefined;
    }
    return { type: "adaptive", display: "summarized" };
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
    groupId?: string;
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
      },
    });
  }

  generateEmailStream(
    emailId: string,
    workspaceId: string,
    body?: { prompt?: string; imageUrls?: string[] },
  ): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
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
          );
          subscriber.complete();
        } catch (e) {
          subscriber.next({
            data: JSON.stringify({ type: "error", message: formatLlmError(e) }),
          } as MessageEvent);
          subscriber.complete();
        }
      })();
    });
  }

  editEmailStream(
    emailId: string,
    workspaceId: string,
    body: { instruction: string; baseVariantId?: string; imageUrls?: string[] },
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
          subscriber.next({
            data: JSON.stringify({ type: "error", message: formatLlmError(e) }),
          } as MessageEvent);
          subscriber.complete();
        }
      })();
    });
  }

  regenerateEmailStream(
    emailId: string,
    workspaceId: string,
  ): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      void (async () => {
        try {
          subscriber.next({
            data: JSON.stringify({
              type: "step",
              message: "Regenerating response...",
            }),
          } as MessageEvent);
          await this.regenerate(emailId, workspaceId, (payload) =>
            subscriber.next({ data: JSON.stringify(payload) } as MessageEvent),
          );
          subscriber.complete();
        } catch (e) {
          subscriber.next({
            data: JSON.stringify({ type: "error", message: formatLlmError(e) }),
          } as MessageEvent);
          subscriber.complete();
        }
      })();
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
      await this.runInitial(emailId, workspaceId, emit, groupId);
    } else {
      await this.runEdit(
        emailId,
        workspaceId,
        { instruction: lastUser.content },
        emit,
        { groupId, skipUserMessage: true, contextUpTo: lastUser.createdAt },
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
          },
        }),
      ]);
    }
    const ctx = await this.loadGenerationContext(emailId, workspaceId);

    const userPrompt = [
      `User brief:\n${ctx.prompt}`,
      ctx.tone ? `Tone: ${ctx.tone}` : "",
      ctx.length ? `Length preference: ${ctx.length}` : "",
      ctx.audience ? `Audience: ${ctx.audience}` : "",
      ctx.template?.componentCode
        ? `Reference HTML Coditor template (do not copy verbatim; adapt):\n${ctx.template.componentCode.slice(0, 12000)}`
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
    });

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

    if (!opts?.skipUserMessage) {
      await this.appendChatMessage({
        workspaceId,
        emailId,
        role: "USER",
        kind: "TEXT",
        content: instruction,
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
        response = await this.runStreamWithRetry({
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
