import {
  PendingPromptSchema,
  type CreatePendingPromptInput,
  type PendingPrompt,
} from "@madoo/shared";
import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class PromptsService {
  constructor(private readonly prisma: PrismaService) {}
  async create(
    userId: string,
    dto: CreatePendingPromptInput,
  ): Promise<PendingPrompt> {
    const row = await this.prisma.pendingPrompt.create({
      data: {
        userId,
        prompt: dto.prompt.trim(),
        tone: dto.tone ?? null,
        length: dto.length ?? null,
        audience: dto.audience ?? null,
      },
    });
    return PendingPromptSchema.parse({
      ...row,
      createdAt: row.createdAt.toISOString(),
    });
  }

  async listForUser(userId: string): Promise<PendingPrompt[]> {
    const rows = await this.prisma.pendingPrompt.findMany({
      where: { userId, consumed: false },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((row) =>
      PendingPromptSchema.parse({
        ...row,
        createdAt: row.createdAt.toISOString(),
      }),
    );
  }

  async consume(userId: string, id: string): Promise<PendingPrompt> {
    const pp = await this.prisma.pendingPrompt.findFirst({
      where: { id, userId },
    });
    if (!pp) throw new NotFoundException("Pending prompt not found.");
    const row = await this.prisma.pendingPrompt.update({
      where: { id },
      data: { consumed: true },
    });
    return PendingPromptSchema.parse({
      ...row,
      createdAt: row.createdAt.toISOString(),
    });
  }
}
