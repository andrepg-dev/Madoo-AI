import {
  PendingPromptSchema,
  type CreatePendingPromptInput,
  type PendingPrompt,
} from "@madoo/shared";
import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { EmailsService } from "../emails/emails.service";
import { GenerationService } from "../generation/generation.service";

@Injectable()
export class PromptsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emails: EmailsService,
    private readonly generation: GenerationService,
  ) {}
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
    if (pp.consumed) {
      const row = await this.prisma.pendingPrompt.findUniqueOrThrow({
        where: { id },
      });
      const sourced = await this.prisma.email.findUnique({
        where: { sourcePendingPromptId: id },
        select: { id: true },
      });
      return PendingPromptSchema.parse({
        ...row,
        createdAt: row.createdAt.toISOString(),
        emailId: sourced?.id,
      });
    }

    const { emailId, workspaceId } = await this.emails.consumePendingIntoEmail(userId, id);
    void this.generation.generateEmailInBackground(emailId, workspaceId);

    const row = await this.prisma.pendingPrompt.findUniqueOrThrow({
      where: { id },
    });

    return PendingPromptSchema.parse({
      ...row,
      createdAt: row.createdAt.toISOString(),
      emailId,
    });
  }
}
