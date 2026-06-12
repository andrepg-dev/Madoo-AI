import { AUTH_COOKIE, WORKSPACE_COOKIE } from "@/lib/cookies";
import { API_URL } from "@/lib/env";
import { WORKSPACE_HEADER } from "@madoo/shared";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const jar = await cookies();
  const token = jar.get(AUTH_COOKIE)?.value;
  const workspaceId = jar.get(WORKSPACE_COOKIE)?.value;

  if (!token) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const bodyText = await req.text();
  const upstream = await fetch(`${API_URL}/emails/${id}/edit`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(workspaceId ? { [WORKSPACE_HEADER]: workspaceId } : {}),
      Accept: "text/event-stream",
      "Content-Type": "application/json",
    },
    body: bodyText || "{}",
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type":
        upstream.headers.get("Content-Type") ?? "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
