import {
  AUTH_COOKIE,
  AUTH_COOKIE_OPTIONS,
  WORKSPACE_COOKIE,
  WORKSPACE_COOKIE_OPTIONS,
} from "@/lib/cookies";
import { API_URL } from "@/lib/env";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

type Provider = "google" | "register" | "login";

type AuthSessionPayload = {
  token: string;
  user: unknown;
  workspaces: unknown[];
  defaultWorkspaceId: string;
  pendingPromptId: string | null;
};

type PendingFields = {
  pendingPrompt?: string;
  pendingTone?: string;
  pendingLength?: string;
  pendingAudience?: string;
};

type AuthPayload =
  | ({ idToken: string } & PendingFields)
  | ({ email: string; password: string; name?: string } & PendingFields)
  | ({ email: string; password: string } & PendingFields);

const PROVIDERS: Record<Provider, string> = {
  google: "/auth/google",
  register: "/auth/register",
  login: "/auth/login",
};

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function pendingFields(input: Record<string, unknown>): PendingFields {
  return {
    pendingPrompt: optionalString(input.pendingPrompt),
    pendingTone: optionalString(input.pendingTone),
    pendingLength: optionalString(input.pendingLength),
    pendingAudience: optionalString(input.pendingAudience),
  };
}

function parsePayload(provider: Provider, raw: unknown): AuthPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const input = raw as Record<string, unknown>;

  if (provider === "google") {
    const idToken = optionalString(input.idToken);
    return idToken ? { idToken, ...pendingFields(input) } : null;
  }

  const email = optionalString(input.email);
  const password = optionalString(input.password);
  if (!email || !password) return null;

  if (provider === "register") {
    return {
      email,
      password,
      name: optionalString(input.name),
      ...pendingFields(input),
    };
  }

  return { email, password, ...pendingFields(input) };
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

async function setSessionCookies(result: AuthSessionPayload) {
  const jar = await cookies();
  jar.set(AUTH_COOKIE, result.token, AUTH_COOKIE_OPTIONS);
  jar.set(
    WORKSPACE_COOKIE,
    result.defaultWorkspaceId,
    WORKSPACE_COOKIE_OPTIONS,
  );
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ provider: string }> },
) {
  const { provider: providerRaw } = await context.params;
  if (!(providerRaw in PROVIDERS)) {
    return Response.json(
      { message: "Unknown auth provider." },
      { status: 404 },
    );
  }

  const provider = providerRaw as Provider;
  const payload = parsePayload(provider, await req.json().catch(() => null));
  if (!payload) {
    return Response.json({ message: "Invalid auth payload." }, { status: 400 });
  }

  const upstream = await fetch(`${API_URL}${PROVIDERS[provider]}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const raw = await upstream.json().catch(() => null);
  if (!upstream.ok) {
    return Response.json(
      raw ?? { message: `Auth request failed (${upstream.status})` },
      { status: upstream.status },
    );
  }

  const result = parseAuthSession(raw);
  if (!result) {
    return Response.json(
      { message: "Invalid auth response." },
      { status: 502 },
    );
  }

  await setSessionCookies(result);

  return Response.json({
    user: result.user,
    workspaces: result.workspaces,
    defaultWorkspaceId: result.defaultWorkspaceId,
    pendingPromptId: result.pendingPromptId,
  });
}
