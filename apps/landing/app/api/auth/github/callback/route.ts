import {
  AUTH_COOKIE,
  AUTH_COOKIE_OPTIONS,
  WORKSPACE_COOKIE,
  WORKSPACE_COOKIE_OPTIONS,
} from "@/lib/cookies";
import { API_URL, CLIENT_APP_URL } from "@/lib/env";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

type GithubState = {
  next?: string;
  pendingPrompt?: string;
  pendingTone?: string;
  pendingLength?: string;
  pendingAudience?: string;
};

type AuthSessionPayload = {
  token: string;
  user: unknown;
  workspaces: unknown[];
  defaultWorkspaceId: string;
  pendingPromptId: string | null;
};

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function clientUrl(path: string) {
  return new URL(path, CLIENT_APP_URL).toString();
}

function safeClientRedirect(value: unknown) {
  const fallback = clientUrl("/");
  if (typeof value !== "string") return fallback;

  try {
    const clientOrigin = new URL(CLIENT_APP_URL).origin;
    const url = new URL(value, CLIENT_APP_URL);
    return url.origin === clientOrigin ? url.toString() : fallback;
  } catch {
    return fallback;
  }
}

function decodeState(state: string | null): GithubState {
  if (!state) return {};

  try {
    const normalized = state.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(
      Buffer.from(normalized, "base64").toString("utf8"),
    ) as Record<string, unknown>;

    return {
      next: safeClientRedirect(decoded.next),
      pendingPrompt: optionalString(decoded.pendingPrompt),
      pendingTone: optionalString(decoded.pendingTone),
      pendingLength: optionalString(decoded.pendingLength),
      pendingAudience: optionalString(decoded.pendingAudience),
    };
  } catch {
    return {};
  }
}

function parseAuthSession(raw: unknown): AuthSessionPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const input = raw as Record<string, unknown>;

  if (
    typeof input.token !== "string" ||
    typeof input.defaultWorkspaceId !== "string" ||
    !Array.isArray(input.workspaces)
  ) {
    return null;
  }

  return {
    token: input.token,
    user: input.user,
    workspaces: input.workspaces,
    defaultWorkspaceId: input.defaultWorkspaceId,
    pendingPromptId:
      typeof input.pendingPromptId === "string" ? input.pendingPromptId : null,
  };
}

function redirectAfterAuth(result: AuthSessionPayload, next: string) {
  if (result.pendingPromptId) {
    const url = new URL("/email-template-project", CLIENT_APP_URL);
    url.searchParams.set("pendingPromptId", result.pendingPromptId);
    return url.toString();
  }

  return safeClientRedirect(next);
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = decodeState(req.nextUrl.searchParams.get("state"));
  const next = safeClientRedirect(state.next);

  if (!code) {
    const redirect = new URL(req.nextUrl.origin);
    redirect.searchParams.set("next", next);
    redirect.searchParams.set("auth_error", "github_cancelled");
    return NextResponse.redirect(redirect);
  }

  const upstream = await fetch(`${API_URL}/auth/github`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code,
      redirectUri: `${req.nextUrl.origin}/api/auth/github/callback`,
      pendingPrompt: state.pendingPrompt,
      pendingTone: state.pendingTone,
      pendingLength: state.pendingLength,
      pendingAudience: state.pendingAudience,
    }),
    cache: "no-store",
  });

  const raw = await upstream.json().catch(() => null);
  const result = parseAuthSession(raw);
  if (!upstream.ok || !result) {
    const redirect = new URL(req.nextUrl.origin);
    redirect.searchParams.set("next", next);
    redirect.searchParams.set("auth_error", "github_failed");
    return NextResponse.redirect(redirect);
  }

  const jar = await cookies();
  jar.set(AUTH_COOKIE, result.token, AUTH_COOKIE_OPTIONS);
  jar.set(
    WORKSPACE_COOKIE,
    result.defaultWorkspaceId,
    WORKSPACE_COOKIE_OPTIONS,
  );

  return NextResponse.redirect(redirectAfterAuth(result, next));
}
