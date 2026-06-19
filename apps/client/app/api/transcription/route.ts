import { AUTH_COOKIE } from "@/lib/cookies";
import { API_URL } from "@/lib/env";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const jar = await cookies();
  const token = jar.get(AUTH_COOKIE)?.value;

  if (!token) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.formData();
  const upstream = await fetch(`${API_URL}/transcription`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body,
  });

  const payload = await upstream.json().catch(() => null);
  return Response.json(payload, { status: upstream.status });
}
