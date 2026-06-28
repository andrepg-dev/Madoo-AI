import { ConfigService } from "@nestjs/config";
import { isEmailSafeImageType, toEmailSafeImage } from "../common/image-transcode";
import { S3Service } from "../s3/s3.service";

/**
 * Re-encode already-hosted images that are stored in an email-unsafe format
 * (AVIF/WEBP). These render in a desktop browser but come out blank in the
 * Alpine headless-Chromium screenshot and in most inboxes — the classic
 * "background image renders in the editor but not in the preview card" bug.
 *
 * Objects are rewritten *in place* (same S3 key), so every URL already baked
 * into existing emails keeps working — no DB rewrite needed.
 *
 * Usage:
 *   pnpm backfill:image-formats                       # found-images, all
 *   pnpm backfill:image-formats -- --prefix email-images/
 *   pnpm backfill:image-formats -- --limit 50 --dry-run
 */
function parseArg(name: string): string | undefined {
  const idx = process.argv.findIndex((a) => a === name);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

function parseIntArg(name: string, fallback: number): number {
  const v = parseArg(name);
  const n = v ? Number(v) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

async function main() {
  const prefix = parseArg("--prefix") ?? "found-images/";
  const limit = parseIntArg("--limit", Number.POSITIVE_INFINITY);
  const dryRun = process.argv.includes("--dry-run");

  const config = new ConfigService(process.env);
  const s3 = new S3Service(config);

  console.log(
    `[backfill-images] prefix=${prefix} limit=${limit} dryRun=${dryRun}`,
  );

  const keys = await s3.listKeys(prefix);
  console.log(`[backfill-images] ${keys.length} object(s) under ${prefix}`);

  let converted = 0;
  let skipped = 0;
  let failed = 0;

  for (const key of keys) {
    if (converted >= limit) break;
    try {
      const { buffer, contentType } = await s3.getObject(key);
      if (isEmailSafeImageType(contentType)) {
        skipped += 1;
        continue;
      }

      const safe = await toEmailSafeImage(buffer, contentType);
      if (dryRun) {
        console.log(
          `[backfill-images] WOULD convert ${key} (${contentType} -> ${safe.contentType})`,
        );
      } else {
        await s3.putObjectAtKey(key, safe.buffer, safe.contentType);
        console.log(
          `[backfill-images] OK ${key} (${contentType} -> ${safe.contentType})`,
        );
      }
      converted += 1;
    } catch (e) {
      failed += 1;
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[backfill-images] FAIL ${key}: ${msg}`);
    }
  }

  console.log(
    `[backfill-images] done. converted=${converted} skipped=${skipped} failed=${failed}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
