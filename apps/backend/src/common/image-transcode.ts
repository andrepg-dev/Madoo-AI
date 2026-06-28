import sharp from "sharp";

/**
 * Raster formats that render reliably *everywhere we care about*: the Alpine
 * headless-Chromium screenshot pipeline (prod) AND email clients (Gmail,
 * Outlook, Apple Mail). AVIF and WEBP fail in one or both — most painfully,
 * AVIF renders in a desktop browser (so the in-app editor preview looks fine)
 * but comes out blank in the Alpine Chromium screenshot and in inboxes. Any
 * type outside this set is transcoded before we host it.
 */
const EMAIL_SAFE_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
]);

export type SafeImage = { buffer: Buffer; contentType: string };

export function isEmailSafeImageType(contentType: string): boolean {
  return EMAIL_SAFE_IMAGE_TYPES.has(contentType);
}

/**
 * Convert an image buffer to an email-safe raster format. JPEG by default, PNG
 * when the source has an alpha channel (to preserve transparency). Already-safe
 * types pass through untouched. Throws if the buffer can't be decoded so the
 * caller can decide whether to skip or fall back to the original bytes.
 */
export async function toEmailSafeImage(
  buffer: Buffer,
  contentType: string,
): Promise<SafeImage> {
  if (isEmailSafeImageType(contentType)) return { buffer, contentType };

  const pipeline = sharp(buffer, { failOn: "none" });
  const meta = await pipeline.metadata();

  if (meta.hasAlpha) {
    return { buffer: await pipeline.png().toBuffer(), contentType: "image/png" };
  }

  return {
    buffer: await pipeline
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 82 })
      .toBuffer(),
    contentType: "image/jpeg",
  };
}
