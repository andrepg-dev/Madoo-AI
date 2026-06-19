export const AUTH_COOKIE = "madoo.auth.token";
export const WORKSPACE_COOKIE = "madoo.workspace.id";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

type CookieOptions = {
  httpOnly?: boolean;
  sameSite?: "lax" | "strict" | "none";
  secure?: boolean;
  path?: string;
  maxAge?: number;
  domain?: string;
};

// Shared across landing (madooai.com) and the app (my.madooai.com) so the
// session survives the cross-subdomain redirect. Host-only in dev (localhost).
export const COOKIE_DOMAIN =
  process.env.NODE_ENV === "production" ? ".madooai.com" : undefined;

export const AUTH_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: ONE_YEAR_SECONDS,
  domain: COOKIE_DOMAIN,
};

export const WORKSPACE_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: false,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: ONE_YEAR_SECONDS,
  domain: COOKIE_DOMAIN,
};

function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${name}=`;
  for (const part of document.cookie.split(";")) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) return decodeURIComponent(trimmed.slice(prefix.length));
  }
  return null;
}

export function readCookie(name: string): string | null {
  return getCookieValue(name);
}

export function writeCookie(name: string, value: string | null) {
  if (typeof document === "undefined") return;
  const domainAttr = COOKIE_DOMAIN ? `; Domain=${COOKIE_DOMAIN}` : "";
  if (!value) {
    document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax${domainAttr}`;
    return;
  }
  const encoded = encodeURIComponent(value);
  document.cookie = `${name}=${encoded}; Path=/; Max-Age=${ONE_YEAR_SECONDS}; SameSite=Lax${domainAttr}`;
}
