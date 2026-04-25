import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreatePendingPromptDto } from "./dto/create-pending-prompt.dto";

@Injectable()
export class PromptsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreatePendingPromptDto) {
    return this.prisma.pendingPrompt.create({
      data: {
        userId,
        prompt: dto.prompt.trim(),
        tone: dto.tone ?? null,
        length: dto.length ?? null,
        audience: dto.audience ?? null,
      },
    });
  }

  async listForUser(userId: string) {
    return this.prisma.pendingPrompt.findMany({
      where: { userId, consumed: false },
      orderBy: { createdAt: "desc" },
    });
  }

  async consume(userId: string, id: string) {
    const pp = await this.prisma.pendingPrompt.findFirst({ where: { id, userId } });
    if (!pp) throw new NotFoundException("Pending prompt not found.");
    return this.prisma.pendingPrompt.update({
      where: { id },
      data: { consumed: true },
    });
  }
}
