export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

/**
 * Google OAuth Web client ID — the same Web client as the backend's
 * GOOGLE_CLIENT_ID and apps/landing. Its Authorized JavaScript origins must
 * include this admin app's own origin (e.g. https://madoo-admin.vercel.app).
 */
export const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ??
  "1045426416197-caerjkkajfie6j7789fi72trr35pltop.apps.googleusercontent.com";

/** httpOnly cookie holding the admin's bearer token (this app's own session). */
export const ADMIN_TOKEN_COOKIE = "madoo.admin.token";
