import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  type PublicGenerateInput,
  type PublicGenerateResult,
} from "@madoo/shared";
import { PrismaService } from "../prisma/prisma.service";
import { EmailsService } from "../emails/emails.service";
import { GenerationService } from "../generation/generation.service";
import { AnonRateLimiter } from "./anon-rate-limit";

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
    private readonly config: ConfigService,
  ) {}

  async generate(
    input: PublicGenerateInput,
    ip: string,
  ): Promise<PublicGenerateResult> {
    const gate = this.limiter.tryConsume(ip);
    if (!gate.ok) throw new BadRequestException(gate.reason);

    try {
      const { userId, workspaceId } = await this.ensureAnonAccount();
      const prompt = buildPrompt(input);

      const email = await this.emails.create(workspaceId, userId, { prompt });
      await this.generation.generateAnonymousToCompletion(email.id, workspaceId);

      const share = await this.emails.setShare(email.id, workspaceId, userId, {
        visibility: "PUBLIC",
      });
      if (!share.publicId) {
        throw new InternalServerErrorException("Failed to mint share link.");
      }

      const subject = await this.watermarkLatestVariant(email.id);

      const web = this.webUrl();
      const previewUrl = `${web}/share/${share.publicId}`;
      const ctaUrl = `${web}/share/${share.publicId}?utm_source=${encodeURIComponent(
        this.config.get<string>("MCP_UTM_SOURCE") ?? "mcp",
      )}&utm_medium=connector`;

      return { publicId: share.publicId, previewUrl, ctaUrl, subject };
    } catch (err) {
      // Don't burn a user's free quota on our failure.
      this.limiter.refund(ip);
      throw err;
    }
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
}

function buildPrompt(input: PublicGenerateInput): string {
  const parts = [input.brief.trim()];
  if (input.brandName) parts.push(`Brand: ${input.brandName}.`);
  if (input.brandUrl) parts.push(`Brand website: ${input.brandUrl}.`);
  if (input.tone) parts.push(`Tone: ${input.tone}.`);
  return parts.join("\n");
}

function madeWithMadooFooter(webUrl: string, utm: string): string {
  const link = `${webUrl}/?utm_source=${encodeURIComponent(utm)}&utm_medium=email_footer`;
  return `<div style="text-align:center;padding:16px;font-family:Arial,sans-serif;font-size:12px;color:#8a8a8a;">Made with <a href="${link}" style="color:#6b6b6b;text-decoration:underline;">Madoo</a></div>`;
}
