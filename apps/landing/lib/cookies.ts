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
const COOKIE_DOMAIN =
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
