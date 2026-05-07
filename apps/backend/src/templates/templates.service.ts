import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SEED_TEMPLATE_SLUGS, SEED_TEMPLATES } from "./seed-templates";

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Inserts gallery seed templates when missing (idempotent per workspace slug). */
  async ensureSeedForWorkspace(workspaceId: string): Promise<void> {
    for (const slug of SEED_TEMPLATE_SLUGS) {
      const meta = SEED_TEMPLATES[slug];
      await this.prisma.template.upsert({
        where: { workspaceId_slug: { workspaceId, slug } },
        create: {
          workspaceId,
          slug,
          name: meta.name,
          category: meta.category,
          description: meta.description,
          componentCode: meta.componentCode,
        },
        update: {},
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
      select: { componentCode: true },
    });
    if (!variant) throw new NotFoundException("Variant not found in workspace.");

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
      },
      select: { id: true, name: true, slug: true },
    });
    return template;
  }

  async listForWorkspace(workspaceId: string) {
    await this.ensureSeedForWorkspace(workspaceId);
    return this.prisma.template.findMany({
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
  }
}
