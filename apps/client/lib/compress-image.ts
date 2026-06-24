// Downscale/recompress large images in the browser before upload. Vercel's
// serverless functions reject request bodies over ~4.5 MB (413), so a big photo
// or screenshot never reaches the upload route. Anthropic vision also downsizes
// images to ~1568px, so shrinking here costs no quality and saves tokens.
const MAX_DIMENSION = 1600;
const WEBP_QUALITY = 0.85;
// Files at or under this stay untouched (already comfortably under the limit).
const SKIP_BYTES = 1_500_000;

export async function compressImage(file: File): Promise<File> {
  if (typeof document === "undefined") return file;
  if (!file.type.startsWith("image/")) return file;
  // Leave (possibly animated) GIFs and already-small files alone.
  if (file.type === "image/gif" || file.size <= SKIP_BYTES) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(
      1,
      MAX_DIMENSION / Math.max(bitmap.width, bitmap.height),
    );
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close?.();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", WEBP_QUALITY),
    );
    if (!blob || blob.size >= file.size) return file;

    const name = `${file.name.replace(/\.[^.]+$/, "")}.webp`;
    return new File([blob], name, { type: "image/webp" });
  } catch {
    return file;
  }
}
