import { ConfigService } from "@nestjs/config";
import { PrismaClient } from "@prisma/client";
import { ScreenshotService } from "../generation/screenshot.service";
import { S3Service } from "../s3/s3.service";

/**
 * Regenerate community-template preview screenshots.
 *
 * A community template stores its own `compiledHtml` + `previewUrl` snapshot
 * taken at publish time (the `previewUrl` is copied from the source variant).
 * When the source image was an email-unsafe format (AVIF/WEBP), that cached
 * screenshot came out blank — and the per-variant preview backfill does NOT
 * touch this table. Since the underlying S3 image has since been transcoded to
 * JPEG/PNG (same key), re-screenshotting each template's own `compiledHtml`
 * now produces a correct preview.
 *
 * Usage:
 *   pnpm backfill:community-previews                 # only templates referencing
 *                                                    # found-images/ or email-images/
 *   pnpm backfill:community-previews -- --all        # every template
 *   pnpm backfill:community-previews -- --limit 5 --dry-run
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
  const all = process.argv.includes("--all");
  const dryRun = process.argv.includes("--dry-run");
  const limit = parseIntArg("--limit", Number.POSITIVE_INFINITY);

  const prisma = new PrismaClient();
  const config = new ConfigService(process.env);
  const screenshot = new ScreenshotService();
  const s3 = new S3Service(config);

  const templates = await prisma.communityTemplate.findMany({
    where: all
      ? {}
      : {
          OR: [
            { compiledHtml: { contains: "found-images/" } },
            { compiledHtml: { contains: "email-images/" } },
          ],
        },
    select: { id: true, name: true, compiledHtml: true },
  });

  console.log(
    `[community-previews] ${templates.length} template(s) to process (all=${all} dryRun=${dryRun})`,
  );

  let ok = 0;
  let fail = 0;

  for (const t of templates) {
    if (ok >= limit) break;
    try {
      if (dryRun) {
        console.log(`[community-previews] WOULD regenerate ${t.id} (${t.name})`);
        ok += 1;
        continue;
      }
      const buffer = await screenshot.screenshotHtml(t.compiledHtml, {
        highlightVariables: true,
      });
      const url = await s3.uploadBuffer(buffer, "image/png", "community-previews");
      await prisma.communityTemplate.update({
        where: { id: t.id },
        data: { previewUrl: url },
      });
      ok += 1;
      console.log(`[community-previews] OK ${t.id} (${t.name}) -> ${url}`);
    } catch (e) {
      fail += 1;
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[community-previews] FAIL ${t.id}: ${msg}`);
    }
  }

  console.log(`[community-previews] done. ok=${ok} fail=${fail}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
