import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import {
  GoogleLoginInputSchema,
  GoogleLoginResponseSchema,
  type GoogleLoginResponse,
} from "@madoo/shared";
import { API_URL } from "@/lib/env";
import {
  AUTH_COOKIE,
  AUTH_COOKIE_OPTIONS,
  WORKSPACE_COOKIE,
  WORKSPACE_COOKIE_OPTIONS,
} from "@/lib/cookies";

export async function POST(req: NextRequest) {
  const bodyRaw = await req.json().catch(() => null);
  const body = GoogleLoginInputSchema.safeParse(bodyRaw);
  if (!body.success) {
    return Response.json(
      { message: "Invalid Google login payload." },
      { status: 400 },
    );
  }

  const upstream = await fetch(`${API_URL}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body.data),
    cache: "no-store",
  });

  const raw = await upstream.json().catch(() => null);
  if (!upstream.ok) {
    return Response.json(
      raw ?? { message: `Auth request failed (${upstream.status})` },
      { status: upstream.status },
    );
  }

  const parsed = GoogleLoginResponseSchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json(
      { message: "Invalid auth response." },
      { status: 502 },
    );
  }

  const result: GoogleLoginResponse = parsed.data;
  const jar = await cookies();
  jar.set(AUTH_COOKIE, result.token, AUTH_COOKIE_OPTIONS);
  jar.set(
    WORKSPACE_COOKIE,
    result.defaultWorkspaceId,
    WORKSPACE_COOKIE_OPTIONS,
  );

  return Response.json({
    user: result.user,
    workspaces: result.workspaces,
    defaultWorkspaceId: result.defaultWorkspaceId,
  });
}
