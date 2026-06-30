import { AUTH_COOKIE, WORKSPACE_COOKIE } from "@/lib/cookies";
import { API_URL } from "@/lib/env";
import { WORKSPACE_HEADER } from "@madoo/shared";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

// Creates a pending prompt for a just-signed-in visitor whose landing prompt
// carried image attachments. Anonymous visitors can't upload before login (no
// token), so for the image case we skip issueSession's text-only pending prompt
// and create the full one here, after the session cookie is set, then hand its
// id to the app.
export async function POST(req: NextRequest) {
  const jar = await cookies();
  const token = jar.get(AUTH_COOKIE)?.value;
  const workspaceId = jar.get(WORKSPACE_COOKIE)?.value;

  if (!token) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ message: "Invalid payload." }, { status: 400 });
  }

  const upstream = await fetch(`${API_URL}/prompts/pending`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(workspaceId ? { [WORKSPACE_HEADER]: workspaceId } : {}),
    },
    body: JSON.stringify(body),
    cache: "no-store",
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
