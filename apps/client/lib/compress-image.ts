// Downscale/recompress large images in the browser before upload. Vercel's
// serverless functions reject request bodies over ~4.5 MB (413), so a big photo
// or screenshot never reaches the upload route. Anthropic vision also downsizes
// images to ~1568px, so shrinking here costs no quality and saves tokens.
const MAX_DIMENSION = 1600;
const WEBP_QUALITY = 0.85;
// Files at or under this stay untouched (already comfortably under the limit).
const SKIP_BYTES = 1_500_000;
// Vercel rejects bodies over ~4.5 MB; leave headroom for the multipart wrapper.
export const MAX_UPLOAD_BYTES = 4_000_000;

/** Thrown when a file cannot be shrunk under the upload body limit. */
export class ImageTooLargeError extends Error {
  constructor(fileName: string) {
    super(
      `"${fileName}" is too large to attach — images must compress to under 4 MB.`,
    );
    this.name = "ImageTooLargeError";
  }
}

async function encodeScaled(
  bitmap: ImageBitmap,
  maxDimension: number,
  quality: number,
): Promise<Blob | null> {
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(bitmap, 0, 0, width, height);

  return new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", quality),
  );
}

export async function compressImage(file: File): Promise<File> {
  if (typeof document === "undefined") return file;
  if (!file.type.startsWith("image/")) return file;
  // Small GIFs keep their animation; a GIF over the body limit gets flattened
  // to a static frame below rather than bouncing off the route with a 413.
  if (file.type === "image/gif" && file.size <= MAX_UPLOAD_BYTES) return file;
  if (file.type !== "image/gif" && file.size <= SKIP_BYTES) return file;

  let compressed: File | null = null;
  try {
    // createImageBitmap decodes the first frame of an animated GIF.
    const bitmap = await createImageBitmap(file);
    // Second pass shrinks harder for files that stay over the limit.
    const passes: Array<[number, number]> = [
      [MAX_DIMENSION, WEBP_QUALITY],
      [1280, 0.7],
    ];
    for (const [maxDimension, quality] of passes) {
      const blob = await encodeScaled(bitmap, maxDimension, quality);
      if (blob && blob.size < file.size) {
        const name = `${file.name.replace(/\.[^.]+$/, "")}.webp`;
        compressed = new File([blob], name, { type: "image/webp" });
        if (blob.size <= MAX_UPLOAD_BYTES) break;
      }
    }
    bitmap.close?.();
  } catch {
    compressed = null;
  }

  const best = compressed && compressed.size < file.size ? compressed : file;
  // Never hand the route a body it is guaranteed to reject: fail loudly here
  // so the caller can tell the user instead of streaming without the image.
  if (best.size > MAX_UPLOAD_BYTES) throw new ImageTooLargeError(file.name);
  return best;
}
