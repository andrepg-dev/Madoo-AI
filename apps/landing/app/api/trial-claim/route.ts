import { API_URL } from "@/lib/env";
import { NextRequest } from "next/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    email?: unknown;
  } | null;
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!EMAIL_RE.test(email)) {
    return Response.json({ message: "Enter a valid email." }, { status: 400 });
  }

  const upstream = await fetch(`${API_URL}/trial-claims`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
    cache: "no-store",
  });

  const raw = await upstream.json().catch(() => null);
  if (!upstream.ok) {
    return Response.json(
      raw ?? { message: `Could not claim trial (${upstream.status}).` },
      { status: upstream.status },
    );
  }
  return Response.json(raw ?? { claimed: true });
}
