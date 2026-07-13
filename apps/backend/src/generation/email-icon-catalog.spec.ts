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
});
