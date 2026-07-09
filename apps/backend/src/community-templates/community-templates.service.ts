import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  CommunityTemplateDetailDtoSchema,
  CommunityTemplateCategorySchema,
  CommunityTemplateDtoSchema,
  extractVariableSchemaFromComponent,
  parseVariableSchemaJson,
  type CommunityTemplateCategory,
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
import { ReactToHtmlService } from "../generation/react-to-html.service";
import { PrismaService } from "../prisma/prisma.service";
import {
  SEED_TEMPLATES,
  SEED_TEMPLATE_SLUGS,
  type SeedTemplateSlug,
} from "../templates/seed-templates";

type CommunityTemplateRow = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  categories: string[];
  componentCode?: string;
  compiledHtml?: string;
  previewUrl: string | null;
  variableSchema: unknown;
  viewCount: number;
  useCount: number;
  authorUserId: string;
  authorName: string | null;
  createdAt: Date;
  stars?: Array<{ id: string }>;
};

type PublicCommunityTemplateDto = Omit<
  CommunityTemplateDto,
  "starred" | "viewCount" | "useCount" | "owned"
>;
type PublicCommunityTemplateDetailDto = PublicCommunityTemplateDto & {
  compiledHtml: string;
};
type PublicCommunityTemplateRow = Omit<
  CommunityTemplateRow,
  "stars" | "viewCount" | "useCount" | "authorUserId"
>;

