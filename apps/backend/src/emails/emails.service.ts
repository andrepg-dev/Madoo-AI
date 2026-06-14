import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import type { EmailStatus } from "@prisma/client";
import { randomUUID } from "node:crypto";
import {
  EmailChatMessageDtoSchema,
  EmailDtoSchema,
  EmailShareDtoSchema,
  PublicEmailDtoSchema,
  parseVariableSchemaJson,
  type CreateEmailFromTemplateInput,
  type CreateEmailInput,
  type EmailChatMessageDto,
  type EmailDto,
  type EmailShareDto,
  type EmailVariantDto,
  type PublicEmailDto,
  type RenameEmailInput,
  type TransferEmailInput,
  type UpdateEmailShareInput,
  type UpdateEmailVariantVariableSchemaInput,
} from "@madoo/shared";
import { PrismaService } from "../prisma/prisma.service";
import { WorkspacesService } from "../workspaces/workspaces.service";
import { TemplatesService } from "../templates/templates.service";
import { ReactToHtmlService } from "../generation/react-to-html.service";
import { ScreenshotService } from "../generation/screenshot.service";
import { BillingService } from "../billing/billing.service";
import { S3Service } from "../s3/s3.service";

@Injectable()
export class EmailsService {
  private readonly logger = new Logger(EmailsService.name);
  private static readonly PREVIEW_MAX_ATTEMPTS = 3;

  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaces: WorkspacesService,
    private readonly templates: TemplatesService,
    private readonly reactToHtml: ReactToHtmlService,
    private readonly screenshot: ScreenshotService,
    private readonly s3: S3Service,
    private readonly billing: BillingService,
  ) {}

  async assertEmailInWorkspace(emailId: string, workspaceId: string): Promise<void> {
    const row = await this.prisma.email.findFirst({
      where: { id: emailId, workspaceId },
      select: { id: true },
    });
    if (!row) throw new NotFoundException("Email not found.");
  }

  async create(
    workspaceId: string,
    userId: string,
    dto: CreateEmailInput,
  ): Promise<EmailDto> {
    await this.workspaces.assertMembership(userId, workspaceId);
    if (dto.templateId && dto.templateSlug) {
      throw new BadRequestException("Use templateId or templateSlug, not both.");
    }

    let templateId: string | null = dto.templateId ?? null;
    if (dto.templateId) {
      const tpl = await this.prisma.template.findFirst({
        where: { id: dto.templateId, workspaceId },
      });
      if (!tpl) throw new BadRequestException("Unknown template for this workspace.");
    }
    if (dto.templateSlug) {
      throw new BadRequestException(
        "Use POST /emails/from-template to materialize a prebuilt template.",
      );
    }

    const prompt = dto.prompt.trim();
    const email = await this.prisma.$transaction(async (tx) => {
      const created = await tx.email.create({
        data: {
          workspaceId,
          prompt,
          tone: dto.tone ?? null,
          length: dto.length ?? null,
          audience: dto.audience ?? null,
          templateId,
          status: "DRAFT",
        },
      });
      await tx.emailChatMessage.create({
        data: {
          workspaceId,
          emailId: created.id,
          role: "USER",
          kind: "TEXT",
          content: prompt,
        },
      });
      return created;
    });
    return this.toDto(email.id);
  }

  async list(workspaceId: string, userId: string): Promise<EmailDto[]> {
    await this.workspaces.assertMembership(userId, workspaceId);
    const rows = await this.prisma.email.findMany({
      where: {
        workspaceId,
        OR: [{ templateId: null }, { templateSavedAt: { not: null } }],
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return Promise.all(rows.map((r) => this.toDto(r.id)));
  }

  async getById(emailId: string, workspaceId: string, userId: string): Promise<EmailDto> {
    await this.workspaces.assertMembership(userId, workspaceId);
    await this.assertEmailInWorkspace(emailId, workspaceId);
    return this.toDto(emailId);
  }

  async listChatMessages(
    emailId: string,
    workspaceId: string,
    userId: string,
  ): Promise<EmailChatMessageDto[]> {
    await this.workspaces.assertMembership(userId, workspaceId);
    await this.assertEmailInWorkspace(emailId, workspaceId);
    const rows = await this.prisma.emailChatMessage.findMany({
      where: { emailId, workspaceId },
      orderBy: { createdAt: "asc" },
    });
    return rows.map((row) =>
      EmailChatMessageDtoSchema.parse({
        id: row.id,
        role: row.role,
        kind: row.kind,
        content: row.content,
        createdAt: row.createdAt.toISOString(),
      }),
    );
  }

  async remove(emailId: string, workspaceId: string, userId: string): Promise<void> {
    await this.workspaces.assertMembership(userId, workspaceId);
    await this.assertEmailInWorkspace(emailId, workspaceId);
    await this.prisma.email.delete({ where: { id: emailId } });
  }

  async rename(
    emailId: string,
    workspaceId: string,
    userId: string,
    dto: RenameEmailInput,
  ): Promise<EmailDto> {
    await this.workspaces.assertMembership(userId, workspaceId);
    await this.assertEmailInWorkspace(emailId, workspaceId);
    await this.prisma.email.update({
      where: { id: emailId },
      data: { title: dto.title.trim() },
    });
    return this.toDto(emailId);
  }

  async transfer(
    emailId: string,
    workspaceId: string,
    userId: string,
    dto: TransferEmailInput,
  ): Promise<EmailDto> {
    await this.workspaces.assertMembership(userId, workspaceId);
    await this.workspaces.assertMembership(userId, dto.targetWorkspaceId);
    await this.assertEmailInWorkspace(emailId, workspaceId);

    if (workspaceId === dto.targetWorkspaceId) {
      throw new BadRequestException("Email already belongs to this workspace.");
    }

    await this.prisma.$transaction([
      this.prisma.email.update({
        where: { id: emailId },
        data: { workspaceId: dto.targetWorkspaceId },
      }),
      this.prisma.emailVariant.updateMany({
        where: { emailId, workspaceId },
        data: { workspaceId: dto.targetWorkspaceId },
      }),
      this.prisma.emailGenerationRun.updateMany({
        where: { emailId, workspaceId },
        data: { workspaceId: dto.targetWorkspaceId },
      }),
      this.prisma.emailChatMessage.updateMany({
        where: { emailId, workspaceId },
        data: { workspaceId: dto.targetWorkspaceId },
      }),
      this.prisma.emailVfsSnapshot.updateMany({
        where: { emailId, workspaceId },
        data: { workspaceId: dto.targetWorkspaceId },
      }),
      this.prisma.supportTicket.updateMany({
        where: { emailId, workspaceId },
        data: { workspaceId: dto.targetWorkspaceId },
      }),
    ]);

    return this.toDto(emailId);
  }

  /**
   * Atomically materialize a prebuilt template into a fully saved Email.
   * Charges 1 AI credit (records an INITIAL EmailGenerationRun) and sets
   * `templateSavedAt`. No DB rows created if the credit check fails.
   */
  async createFromTemplate(
    workspaceId: string,
    userId: string,
    dto: CreateEmailFromTemplateInput,
  ): Promise<EmailDto> {
    await this.workspaces.assertMembership(userId, workspaceId);
    await this.billing.assertCanGenerate(workspaceId);
    await this.templates.ensureSeedForWorkspace(workspaceId);
    const tpl = await this.prisma.template.findUnique({
      where: { workspaceId_slug: { workspaceId, slug: dto.templateSlug } },
    });
    if (!tpl) throw new BadRequestException("Unknown template slug for this workspace.");
    const compiledHtml = this.reactToHtml.compile(tpl.componentCode);
    const previewUrl = await this.createPreviewUrl(compiledHtml);
    const now = new Date();
    const prompt = dto.prompt.trim();
    const email = await this.prisma.$transaction(async (tx) => {
      const created = await tx.email.create({
        data: {
          workspaceId,
          prompt,
          tone: dto.tone ?? null,
          length: dto.length ?? null,
          audience: dto.audience ?? null,
          templateId: tpl.id,
          templateSavedAt: now,
          status: "READY",
        },
      });
      await tx.emailVariant.create({
        data: {
          workspaceId,
          emailId: created.id,
          seq: 1,
          subject: tpl.name,
          componentCode: tpl.componentCode,
          compiledHtml,
          variableSchema: { variables: [] },
          previewUrl,
        },
      });
      await tx.emailChatMessage.create({
        data: {
          workspaceId,
          emailId: created.id,
          role: "USER",
          kind: "TEXT",
          content: prompt,
        },
      });
      await tx.emailGenerationRun.create({
        data: {
          workspaceId,
          emailId: created.id,
          kind: "INITIAL",
          status: "COMPLETED",
        },
      });
      return created;
    });
    return this.toDto(email.id);
  }

  private async createPreviewUrl(compiledHtml: string): Promise<string> {
    let lastErr: unknown;
    for (let attempt = 1; attempt <= EmailsService.PREVIEW_MAX_ATTEMPTS; attempt += 1) {
      try {
        const buffer = await this.screenshot.screenshotHtml(compiledHtml);
        return await this.s3.uploadBuffer(buffer, "image/png", "email-previews");
      } catch (err) {
        lastErr = err;
        this.logger.warn(
          `Template preview image save failed (attempt ${attempt}/${EmailsService.PREVIEW_MAX_ATTEMPTS}): ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
    throw new InternalServerErrorException(
      `Failed to generate template preview image after ${EmailsService.PREVIEW_MAX_ATTEMPTS} attempts. Last error: ${lastErr instanceof Error ? lastErr.message : String(lastErr)}`,
    );
  }

  async saveTemplate(emailId: string, workspaceId: string, userId: string): Promise<void> {
    await this.workspaces.assertMembership(userId, workspaceId);
    const email = await this.prisma.email.findFirst({
      where: { id: emailId, workspaceId },
      select: {
        id: true,
        templateId: true,
        templateSavedAt: true,
        variants: {
          orderBy: { seq: "desc" },
          take: 1,
          select: { id: true, compiledHtml: true },
        },
      },
    });
    if (!email) throw new NotFoundException("Email not found.");
    if (!email.templateId) throw new BadRequestException("Email is not a pre-built template email.");
    if (email.templateSavedAt) throw new BadRequestException("Template already saved.");
    const latestVariant = email.variants[0];
    if (!latestVariant) {
      throw new BadRequestException("Template email has no variant to preview.");
    }
    await this.billing.assertCanGenerate(workspaceId);
    const previewUrl = await this.createPreviewUrl(latestVariant.compiledHtml);
    await this.prisma.$transaction([
      this.prisma.emailGenerationRun.create({
        data: {
          workspaceId,
          emailId,
          kind: "INITIAL",
          status: "COMPLETED",
        },
      }),
      this.prisma.email.update({
        where: { id: emailId },
        data: { templateSavedAt: new Date() },
      }),
      this.prisma.emailVariant.update({
        where: { id: latestVariant.id },
        data: { previewUrl },
      }),
    ]);
  }

  async updateVariantVariableSchema(
    emailId: string,
    variantId: string,
    workspaceId: string,
    userId: string,
    dto: UpdateEmailVariantVariableSchemaInput,
  ): Promise<EmailDto> {
    await this.workspaces.assertMembership(userId, workspaceId);
    const variant = await this.prisma.emailVariant.findFirst({
      where: { id: variantId, emailId, workspaceId },
      select: { id: true, componentCode: true },
    });
    if (!variant) throw new NotFoundException("Email variant not found.");

    const renderVariables = Object.fromEntries(
      dto.variableSchema.variables.map((variable) => [variable.name, variable.default]),
    );
    const compiledHtml = this.reactToHtml.compile(
      variant.componentCode,
      renderVariables,
    );
    let previewUrl: string | null = null;
    try {
      previewUrl = await this.createPreviewUrl(compiledHtml);
    } catch (err) {
      this.logger.warn(
        `Variable schema preview refresh failed for variant ${variantId}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    await this.prisma.emailVariant.update({
      where: { id: variantId },
      data: {
        variableSchema: dto.variableSchema,
        compiledHtml,
        ...(previewUrl ? { previewUrl } : {}),
      },
    });
    return this.toDto(emailId);
  }

  async updateStatus(emailId: string, status: EmailStatus): Promise<void> {
    await this.prisma.email.update({
      where: { id: emailId },
      data: { status },
    });
  }

  /**
   * Atomically consume a pending prompt into an Email row for the user's primary workspace.
   * Does not start AI generation — caller should POST /emails/:id/generate.
   */
  async consumePendingIntoEmail(
    userId: string,
    pendingPromptId: string,
  ): Promise<{ emailId: string; workspaceId: string }> {
    const membership = await this.prisma.membership.findFirst({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });
    if (!membership) throw new BadRequestException("User has no workspace.");

    const result = await this.prisma.$transaction(async (tx) => {
      const pp = await tx.pendingPrompt.findFirst({
        where: { id: pendingPromptId, userId },
      });
      if (!pp) throw new NotFoundException("Pending prompt not found.");
      if (pp.consumed) throw new BadRequestException("Already consumed.");

      const prompt = pp.prompt.trim();
      const email = await tx.email.create({
        data: {
          workspaceId: membership.workspaceId,
          prompt,
          tone: pp.tone ?? null,
          length: pp.length ?? null,
          audience: pp.audience ?? null,
          status: "DRAFT",
          sourcePendingPromptId: pp.id,
        },
      });

      await tx.emailChatMessage.create({
        data: {
          workspaceId: membership.workspaceId,
          emailId: email.id,
          role: "USER",
          kind: "TEXT",
          content: prompt,
        },
      });

      await tx.pendingPrompt.update({
        where: { id: pendingPromptId },
        data: { consumed: true },
      });

      return { emailId: email.id, workspaceId: membership.workspaceId };
    });

    return result;
  }

  async nextVariantSeq(emailId: string): Promise<number> {
    const agg = await this.prisma.emailVariant.aggregate({
      where: { emailId },
      _max: { seq: true },
    });
    return (agg._max.seq ?? 0) + 1;
  }

  async toDto(emailId: string): Promise<EmailDto> {
    const row = await this.prisma.email.findUnique({
      where: { id: emailId },
      include: {
        variants: {
          orderBy: { seq: "desc" },
          take: 3,
        },
      },
    });
    if (!row) throw new NotFoundException("Email not found.");

    const variantsAsc = [...row.variants].sort((a, b) => a.seq - b.seq);

    const variants: EmailVariantDto[] = variantsAsc.map((v) => ({
      // Defensive normalization in case legacy/backfill rows contain malformed URLs.
      // If URL is invalid, frontend should naturally fall back to placeholder.
      id: v.id,
      seq: v.seq,
      subject: v.subject,
      componentCode: v.componentCode,
      compiledHtml: v.compiledHtml,
      variableSchema: parseVariableSchemaJson(v.variableSchema),
      previewUrl:
        typeof v.previewUrl === "string" && /^https?:\/\//i.test(v.previewUrl.trim())
          ? v.previewUrl.trim()
          : null,
      createdAt: v.createdAt.toISOString(),
    }));

    return EmailDtoSchema.parse({
      id: row.id,
      workspaceId: row.workspaceId,
      status: row.status,
      prompt: row.prompt,
      tone: row.tone,
      length: row.length,
      audience: row.audience,
      title: row.title,
      templateId: row.templateId,
      templateSavedAt: row.templateSavedAt?.toISOString() ?? null,
      visibility: row.visibility,
      publicId: row.publicId,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      variants,
    });
  }

  /**
   * Toggle an email's public/private share link. Making it PUBLIC mints a
   * stable, unguessable `publicId` (kept across toggles so an existing link
   * keeps working). PRIVATE keeps the id but the public route stops serving it.
   */
  async setShare(
    emailId: string,
    workspaceId: string,
    userId: string,
    dto: UpdateEmailShareInput,
  ): Promise<EmailShareDto> {
    await this.workspaces.assertMembership(userId, workspaceId);
    await this.assertEmailInWorkspace(emailId, workspaceId);

    const current = await this.prisma.email.findUnique({
      where: { id: emailId },
      select: { publicId: true },
    });
    const publicId =
      dto.visibility === "PUBLIC"
        ? current?.publicId ?? randomUUID()
        : current?.publicId ?? null;

    const updated = await this.prisma.email.update({
      where: { id: emailId },
      data: { visibility: dto.visibility, publicId },
      select: { id: true, visibility: true, publicId: true },
    });

    return EmailShareDtoSchema.parse({
      id: updated.id,
      visibility: updated.visibility,
      publicId: updated.publicId,
    });
  }

  /**
   * Resolve a public share link. Only PUBLIC emails are served and only their
   * latest rendered variant — no workspace, prompt, or chat data is exposed.
   */
  async getPublicByPublicId(publicId: string): Promise<PublicEmailDto> {
    const email = await this.prisma.email.findFirst({
      where: { publicId, visibility: "PUBLIC" },
      select: {
        publicId: true,
        title: true,
        createdAt: true,
        variants: {
          orderBy: { seq: "desc" },
          take: 1,
          select: { subject: true, compiledHtml: true },
        },
      },
    });
    const variant = email?.variants[0];
    if (!email || !email.publicId || !variant) {
      throw new NotFoundException("Shared email not found.");
    }

    return PublicEmailDtoSchema.parse({
      publicId: email.publicId,
      title: email.title,
      subject: variant.subject,
      compiledHtml: variant.compiledHtml,
      createdAt: email.createdAt.toISOString(),
    });
  }

  async loadGenerationContext(emailId: string, workspaceId: string) {
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

  forbidWorkspaceMismatch(workspaceId: string, resourceWorkspaceId: string): void {
    if (workspaceId !== resourceWorkspaceId) throw new ForbiddenException();
  }
}
