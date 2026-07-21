import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  EmailVariantRetentionService,
  MAX_EMAIL_PREVIEWS,
  MAX_EMAIL_VERSIONS,
} from "./email-variant-retention.service";

type FindManyArgs = {
  skip?: number;
  where?: { previewUrl?: unknown };
  select?: unknown;
};

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
        findMany: async (args: FindManyArgs) => {
          // First call is the version sweep; the later preview sweep runs on the
          // already-trimmed set, which this fixture leaves empty.
          if (args.skip === MAX_EMAIL_VERSIONS) return stale;
          return [];
        },
        deleteMany: async (args: { where: { id: { in: string[] } } }) => {
          deletedIds.push(...args.where.id.in);
          return { count: args.where.id.in.length };
        },
        updateMany: async () => ({ count: 0 }),
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

  it("clears previews past the preview cap but keeps the variant rows", async () => {
    const stalePreviews = [
      { id: "v8", previewUrl: "https://bucket.s3.region.amazonaws.com/v8.png" },
      { id: "v7", previewUrl: "https://bucket.s3.region.amazonaws.com/v7.png" },
    ];
    const clearedIds: string[] = [];
    const deletedUrls: string[] = [];
    let deletedRows = false;
    const prisma = {
      emailVariant: {
        findMany: async (args: FindManyArgs) => {
          if (args.skip === MAX_EMAIL_VERSIONS) return [];
          if (args.skip === MAX_EMAIL_PREVIEWS) return stalePreviews;
          // Post-update re-check for objects a newer variant still points at.
          return [];
        },
        deleteMany: async () => {
          deletedRows = true;
          return { count: 0 };
        },
        updateMany: async (args: {
          where: { id: { in: string[] } };
          data: { previewUrl: null };
        }) => {
          assert.equal(args.data.previewUrl, null);
          clearedIds.push(...args.where.id.in);
          return { count: args.where.id.in.length };
        },
      },
      communityTemplate: { findMany: async () => [] },
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

    assert.equal(await service.prune("email-1"), 0);
    assert.equal(deletedRows, false);
    assert.deepEqual(clearedIds, ["v8", "v7"]);
    assert.deepEqual(deletedUrls, [
      stalePreviews[0].previewUrl,
      stalePreviews[1].previewUrl,
    ]);
  });

  it("keeps a preview object a community template still shares", async () => {
    const shared = "https://bucket.s3.region.amazonaws.com/shared.png";
    const deletedUrls: string[] = [];
    const prisma = {
      emailVariant: {
        findMany: async (args: FindManyArgs) =>
          args.skip === MAX_EMAIL_PREVIEWS
            ? [{ id: "v5", previewUrl: shared }]
            : [],
        deleteMany: async () => ({ count: 0 }),
        updateMany: async () => ({ count: 1 }),
      },
      communityTemplate: { findMany: async () => [{ previewUrl: shared }] },
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

    await service.prune("email-1");
    assert.deepEqual(deletedUrls, []);
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
          updateMany: async () => ({ count: 0 }),
        },
      } as never,
      {} as never,
    );

    assert.equal(await service.prune("email-1"), 0);
    assert.equal(deleted, false);
  });
});