function cleanOptional(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

const legacyCategoryMap: Record<string, CommunityTemplateCategory> = {
  event: "Events & Webinars",
  engagement: "Re-engagement",
  growth: "Promotional",
  launch: "Product Launch",
  newsletter: "Newsletter",
  onboarding: "Welcome",
  promotion: "Promotional",
  transactional: "Transactional",
};

const SEED_PUBLIC_CREATED_AT = new Date(0).toISOString();

function normalizeCategory(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const parsed = CommunityTemplateCategorySchema.safeParse(trimmed);
  if (parsed.success) return parsed.data;
  return legacyCategoryMap[trimmed.toLowerCase()] ?? "Other";
}

function normalizeCategories(
  category: string | null | undefined,
  categories: readonly string[] | undefined,
): CommunityTemplateCategory[] {
  const normalized: CommunityTemplateCategory[] = [];
  const push = (value: string | null | undefined) => {
    const next = normalizeCategory(value);
    if (next && !normalized.includes(next)) normalized.push(next);
  };

  categories?.forEach(push);
  push(category);
  if (normalized.length === 0) normalized.push("Other");
  return normalized.slice(0, 3);
}

@Injectable()
export class CommunityTemplatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emails: EmailsService,
    private readonly billing: BillingService,
    private readonly reactToHtml: ReactToHtmlService,
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
    return rows.map((row) => this.toDto(row, userId));
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
        categories: true,
        previewUrl: true,
        variableSchema: true,
        authorName: true,
        createdAt: true,
      },
    });
    if (rows.length === 0) {
      return SEED_TEMPLATE_SLUGS.map((slug) => this.toSeedPublicDto(slug));
    }
    return rows.map((row) => this.toPublicDto(row));
  }

  // Public template detail for the marketing site. Unlike `get`, it takes no
  // viewer and returns the compiled HTML so the landing can render the email in
  // an iframe instead of a static screenshot. Seed slugs are compiled on the
  // fly since the fallback gallery has no DB rows to read HTML from.
  async getPublic(id: string): Promise<PublicCommunityTemplateDetailDto> {
    if (id.startsWith("seed-")) {
      const slug = id.slice("seed-".length) as SeedTemplateSlug;
      if (!SEED_TEMPLATE_SLUGS.includes(slug)) {
        throw new NotFoundException("Community template not found.");
      }
      return {
        ...this.toSeedPublicDto(slug),
        compiledHtml: this.reactToHtml.compile(
          SEED_TEMPLATES[slug].componentCode,
        ),
      };
    }

    const row = await this.prisma.communityTemplate.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        categories: true,
        previewUrl: true,
        variableSchema: true,
        authorName: true,
        createdAt: true,
        compiledHtml: true,
      },
    });
    if (!row) throw new NotFoundException("Community template not found.");

    return {
      ...this.toPublicDto(row),
      compiledHtml: row.compiledHtml,
    };
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

    // Count a view only when someone other than the author opens it, so
    // authors can't inflate their own stats. Reflect it in the response.
    if (row.authorUserId !== userId) {
      await this.prisma.communityTemplate.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      });
      row.viewCount += 1;
    }

    return CommunityTemplateDetailDtoSchema.parse({
      ...this.toDto(row, userId),
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
          // When a specific version is requested, take that one; otherwise the
          // latest. Ordering by seq desc keeps variants[0] = latest as before.
          where: dto.variantSeq ? { seq: dto.variantSeq } : undefined,
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
      throw new BadRequestException(
        dto.variantSeq
          ? `Version ${dto.variantSeq} not found for this email.`
          : "Email has no variant to share.",
      );
    }

    const author = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });
    const categories = normalizeCategories(dto.category, dto.categories);
    const created = await this.prisma.communityTemplate.create({
      data: {
        name: dto.name.trim(),
        description: cleanOptional(dto.description),
        category: categories[0],
        categories,
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
    try {
      await this.prisma.productEvent.create({
        data: {
          userId,
          workspaceId,
          name: "community_template.shared",
          source: "community_templates.share",
          properties: {
            communityTemplateId: created.id,
            sourceEmailId: email.id,
          },
        },
      });
    } catch {
      // Community sharing succeeded; analytics can lag.
    }
    return this.toDto(created, userId);
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
    try {
      await this.prisma.productEvent.create({
        data: {
          userId,
          workspaceId,
          name: "community_template.used",
          source: "community_templates.use",
          properties: { communityTemplateId: id, emailId: email.id },
        },
      });
    } catch {
      // Template use is already counted on the source row; event stream is best-effort.
    }
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
    return this.toDto(row, userId);
  }

  async makePrivate(id: string, userId: string): Promise<void> {
    const row = await this.prisma.communityTemplate.findUnique({
      where: { id },
      select: { id: true, authorUserId: true },
    });
    if (!row) throw new NotFoundException("Community template not found.");
    if (row.authorUserId !== userId) {
      throw new ForbiddenException(
        "Only the author can make this template private.",
      );
    }
    // Deleting the published copy removes it from the gallery (stars cascade);
    // the author's original email in their workspace is untouched.
    await this.prisma.communityTemplate.delete({ where: { id } });
  }

  private toDto(
    row: CommunityTemplateRow,
    viewerUserId: string | null,
  ): CommunityTemplateDto {
    const variableSchema: VariableSchemaRoot = parseVariableSchemaJson(
      row.variableSchema,
    );
    const categories = normalizeCategories(row.category, row.categories);
    return CommunityTemplateDtoSchema.parse({
      id: row.id,
      name: row.name,
      description: row.description,
      category: categories[0],
      categories,
      previewUrl:
        typeof row.previewUrl === "string" &&
        /^https?:\/\//i.test(row.previewUrl.trim())
          ? row.previewUrl.trim()
          : null,
      variableSchema,
      viewCount: row.viewCount,
      useCount: row.useCount,
      authorName: row.authorName,
      starred: Boolean(row.stars?.length),
      owned: viewerUserId !== null && row.authorUserId === viewerUserId,
      createdAt: row.createdAt.toISOString(),
    });
  }

  private toPublicDto(
    row: PublicCommunityTemplateRow,
  ): PublicCommunityTemplateDto {
    const dto = this.toDto(
      {
        ...row,
        authorUserId: "",
        viewCount: 0,
        useCount: 0,
        stars: [],
      },
      null,
    );
    return {
      id: dto.id,
      name: dto.name,
      description: dto.description,
      category: dto.category,
      categories: dto.categories,
      previewUrl: dto.previewUrl,
      variableSchema: dto.variableSchema,
      authorName: dto.authorName,
      createdAt: dto.createdAt,
    };
  }

  private toSeedPublicDto(slug: SeedTemplateSlug): PublicCommunityTemplateDto {
    const template = SEED_TEMPLATES[slug];
    const categories = normalizeCategories(template.category, []);
    const dto = CommunityTemplateDtoSchema.parse({
      id: `seed-${slug}`,
      name: template.name,
      description: template.description,
      category: categories[0],
      categories,
      previewUrl: null,
      variableSchema: extractVariableSchemaFromComponent(
        template.componentCode,
      ),
      viewCount: 0,
      useCount: 0,
      authorName: "Madoo",
      starred: false,
      owned: false,
      createdAt: SEED_PUBLIC_CREATED_AT,
    });
    return {
      id: dto.id,
      name: dto.name,
      description: dto.description,
      category: dto.category,
      categories: dto.categories,
      previewUrl: dto.previewUrl,
      variableSchema: dto.variableSchema,
      authorName: dto.authorName,
      createdAt: dto.createdAt,
    };
  }
}
