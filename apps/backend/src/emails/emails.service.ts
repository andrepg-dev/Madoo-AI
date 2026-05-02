import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { EmailStatus } from "@prisma/client";
import {
  EmailDtoSchema,
  parseVariableSchemaJson,
  type CreateEmailInput,
  type EmailDto,
  type EmailVariantDto,
} from "@madoo/shared";
import { PrismaService } from "../prisma/prisma.service";
import { WorkspacesService } from "../workspaces/workspaces.service";

@Injectable()
export class EmailsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaces: WorkspacesService,
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
      const tpl = await this.prisma.template.findUnique({
        where: {
          workspaceId_slug: { workspaceId, slug: dto.templateSlug },
        },
      });
      if (!tpl) throw new BadRequestException("Unknown template slug for this workspace.");
      templateId = tpl.id;
    }

    const email = await this.prisma.email.create({
      data: {
        workspaceId,
        prompt: dto.prompt.trim(),
        tone: dto.tone ?? null,
        length: dto.length ?? null,
        audience: dto.audience ?? null,
        templateId,
        status: "DRAFT",
      },
    });
    return this.toDto(email.id);
  }

  async list(workspaceId: string, userId: string): Promise<EmailDto[]> {
    await this.workspaces.assertMembership(userId, workspaceId);
    const rows = await this.prisma.email.findMany({
      where: { workspaceId },
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

  async remove(emailId: string, workspaceId: string, userId: string): Promise<void> {
    await this.workspaces.assertMembership(userId, workspaceId);
    await this.assertEmailInWorkspace(emailId, workspaceId);
    await this.prisma.email.delete({ where: { id: emailId } });
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

      const email = await tx.email.create({
        data: {
          workspaceId: membership.workspaceId,
          prompt: pp.prompt.trim(),
          tone: pp.tone ?? null,
          length: pp.length ?? null,
          audience: pp.audience ?? null,
          status: "DRAFT",
          sourcePendingPromptId: pp.id,
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
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      variants,
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
