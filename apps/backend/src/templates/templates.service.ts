import { Injectable } from "@nestjs/common";
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
