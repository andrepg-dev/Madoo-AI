import { CLIENT_APP_URL } from "./env";

const WORKSPACE_COOKIE = "madoo.workspace.id";

/**
 * The auth + workspace cookies are shared across `.madooai.com`, and the
 * workspace cookie is readable from JS — its presence is a good-enough signal
 * that the visitor is already signed in, so we can send them straight to the
 * app to use a template instead of forcing the login dialog.
 */
export function isLikelySignedIn(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .some((part) => part.trim().startsWith(`${WORKSPACE_COOKIE}=`));
}

export function clientUseTemplateUrl(id: string): string {
  const url = new URL("/use-template", CLIENT_APP_URL);
  url.searchParams.set("id", id);
  return url.toString();
}

// Already-signed-in visitors own a session on the app, so their prompt is handed
// straight to the app to start generating instead of through the login dialog.
// Pasted/attached images are uploaded first and passed as public S3 URLs, since
// File objects can't survive the cross-subdomain navigation.
export function clientPromptUrl(
  prompt: string,
  tone?: string,
  length?: string,
  imageUrls?: string[],
): string {
  const url = new URL("/email-template-project", CLIENT_APP_URL);
  url.searchParams.set("prompt", prompt);
  if (tone) url.searchParams.set("tone", tone);
  if (length) url.searchParams.set("length", length);
  for (const imageUrl of imageUrls ?? []) {
    url.searchParams.append("imageUrls", imageUrl);
  }
  return url.toString();
}

export function clientHomeUrl(): string {
  return new URL("/", CLIENT_APP_URL).toString();
}
