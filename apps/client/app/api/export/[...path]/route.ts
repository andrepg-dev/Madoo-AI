import { AUTH_COOKIE, WORKSPACE_COOKIE } from "@/lib/cookies";
import { API_URL } from "@/lib/env";
import { WORKSPACE_HEADER } from "@madoo/shared";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

/**
 * Authenticated download proxy. Client anchors point at
 * `/api/export/emails/<id>/export/<kind>?...` and this streams the upstream
 * backend response (with its Content-Disposition) using the httpOnly cookie.
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const jar = await cookies();
  const token = jar.get(AUTH_COOKIE)?.value;
  const workspaceId = jar.get(WORKSPACE_COOKIE)?.value;

  if (!token) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const search = req.nextUrl.search;
  const upstream = await fetch(
    `${API_URL}/${path.join("/")}${search}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        ...(workspaceId ? { [WORKSPACE_HEADER]: workspaceId } : {}),
      },
      cache: "no-store",
    },
  );

  const headers = new Headers();
  const contentType = upstream.headers.get("Content-Type");
  const disposition = upstream.headers.get("Content-Disposition");
  if (contentType) headers.set("Content-Type", contentType);
  if (disposition) headers.set("Content-Disposition", disposition);
  headers.set("Cache-Control", "no-store");

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
}
