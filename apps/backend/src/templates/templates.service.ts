import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import {
  PLAN_DISPLAY_NAMES,
  PLAN_LIMITS,
  TemplateDtoSchema,
  buildRenderVariables,
  extractVariableSchemaFromComponent,
  parseVariableSchemaJson,
  type TemplateDto,
  type TemplateSeedPreviewDto,
  type TemplateSlug,
} from "@madoo/shared";
import { PrismaService } from "../prisma/prisma.service";
import { ReactToHtmlService } from "../generation/react-to-html.service";
import { planForWorkspace } from "../billing/account";
import { SEED_TEMPLATE_SLUGS, SEED_TEMPLATES } from "./seed-templates";

@Injectable()
export class TemplatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reactToHtml: ReactToHtmlService,
  ) {}

  /**
   * Render a seed template's variant data without persisting an Email row.
   * Used by the prebuilt-template preview UI before the user pays the credit
   * to save it.
   */
  async previewSeed(
    workspaceId: string,
    slug: TemplateSlug,
  ): Promise<TemplateSeedPreviewDto> {
    await this.ensureSeedForWorkspace(workspaceId);
    const tpl = await this.prisma.template.findUnique({
      where: { workspaceId_slug: { workspaceId, slug } },
    });
    if (!tpl)
      throw new NotFoundException("Unknown template slug for this workspace.");
    const variableSchema = tpl.variableSchema
      ? parseVariableSchemaJson(tpl.variableSchema)
      : extractVariableSchemaFromComponent(tpl.componentCode);
    const compiledHtml = this.reactToHtml.compile(
      tpl.componentCode,
      buildRenderVariables(variableSchema),
    );
    return {
      slug,
      name: tpl.name,
      componentCode: tpl.componentCode,
      compiledHtml,
      variableSchema,
    };
  }

  /** Inserts gallery seed templates when missing (idempotent per workspace slug). */
  async ensureSeedForWorkspace(workspaceId: string): Promise<void> {
    for (const slug of SEED_TEMPLATE_SLUGS) {
      const meta = SEED_TEMPLATES[slug];
      const variableSchema = extractVariableSchemaFromComponent(
        meta.componentCode,
      );
      await this.prisma.template.upsert({
        where: { workspaceId_slug: { workspaceId, slug } },
        create: {
          workspaceId,
          slug,
          name: meta.name,
          category: meta.category,
          description: meta.description,
          componentCode: meta.componentCode,
          variableSchema,
        },
        update: {
          name: meta.name,
          category: meta.category,
          description: meta.description,
          componentCode: meta.componentCode,
          variableSchema,
        },
      });
    }
  }

  async saveFromVariant(
    workspaceId: string,
    userId: string,
    variantId: string,
    name: string,
  ): Promise<{ id: string; name: string; slug: string }> {
    const variant = await this.prisma.emailVariant.findFirst({
      where: { id: variantId, workspaceId },
      select: { componentCode: true, variableSchema: true },
    });
    if (!variant)
      throw new NotFoundException("Variant not found in workspace.");

    await this.assertCanStoreTemplate(workspaceId);

    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 48);
    const suffix = Math.random().toString(36).slice(2, 6);
    const slug = `${base}-${suffix}`;

    const template = await this.prisma.template.create({
      data: {
        workspaceId,
        createdByUserId: userId,
        slug,
        name,
        componentCode: variant.componentCode,
        variableSchema: parseVariableSchemaJson(variant.variableSchema),
      },
      select: { id: true, name: true, slug: true },
    });
    try {
      await this.prisma.productEvent.create({
        data: {
          userId,
          workspaceId,
          name: "template.created_custom",
          source: "templates.from_variant",
          properties: { templateId: template.id, templateName: template.name },
        },
      });
    } catch {
      // Analytics should not block saving a reusable template.
    }
    return template;
  }

  /** Blocks saving a template once the account plan's storedTemplates cap is hit. */
  private async assertCanStoreTemplate(workspaceId: string): Promise<void> {
    const plan = await planForWorkspace(this.prisma, workspaceId);
    const limit = PLAN_LIMITS[plan].storedTemplates;
    if (limit === -1) return;
    // Seed/starter templates are system-provided and don't count toward the cap.
    const count = await this.prisma.template.count({
      where: { workspaceId, slug: { notIn: [...SEED_TEMPLATE_SLUGS] } },
    });
    if (count >= limit) {
      throw new ForbiddenException(
        `Template limit reached: ${PLAN_DISPLAY_NAMES[plan]} plan stores ${limit} templates (using ${count}). Upgrade to store more.`,
      );
    }
  }

  async listForWorkspace(workspaceId: string): Promise<TemplateDto[]> {
    await this.ensureSeedForWorkspace(workspaceId);
    const rows = await this.prisma.template.findMany({
      where: { workspaceId },
      orderBy: { slug: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        category: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return rows.map((row) =>
      TemplateDtoSchema.parse({
        ...row,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      }),
    );
  }
}
