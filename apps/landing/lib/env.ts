export const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000/api/v1";

export const CLIENT_APP_URL =
  process.env.NEXT_PUBLIC_CLIENT_APP_URL ?? "http://localhost:3003";

export const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ??
  "1045426416197-caerjkkajfie6j7789fi72trr35pltop.apps.googleusercontent.com";

export const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID ?? "";
