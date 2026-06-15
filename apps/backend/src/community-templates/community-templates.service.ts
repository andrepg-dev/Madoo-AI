import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  CommunityTemplateDetailDtoSchema,
  CommunityTemplateDtoSchema,
  parseVariableSchemaJson,
  type CommunityTemplateDetailDto,
  type CommunityTemplateDto,
  type EmailDto,
  type ShareEmailToCommunityInput,
  type SetCommunityTemplateStarredInput,
  type UseCommunityTemplateInput,
  type VariableSchemaRoot,
} from "@madoo/shared";
import { BillingService } from "../billing/billing.service";
import { EmailsService } from "../emails/emails.service";
import { PrismaService } from "../prisma/prisma.service";

type CommunityTemplateRow = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  componentCode?: string;
  compiledHtml?: string;
  previewUrl: string | null;
  variableSchema: unknown;
  useCount: number;
  authorName: string | null;
  createdAt: Date;
  stars?: Array<{ id: string }>;
};

type PublicCommunityTemplateDto = Omit<
  CommunityTemplateDto,
  "starred" | "useCount"
>;
type PublicCommunityTemplateRow = Omit<
  CommunityTemplateRow,
  "stars" | "useCount"
>;

function cleanOptional(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

@Injectable()
export class CommunityTemplatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emails: EmailsService,
    private readonly billing: BillingService,
  ) {}

  async list(userId: string): Promise<CommunityTemplateDto[]> {
    const rows = await this.prisma.communityTemplate.findMany({
      orderBy: { createdAt: "desc" },
      take: 60,
      include: {
        stars: {
          where: { userId },
          select: { id: true },
        },
      },
    });
    return rows.map((row) => this.toDto(row));
  }

  async listPublic(): Promise<PublicCommunityTemplateDto[]> {
    const rows = await this.prisma.communityTemplate.findMany({
      orderBy: { createdAt: "desc" },
      take: 24,
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        previewUrl: true,
        variableSchema: true,
        authorName: true,
        createdAt: true,
      },
    });
    return rows.map((row) => this.toPublicDto(row));
  }

  async get(id: string, userId: string): Promise<CommunityTemplateDetailDto> {
    const row = await this.prisma.communityTemplate.findUnique({
      where: { id },
      include: {
        stars: {
          where: { userId },
          select: { id: true },
        },
      },
    });
    if (!row) throw new NotFoundException("Community template not found.");
    return CommunityTemplateDetailDtoSchema.parse({
      ...this.toDto(row),
      componentCode: row.componentCode,
      compiledHtml: row.compiledHtml,
    });
  }

  async share(
    workspaceId: string,
    userId: string,
    dto: ShareEmailToCommunityInput,
  ): Promise<CommunityTemplateDto> {
    const email = await this.prisma.email.findFirst({
      where: { id: dto.emailId, workspaceId },
      select: {
        id: true,
        variants: {
          orderBy: { seq: "desc" },
          take: 1,
          select: {
            componentCode: true,
            compiledHtml: true,
            previewUrl: true,
            variableSchema: true,
          },
        },
      },
    });
    const variant = email?.variants[0];
    if (!email || !variant) {
      throw new BadRequestException("Email has no variant to share.");
    }

    const author = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });
    const created = await this.prisma.communityTemplate.create({
      data: {
        name: dto.name.trim(),
        description: cleanOptional(dto.description),
        category: cleanOptional(dto.category),
        componentCode: variant.componentCode,
        compiledHtml: variant.compiledHtml,
        previewUrl: variant.previewUrl,
        variableSchema: parseVariableSchemaJson(variant.variableSchema),
        authorUserId: userId,
        authorName: author?.name ?? author?.email ?? null,
        sourceEmailId: email.id,
      },
      include: {
        stars: {
          where: { userId },
          select: { id: true },
        },
      },
    });
    return this.toDto(created);
  }

  async use(
    id: string,
    workspaceId: string,
    userId: string,
    dto: UseCommunityTemplateInput,
  ): Promise<EmailDto> {
    const template = await this.prisma.communityTemplate.findUnique({
      where: { id },
    });
    if (!template) throw new NotFoundException("Community template not found.");

    await this.billing.assertCanGenerate(workspaceId);
    const email = await this.emails.materializeTemplate({
      workspaceId,
      userId,
      componentCode: template.componentCode,
      variableSchema: dto.variableSchema,
      prompt: `Use community template: ${template.name}`,
      subject: template.name,
    });
    await this.prisma.communityTemplate.update({
      where: { id },
      data: { useCount: { increment: 1 } },
    });
    return email;
  }

  async setStarred(
    id: string,
    userId: string,
    dto: SetCommunityTemplateStarredInput,
  ): Promise<CommunityTemplateDto> {
    const exists = await this.prisma.communityTemplate.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException("Community template not found.");

    if (dto.starred) {
      await this.prisma.communityTemplateStar.upsert({
        where: {
          communityTemplateId_userId: { communityTemplateId: id, userId },
        },
        create: { communityTemplateId: id, userId },
        update: {},
      });
    } else {
      await this.prisma.communityTemplateStar.deleteMany({
        where: { communityTemplateId: id, userId },
      });
    }

    const row = await this.prisma.communityTemplate.findUnique({
      where: { id },
      include: {
        stars: {
          where: { userId },
          select: { id: true },
        },
      },
    });
    if (!row) throw new NotFoundException("Community template not found.");
    return this.toDto(row);
  }

  private toDto(row: CommunityTemplateRow): CommunityTemplateDto {
    const variableSchema: VariableSchemaRoot = parseVariableSchemaJson(
      row.variableSchema,
    );
    return CommunityTemplateDtoSchema.parse({
      id: row.id,
      name: row.name,
      description: row.description,
      category: row.category,
      previewUrl:
        typeof row.previewUrl === "string" &&
        /^https?:\/\//i.test(row.previewUrl.trim())
          ? row.previewUrl.trim()
          : null,
      variableSchema,
      useCount: row.useCount,
      authorName: row.authorName,
      starred: Boolean(row.stars?.length),
      createdAt: row.createdAt.toISOString(),
    });
  }

  private toPublicDto(
    row: PublicCommunityTemplateRow,
  ): PublicCommunityTemplateDto {
    const dto = this.toDto({
      ...row,
      useCount: 0,
      stars: [],
    });
    return {
      id: dto.id,
      name: dto.name,
      description: dto.description,
      category: dto.category,
      previewUrl: dto.previewUrl,
      variableSchema: dto.variableSchema,
      authorName: dto.authorName,
      createdAt: dto.createdAt,
    };
  }
}
