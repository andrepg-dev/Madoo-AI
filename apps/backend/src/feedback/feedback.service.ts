import { Injectable } from "@nestjs/common";
import { CreateFeedbackInputSchema } from "@madoo/shared";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class FeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  async create(params: {
    userId: string;
    userEmail: string;
    workspaceHeader?: string;
    body: unknown;
  }) {
    const input = CreateFeedbackInputSchema.parse(params.body);

    const feedback = await this.prisma.feedback.create({
      data: {
        userId: params.userId,
        userEmail: params.userEmail,
        rating: input.rating,
        message: input.message,
        page: input.page,
        workspaceId: input.workspaceId ?? params.workspaceHeader,
      },
      include: { user: { select: { name: true } } },
    });

    try {
      await this.prisma.productEvent.create({
        data: {
          userId: params.userId,
          workspaceId: feedback.workspaceId,
          name: "feedback.submitted",
          source: "feedback.widget",
          properties: { feedbackId: feedback.id, rating: feedback.rating },
        },
      });
    } catch {
      // Feedback is the source of truth; analytics is best-effort.
    }

    return feedback;
  }

  async list(params: { take: number; skip: number }) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.feedback.findMany({
        orderBy: { createdAt: "desc" },
        take: params.take,
        skip: params.skip,
        include: { user: { select: { name: true } } },
      }),
      this.prisma.feedback.count(),
    ]);

    return { items, total };
  }
}
