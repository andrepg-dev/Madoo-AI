import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { EmailIconCatalogService } from "./email-icon-catalog.service";

describe("EmailIconCatalogService", () => {
  it("renders unique requested icons as cached deterministic PNG assets", async () => {
    const uploads: Array<{ key: string; buffer: Buffer; type: string }> = [];
    const s3 = {
      putObjectAtKey: async (key: string, buffer: Buffer, type: string) => {
        uploads.push({ key, buffer, type });
      },
      publicUrlForKey: (key: string) => `https://assets.example/${key}`,
    };
    const service = new EmailIconCatalogService(s3 as never);

    const first = await service.getIcons(
      ["check", "instagram", "check"],
      "dark",
    );
    assert.deepEqual(
      first.map((icon) => icon.name),
      ["check", "instagram"],
    );
    assert.deepEqual(
      uploads.map((upload) => upload.key).sort(),
      [
        "email-icons/v1/check-dark.png",
        "email-icons/v1/instagram-dark.png",
      ].sort(),
    );
    for (const upload of uploads) {
      assert.equal(upload.type, "image/png");
      assert.equal(upload.buffer.subarray(1, 4).toString(), "PNG");
    }

    await service.getIcons(["check", "instagram"], "dark");
    assert.equal(uploads.length, 2, "second request should use memory cache");
  });

  it("renders badge-style icons keyed by fill color, defaulting from tone", async () => {
    const uploads: Array<{ key: string; buffer: Buffer; type: string }> = [];
    const s3 = {
      putObjectAtKey: async (key: string, buffer: Buffer, type: string) => {
        uploads.push({ key, buffer, type });
      },
      publicUrlForKey: (key: string) => `https://assets.example/${key}`,
    };
    const service = new EmailIconCatalogService(s3 as never);

    const branded = await service.getIcons(["star"], "dark", "badge", "#356BFF");
    assert.equal(branded[0].url.endsWith("star-badge-356bff.png"), true);

    const neutral = await service.getIcons(["star"], "dark", "badge");
    assert.equal(neutral[0].url.endsWith("star-badge-17181a.png"), true);

    // Invalid hex falls back to the tone-derived neutral fill (cached above).
    const invalid = await service.getIcons(["star"], "dark", "badge", "blue");
    assert.equal(invalid[0].url, neutral[0].url);

    assert.equal(uploads.length, 2);
    for (const upload of uploads) {
      assert.equal(upload.type, "image/png");
      assert.equal(upload.buffer.subarray(1, 4).toString(), "PNG");
    }
  });
});
