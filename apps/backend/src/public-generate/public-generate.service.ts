import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Observable } from "rxjs";
import {
  type PublicGenerateInput,
  type PublicGenerateResult,
} from "@madoo/shared";
import { PrismaService } from "../prisma/prisma.service";
import { EmailsService } from "../emails/emails.service";
import { GenerationService } from "../generation/generation.service";
import { AnonRateLimiter } from "./anon-rate-limit";
import { AnonSessionService } from "./anon-session.service";

const ANON_EMAIL = "anon@madoo.internal";
const ANON_WS_NAME = "Anonymous (MCP)";

@Injectable()
export class PublicGenerateService {
  private anon: { userId: string; workspaceId: string } | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly emails: EmailsService,
    private readonly generation: GenerationService,
    private readonly limiter: AnonRateLimiter,
    private readonly sessions: AnonSessionService,
    private readonly config: ConfigService,
  ) {}

  /**
   * SSE variant of `generate`. Forwards the same progress payloads the platform
   * editor consumes, then a terminal `result` / `gate` / `error` event so the
   * MCP server can turn them into progress notifications for the chat client.
   */
  generateStream(
    input: PublicGenerateInput,
    ip: string,
  ): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      const send = (payload: Record<string, unknown>) =>
        subscriber.next({ data: JSON.stringify(payload) } as MessageEvent);

      void (async () => {
        try {
          send({ type: "step", message: "Starting your email…" });
          const result = await this.generate(input, ip, send);
          send({ type: "result", result });
        } catch (err) {
          if (
            err instanceof HttpException &&
            err.getStatus() === HttpStatus.PAYMENT_REQUIRED
          ) {
            const body = err.getResponse();
            send({
              type: "gate",
              ...(typeof body === "object" && body !== null ? body : {}),
            });
          } else {
            send({
              type: "error",
              message:
                err instanceof HttpException
                  ? extractMessage(err.getResponse())
                  : err instanceof Error
                    ? err.message
                    : "Generation failed.",
            });
          }
        }
        subscriber.complete();
      })();
    });
  }

  async generate(
    input: PublicGenerateInput,
    ip: string,
    emit: (p: Record<string, unknown>) => void = () => {},
  ): Promise<PublicGenerateResult> {
    // Free allowance is per MCP conversation (see AnonSessionService). Checked
    // before the rate limiter so a gated call doesn't consume a daily slot.
    const session = this.sessions.read(input.continuationToken);
    if (session.used >= this.sessions.freeLimit) {
      throw new HttpException(
        {
          requiresSignIn: true,
          message: `You've used your ${this.sessions.freeLimit} free Madoo emails here. Create a free account to keep generating, edit this design, and send it.`,
          signInUrl: this.signInUrl(session.lastPublicId),
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    const gate = this.limiter.tryConsume(ip);
    if (!gate.ok) throw new BadRequestException(gate.reason);

    try {
      const { userId, workspaceId } = await this.ensureAnonAccount();
      const prompt = buildPrompt(input);

      const email = await this.emails.create(workspaceId, userId, { prompt });
      await this.generation.generateAnonymousToCompletion(
        email.id,
        workspaceId,
        undefined,
        emit,
      );

      // A turn that came back as prose only (or failed validation) leaves the
      // email with no variant — sharing that would hand the caller an empty
      // preview. Retry once with an explicit draft-now instruction.
      if ((await this.variantCount(email.id)) === 0) {
        emit({ type: "step", message: "Retrying the draft…" });
        await this.generation.generateAnonymousToCompletion(
          email.id,
          workspaceId,
          `${prompt}\n\nDraft the email now using your best judgment. Do not ask questions.`,
          emit,
        );
      }
      if ((await this.variantCount(email.id)) === 0) {
        throw new InternalServerErrorException(
          "Madoo could not draft this email. Try again with a bit more detail in the brief.",
        );
      }

      emit({ type: "step", message: "Publishing the preview link…" });
      const share = await this.emails.setShare(email.id, workspaceId, userId, {
        visibility: "PUBLIC",
      });
      if (!share.publicId) {
        throw new InternalServerErrorException("Failed to mint share link.");
      }

      const subject = await this.watermarkLatestVariant(email.id);

      const utm = encodeURIComponent(this.config.get<string>("MCP_UTM_SOURCE") ?? "mcp");
      // Self-contained backend view route — renders the email regardless of
      // frontend deploy state (the marketing site has no /share route).
      const previewUrl = `${this.apiUrl()}/public/emails/${share.publicId}/view`;
      // Edit link must land on the gated client app's public /share route, which
      // renders this exact email and offers the "Make yours" path into the
      // editor. The old landing-homepage `?ref=` link went nowhere — nothing
      // consumed the ref, so it just dropped users on the marketing home.
      const ctaUrl = `${this.appUrl()}/share/${share.publicId}?utm_source=${utm}&utm_medium=connector`;

      const used = session.used + 1;
      return {
        publicId: share.publicId,
        previewUrl,
        ctaUrl,
        subject,
        continuationToken: this.sessions.issue({
          used,
          lastPublicId: share.publicId,
        }),
        freeRemaining: Math.max(0, this.sessions.freeLimit - used),
        signInUrl: this.signInUrl(share.publicId),
      };
    } catch (err) {
      // Don't burn a user's free quota on our failure.
      this.limiter.refund(ip);
      throw err;
    }
  }

  /**
   * Where a gated caller is sent to sign in. Their last generated email is the
   * best landing spot — the /share page renders it and offers "Make yours",
   * which is the account-creation entry point.
   */
  private signInUrl(lastPublicId?: string): string {
    const utm = encodeURIComponent(
      this.config.get<string>("MCP_UTM_SOURCE") ?? "mcp",
    );
    const query = `utm_source=${utm}&utm_medium=connector&intent=signup`;
    return lastPublicId
      ? `${this.appUrl()}/share/${lastPublicId}?${query}`
      : `${this.webUrl()}/?${query}`;
  }

  private variantCount(emailId: string): Promise<number> {
    return this.prisma.emailVariant.count({ where: { emailId } });
  }

  /** Lazily create (once) the shared anonymous user + workspace. */
  private async ensureAnonAccount(): Promise<{
    userId: string;
    workspaceId: string;
  }> {
    if (this.anon) return this.anon;

    const user = await this.prisma.user.upsert({
      where: { email: ANON_EMAIL },
      update: {},
      create: { email: ANON_EMAIL, name: ANON_WS_NAME, emailVerified: true },
      select: { id: true },
    });

    const membership = await this.prisma.membership.findFirst({
      where: { userId: user.id, role: "OWNER" },
      select: { workspaceId: true },
    });

    let workspaceId = membership?.workspaceId;
    if (!workspaceId) {
      const ws = await this.prisma.workspace.create({
        data: {
          name: ANON_WS_NAME,
          slug: `anon-mcp-${Date.now().toString(36)}`,
          members: { create: { userId: user.id, role: "OWNER" } },
        },
        select: { id: true },
      });
      workspaceId = ws.id;
    }

    this.anon = { userId: user.id, workspaceId };
    return this.anon;
  }

  /** Append the "Made with Madoo" viral footer to the newest variant. */
  private async watermarkLatestVariant(emailId: string): Promise<string | null> {
    const variant = await this.prisma.emailVariant.findFirst({
      where: { emailId },
      orderBy: { seq: "desc" },
      select: { id: true, subject: true, compiledHtml: true },
    });
    if (!variant) return null;

    const footer = madeWithMadooFooter(this.webUrl(), this.config.get<string>("MCP_UTM_SOURCE") ?? "mcp");
    const html = variant.compiledHtml.includes("</body>")
      ? variant.compiledHtml.replace("</body>", `${footer}</body>`)
      : variant.compiledHtml + footer;

    await this.prisma.emailVariant.update({
      where: { id: variant.id },
      data: { compiledHtml: html },
    });
    return variant.subject ?? null;
  }

  private webUrl(): string {
    const raw =
      this.config.get<string>("PUBLIC_WEB_URL") ??
      (this.config.get<string>("CORS_ORIGINS") ?? "http://localhost:3000").split(
        ",",
      )[0];
    return raw.trim().replace(/\/$/, "");
  }

  /** Base URL of the gated client app (hosts the public /share editor entry). */
  private appUrl(): string {
    const raw =
      this.config.get<string>("APP_URL") ??
      this.config.get<string>("CLIENT_APP_URL") ??
      this.webUrl();
    return raw.trim().replace(/\/$/, "");
  }

  /** Public base URL of this API (used to build the self-hosted preview link). */
  private apiUrl(): string {
    return (
      this.config.get<string>("PUBLIC_API_URL") ?? "http://localhost:4000/api/v1"
    )
      .trim()
      .replace(/\/$/, "");
  }
}

function extractMessage(body: unknown): string {
  if (typeof body === "string") return body;
  if (typeof body === "object" && body !== null && "message" in body) {
    const message = (body as { message: unknown }).message;
    if (typeof message === "string") return message;
  }
  return "Generation failed.";
}

function buildPrompt(input: PublicGenerateInput): string {
  const parts = [input.brief.trim()];
  if (input.brandName) parts.push(`Brand: ${input.brandName}.`);
  if (input.brandUrl) parts.push(`Brand website: ${input.brandUrl}.`);
  return parts.join("\n");
}

function madeWithMadooFooter(webUrl: string, utm: string): string {
  const link = `${webUrl}/?utm_source=${encodeURIComponent(utm)}&utm_medium=email_footer`;
  return `<div style="text-align:center;padding:16px;font-family:Arial,sans-serif;font-size:12px;color:#8a8a8a;">Made with <a href="${link}" style="color:#6b6b6b;text-decoration:underline;">Madoo</a></div>`;
}
