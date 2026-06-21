import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, COOKIE_DOMAIN } from "@/lib/cookies";

const PUBLIC_PREFIXES = ["/invite", "/share"] as const;

const LANDING_URL =
  process.env.NEXT_PUBLIC_LANDING_URL ?? "http://localhost:3001";

const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000/api/v1";

function isPublicPath(pathname: string) {
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

async function isTokenValid(token: string) {
  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublicPath(pathname)) return NextResponse.next();

  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (token && (await isTokenValid(token))) return NextResponse.next();

  const redirect = new URL(LANDING_URL);

  const response = NextResponse.redirect(redirect);
  response.cookies.delete({ name: AUTH_COOKIE, domain: COOKIE_DOMAIN, path: "/" });
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
