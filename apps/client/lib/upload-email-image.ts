import { EmailImageUploadResponseSchema } from "@madoo/shared";

/**
 * Upload one image for an email via the `/api/emails/[id]/images` route handler
 * and return its public URL. Uses a plain client fetch (not a Server Action),
 * which is the path that reliably reaches the backend in production.
 */
export async function uploadEmailImage(
  emailId: string,
  formData: FormData,
): Promise<string> {
  const res = await fetch(`/api/emails/${emailId}/images`, {
    method: "POST",
    body: formData,
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
