export const AUTH_COOKIE = "madoo.auth.token";
export const WORKSPACE_COOKIE = "madoo.workspace.id";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

type CookieOptions = {
  httpOnly?: boolean;
  sameSite?: "lax" | "strict" | "none";
  secure?: boolean;
  path?: string;
  maxAge?: number;
};

export const AUTH_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: ONE_YEAR_SECONDS,
};

export const WORKSPACE_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: false,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: ONE_YEAR_SECONDS,
};
