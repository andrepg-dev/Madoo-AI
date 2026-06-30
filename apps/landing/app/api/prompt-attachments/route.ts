import { AUTH_COOKIE, WORKSPACE_COOKIE } from "@/lib/cookies";
import { API_URL } from "@/lib/env";
import { WORKSPACE_HEADER } from "@madoo/shared";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

// Landing prompt-box image uploads go through a route handler (not a Server
// Action) — the same proven path the app uses for email image uploads. The
// returned public URL is then carried into the app across the subdomain handoff,
// since a File object can't survive a cross-origin navigation.
export async function POST(req: NextRequest) {
  const jar = await cookies();
  const token = jar.get(AUTH_COOKIE)?.value;
  const workspaceId = jar.get(WORKSPACE_COOKIE)?.value;

  if (!token) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  // Re-send as FormData so fetch sets a fresh multipart boundary; never set
  // Content-Type by hand here or the boundary won't match the body.
  const upstream = await fetch(`${API_URL}/prompts/pending/attachments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(workspaceId ? { [WORKSPACE_HEADER]: workspaceId } : {}),
    },
    body: form,
  });

  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: {
      "Content-Type":
        upstream.headers.get("Content-Type") ?? "application/json",
    },
  });
}
