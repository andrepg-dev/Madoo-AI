import {
  PendingPromptSchema,
  type CreatePendingPromptInput,
  type PendingPrompt,
} from "@madoo/shared";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { EmailsService } from "../emails/emails.service";
import { S3Service } from "../s3/s3.service";

const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
];

@Injectable()
export class PromptsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emails: EmailsService,
    private readonly s3: S3Service,
  ) {}

  /** Upload a landing prompt-box attachment to S3 and return its public URL.
   * Not tied to an email yet — the URL is carried into generation later. */
  async uploadAttachment(
    file: { buffer: Buffer; mimetype: string } | undefined,
  ): Promise<{ url: string }> {
    if (!file) {
      throw new BadRequestException("No image file provided.");
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      throw new BadRequestException("Image must be PNG, JPEG, WEBP, or GIF.");
    }
    if (file.buffer.byteLength > 8 * 1024 * 1024) {
      throw new BadRequestException("Image must be smaller than 8 MB.");
    }
    const url = await this.s3.uploadBuffer(
      file.buffer,
      file.mimetype,
      "prompt-attachments",
    );
    return { url };
  }

  async create(
    userId: string,
    dto: CreatePendingPromptInput,
  ): Promise<PendingPrompt> {
    const row = await this.prisma.pendingPrompt.create({
      data: {
        userId,
        prompt: dto.prompt.trim(),
        imageUrls: dto.imageUrls ?? [],
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

    const { emailId } = await this.emails.consumePendingIntoEmail(userId, id);

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
