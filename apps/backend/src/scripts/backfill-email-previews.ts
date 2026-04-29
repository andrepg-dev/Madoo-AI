import { ConfigService } from "@nestjs/config";
import { PrismaClient } from "@prisma/client";
import { ScreenshotService } from "../generation/screenshot.service";
import { S3Service } from "../s3/s3.service";

function parseArgInt(name: string, fallback: number): number {
  const idx = process.argv.findIndex((a) => a === name);
  if (idx === -1) return fallback;
  const v = process.argv[idx + 1];
  const n = v ? Number(v) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

async function main() {
  const limit = parseArgInt("--limit", 20);
  const onlyReady = process.argv.includes("--ready-only");

  const prisma = new PrismaClient();
  const config = new ConfigService(process.env);
  const screenshot = new ScreenshotService();
  const s3 = new S3Service(config);

  const variants = await prisma.emailVariant.findMany({
    where: {
      previewUrl: null,
      ...(onlyReady ? { email: { status: "READY" } } : {}),
    },
    take: limit,
    select: { id: true, compiledHtml: true },
  });

  if (variants.length === 0) {
    console.log(`[backfill] No hay variantes con previewUrl=null (limit=${limit}).`);
    return;
  }

  console.log(`[backfill] Generando previews para ${variants.length} variantes…`);

  let ok = 0;
  let fail = 0;

  for (const v of variants) {
    try {
      const buffer = await screenshot.screenshotHtml(v.compiledHtml);
      const url = await s3.uploadBuffer(buffer, "image/png", "email-previews");
      await prisma.emailVariant.update({
        where: { id: v.id },
        data: { previewUrl: url },
      });
      ok += 1;
      console.log(`[backfill] OK ${v.id} -> ${url}`);
    } catch (e) {
      fail += 1;
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[backfill] FAIL ${v.id}: ${msg}`);
    }
  }

  console.log(`[backfill] terminado. ok=${ok} fail=${fail}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    // Prisma connection cleanup
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    await Promise.resolve();
  });

