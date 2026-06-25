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

    return this.prisma.feedback.create({
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
