import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/cookies";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/settings",
  "/email-template-project",
];

const LANDING_URL =
  process.env.NEXT_PUBLIC_LANDING_URL ?? "http://localhost:3001";

const CLIENT_APP_URL =
  process.env.NEXT_PUBLIC_CLIENT_APP_URL ?? "http://localhost:3003";

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (!isProtected) return NextResponse.next();

  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (token) return NextResponse.next();

  const redirect = new URL(LANDING_URL);
  const next = new URL(`${pathname}${search}`, CLIENT_APP_URL);
  redirect.searchParams.set("next", next.toString());
  return NextResponse.redirect(redirect);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/settings/:path*",
    "/settings",
    "/email-template-project/:path*",
    "/email-template-project",
  ],
};
