import { CLIENT_APP_URL, LANDING_URL } from "@/lib/env";

function resolveClientUrl(nextPath: string): string {
  const clientOrigin = new URL(CLIENT_APP_URL).origin;

  try {
    const url = new URL(nextPath, CLIENT_APP_URL);
    return url.origin === clientOrigin
      ? url.toString()
      : new URL("/", CLIENT_APP_URL).toString();
  } catch {
    return new URL("/", CLIENT_APP_URL).toString();
  }
}

export function buildLandingAuthUrl(nextPath = "/") {
  const url = new URL(LANDING_URL);
  url.searchParams.set("next", resolveClientUrl(nextPath));
  return url.toString();
}

export function redirectToLandingAuth(nextPath = "/") {
  window.location.assign(buildLandingAuthUrl(nextPath));
}
