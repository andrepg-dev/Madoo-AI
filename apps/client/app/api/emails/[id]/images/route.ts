import { AUTH_COOKIE, WORKSPACE_COOKIE } from "@/lib/cookies";
import { API_URL } from "@/lib/env";
import { WORKSPACE_HEADER } from "@madoo/shared";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

// Image uploads go through a route handler (not a Server Action) — same proven
// path as the SSE generate/edit routes. Server Actions were silently failing to
// reach the backend in production, so the multipart upload never landed.
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

  const form = await req.formData();
  // Re-send as FormData so fetch sets a fresh multipart boundary; never set
  // Content-Type by hand here or the boundary won't match the body.
  const upstream = await fetch(`${API_URL}/emails/${id}/images`, {
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
