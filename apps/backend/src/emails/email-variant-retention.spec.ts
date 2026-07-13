import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  EmailVariantRetentionService,
  MAX_EMAIL_VERSIONS,
} from "./email-variant-retention.service";

describe("EmailVariantRetentionService", () => {
  it("keeps newest 20 and removes unshared preview objects", async () => {
    const stale = [
      { id: "v2", previewUrl: "https://bucket.s3.region.amazonaws.com/v2.png" },
      { id: "v1", previewUrl: "https://bucket.s3.region.amazonaws.com/v1.png" },
    ];
    const deletedIds: string[] = [];
    const deletedUrls: string[] = [];
    const prisma = {
      emailVariant: {
        findMany: async (args: { skip: number }) => {
          assert.equal(args.skip, MAX_EMAIL_VERSIONS);
          return stale;
        },
        deleteMany: async (args: { where: { id: { in: string[] } } }) => {
          deletedIds.push(...args.where.id.in);
          return { count: args.where.id.in.length };
        },
      },
      communityTemplate: {
        findMany: async () => [{ previewUrl: stale[0].previewUrl }],
      },
    };
    const s3 = {
      deletePublicUrl: async (url: string) => {
        deletedUrls.push(url);
        return true;
      },
    };
    const service = new EmailVariantRetentionService(
      prisma as never,
      s3 as never,
    );

    assert.equal(await service.prune("email-1"), 2);
    assert.deepEqual(deletedIds, ["v2", "v1"]);
    assert.deepEqual(deletedUrls, [stale[1].previewUrl]);
  });

  it("does nothing when no stale versions exist", async () => {
    let deleted = false;
    const service = new EmailVariantRetentionService(
      {
        emailVariant: {
          findMany: async () => [],
          deleteMany: async () => {
            deleted = true;
            return { count: 0 };
          },
        },
      } as never,
      {} as never,
    );

    assert.equal(await service.prune("email-1"), 0);
    assert.equal(deleted, false);
  });
});
