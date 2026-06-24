import { EmailImageUploadResponseSchema } from "@madoo/shared";
import { compressImage } from "@/lib/compress-image";

/**
 * Upload one image for an email via the `/api/emails/[id]/images` route handler
 * and return its public URL. Uses a plain client fetch (not a Server Action),
 * which is the path that reliably reaches the backend in production. Large
 * images are downscaled first to stay under Vercel's ~4.5 MB body limit.
 */
export async function uploadEmailImage(
  emailId: string,
  file: File,
): Promise<string> {
  const compressed = await compressImage(file);
  const form = new FormData();
  form.append("file", compressed);

  const res = await fetch(`/api/emails/${emailId}/images`, {
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
  return EmailImageUploadResponseSchema.parse(await res.json()).url;
}
