import { Injectable, NotFoundException } from "@nestjs/common";
import {
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
    variantId: string,
    name: string,
  ): Promise<{ id: string; name: string; slug: string }> {
    const variant = await this.prisma.emailVariant.findFirst({
      where: { id: variantId, workspaceId },
      select: { componentCode: true, variableSchema: true },
    });
    if (!variant)
      throw new NotFoundException("Variant not found in workspace.");

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
        slug,
        name,
        componentCode: variant.componentCode,
        variableSchema: parseVariableSchemaJson(variant.variableSchema),
      },
      select: { id: true, name: true, slug: true },
    });
    return template;
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
