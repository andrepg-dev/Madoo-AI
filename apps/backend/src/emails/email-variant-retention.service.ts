import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { S3Service } from "../s3/s3.service";

export const MAX_EMAIL_VERSIONS = 20;

@Injectable()
export class EmailVariantRetentionService {
  private readonly logger = new Logger(EmailVariantRetentionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
  ) {}

  /** Keep newest versions and clean their unshared preview objects. */
  async prune(emailId: string): Promise<number> {
    const stale = await this.prisma.emailVariant.findMany({
      where: { emailId },
      orderBy: { seq: "desc" },
      skip: MAX_EMAIL_VERSIONS,
      select: { id: true, previewUrl: true },
    });
    if (stale.length === 0) return 0;

    const previewUrls = [
      ...new Set(
        stale
          .map((variant) => variant.previewUrl)
          .filter((url): url is string => Boolean(url)),
      ),
    ];
    const sharedPreviews =
      previewUrls.length > 0
        ? await this.prisma.communityTemplate.findMany({
            where: { previewUrl: { in: previewUrls } },
            select: { previewUrl: true },
          })
        : [];
    const protectedUrls = new Set(
      sharedPreviews
        .map((template) => template.previewUrl)
        .filter((url): url is string => Boolean(url)),
    );

    const deleted = await this.prisma.emailVariant.deleteMany({
      where: { id: { in: stale.map((variant) => variant.id) } },
    });

    const cleanup = await Promise.allSettled(
      previewUrls
        .filter((url) => !protectedUrls.has(url))
        .map((url) => this.s3.deletePublicUrl(url)),
    );
    const failures = cleanup.filter((result) => result.status === "rejected");
    if (failures.length > 0) {
      this.logger.warn(
        `Deleted ${deleted.count} old variants for ${emailId}, but ${failures.length} preview objects could not be removed.`,
      );
    }
    return deleted.count;
  }
}
