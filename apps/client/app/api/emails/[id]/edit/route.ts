import { AUTH_COOKIE, WORKSPACE_COOKIE } from "@/lib/cookies";
import { API_URL } from "@/lib/env";
import { getPostHogClient } from "@/lib/posthog-server";
import { WORKSPACE_HEADER } from "@madoo/shared";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

function getDistinctIdFromToken(token: string): string | null {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1] ?? "", "base64url").toString("utf8"),
    ) as Record<string, unknown>;
    return (payload.sub as string) ?? (payload.id as string) ?? null;
  } catch {
    return null;
  }
}

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

  const distinctId = getDistinctIdFromToken(token);
  if (distinctId) {
    const phClient = getPostHogClient();
    phClient.capture({
      distinctId,
      event: "server_email_edited",
      properties: {
        email_id: id,
        workspace_id: workspaceId ?? undefined,
      },
    });
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
