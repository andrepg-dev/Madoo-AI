export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

/** httpOnly cookie holding the admin's bearer token (this app's own session). */
export const ADMIN_TOKEN_COOKIE = "madoo.admin.token";
