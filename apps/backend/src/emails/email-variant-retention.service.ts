import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { S3Service } from "../s3/s3.service";

export const MAX_EMAIL_VERSIONS = 20;
/**
 * Preview screenshots we keep per email. Only the newest variant's preview is
 * ever rendered (project cards, search, share metadata), so anything older is
 * dead weight in S3 — we keep one spare for the in-flight/just-superseded case.
 */
export const MAX_EMAIL_PREVIEWS = 2;

@Injectable()
export class EmailVariantRetentionService {
  private readonly logger = new Logger(EmailVariantRetentionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
  ) {}

  /** Drop versions past the cap, then drop preview objects past the preview cap. */
  async prune(emailId: string): Promise<number> {
    const deleted = await this.pruneVersions(emailId);
    await this.prunePreviews(emailId);
    return deleted;
  }

  /** Keep newest versions and clean their unshared preview objects. */
  private async pruneVersions(emailId: string): Promise<number> {
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
    const protectedUrls = await this.sharedPreviewUrls(previewUrls);

    const deleted = await this.prisma.emailVariant.deleteMany({
      where: { id: { in: stale.map((variant) => variant.id) } },
    });

    const failures = await this.deleteObjects(
      previewUrls.filter((url) => !protectedUrls.has(url)),
    );
    if (failures > 0) {
      this.logger.warn(
        `Deleted ${deleted.count} old variants for ${emailId}, but ${failures} preview objects could not be removed.`,
      );
    }
    return deleted.count;
  }

  /**
   * Drop preview screenshots for every variant older than the newest
   * `MAX_EMAIL_PREVIEWS`, keeping the variant rows so version history stays
   * navigable. The DB is cleared first so a failed S3 delete leaves a harmless
   * orphan object rather than a row pointing at a missing image.
   */
  private async prunePreviews(emailId: string): Promise<number> {
    const stale = await this.prisma.emailVariant.findMany({
      where: { emailId, previewUrl: { not: null } },
      orderBy: { seq: "desc" },
      skip: MAX_EMAIL_PREVIEWS,
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
    const protectedUrls = await this.sharedPreviewUrls(previewUrls);

    await this.prisma.emailVariant.updateMany({
      where: { id: { in: stale.map((variant) => variant.id) } },
      data: { previewUrl: null },
    });

    // A newer variant may point at the same object (e.g. an unchanged re-save);
    // only remove objects nothing references anymore.
    const stillReferenced = await this.prisma.emailVariant.findMany({
      where: { previewUrl: { in: previewUrls } },
      select: { previewUrl: true },
    });
    for (const variant of stillReferenced) {
      if (variant.previewUrl) protectedUrls.add(variant.previewUrl);
    }

    const removable = previewUrls.filter((url) => !protectedUrls.has(url));
    const failures = await this.deleteObjects(removable);
    if (failures > 0) {
      this.logger.warn(
        `Cleared ${stale.length} stale previews for ${emailId}, but ${failures} objects could not be removed.`,
      );
    }
    return removable.length;
  }

  /** Preview URLs also used by a community template, which must outlive the variant. */
  private async sharedPreviewUrls(urls: string[]): Promise<Set<string>> {
    if (urls.length === 0) return new Set();
    const shared = await this.prisma.communityTemplate.findMany({
      where: { previewUrl: { in: urls } },
      select: { previewUrl: true },
    });
    return new Set(
      shared
        .map((template) => template.previewUrl)
        .filter((url): url is string => Boolean(url)),
    );
  }

  /** Best-effort object removal; returns how many deletes failed. */
  private async deleteObjects(urls: string[]): Promise<number> {
    if (urls.length === 0) return 0;
    const results = await Promise.allSettled(
      urls.map((url) => this.s3.deletePublicUrl(url)),
    );
    return results.filter((result) => result.status === "rejected").length;
  }
}
