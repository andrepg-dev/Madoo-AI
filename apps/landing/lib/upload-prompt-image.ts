import { compressImage } from "@/lib/compress-image";

/**
 * Upload one landing prompt-box image via the `/api/prompt-attachments` route
 * handler and return its public S3 URL. A File can't ride the cross-subdomain
 * URL/store handoff into the app, so we turn it into a public URL here and carry
 * that across instead. Uses a plain client fetch (not a Server Action), the path
 * that reliably reaches the backend in production. Large images are downscaled
 * first to stay under Vercel's ~4.5 MB body limit.
 */
export async function uploadPromptImage(file: File): Promise<string> {
  const compressed = await compressImage(file);
  const form = new FormData();
  form.append("file", compressed);

  const res = await fetch("/api/prompt-attachments", {
    method: "POST",
    body: form,
    credentials: "include",
  });
  if (!res.ok) {
    const payload = (await res.json().catch(() => null)) as {
      message?: string;
    } | null;
    throw new Error(payload?.message ?? `Image upload failed (${res.status})`);
  }
  const data = (await res.json()) as { url?: unknown };
  if (typeof data.url !== "string") {
    throw new Error("Upload response missing url.");
  }
  return data.url;
}

/** Upload several images, preserving order. Skips non-image files. */
export async function uploadPromptImages(files: File[]): Promise<string[]> {
  const images = files.filter((file) => file.type.startsWith("image/"));
  if (images.length === 0) return [];
  return Promise.all(images.map((file) => uploadPromptImage(file)));
}
