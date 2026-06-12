import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { API_URL } from "@/lib/env";
import { AUTH_COOKIE, WORKSPACE_COOKIE } from "@/lib/cookies";
import { WORKSPACE_HEADER } from "@madoo/shared";

type Params = { params: Promise<{ path: string[] }> };

async function proxy(req: NextRequest, { params }: Params) {
  const { path } = await params;
  const jar = await cookies();
  const token = jar.get(AUTH_COOKIE)?.value;
  const workspaceId = jar.get(WORKSPACE_COOKIE)?.value;

  if (!token) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const upstreamUrl = new URL(`${API_URL}/${path.join("/")}`);
  req.nextUrl.searchParams.forEach((value, key) => upstreamUrl.searchParams.set(key, value));

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    ...(workspaceId ? { [WORKSPACE_HEADER]: workspaceId } : {}),
  };

  const contentType = req.headers.get("content-type");
  if (contentType) headers["Content-Type"] = contentType;

  const upstream = await fetch(upstreamUrl.toString(), {
    method: req.method,
    headers,
    body: req.method === "GET" || req.method === "DELETE" ? undefined : await req.text(),
    cache: "no-store",
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
    },
  });
}

export async function GET(req: NextRequest, ctx: Params) {
  return proxy(req, ctx);
}

export async function POST(req: NextRequest, ctx: Params) {
  return proxy(req, ctx);
}

export async function PATCH(req: NextRequest, ctx: Params) {
  return proxy(req, ctx);
}

export async function DELETE(req: NextRequest, ctx: Params) {
  return proxy(req, ctx);
}
