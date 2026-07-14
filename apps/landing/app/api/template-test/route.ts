import { API_URL } from "@/lib/env";
import { NextRequest } from "next/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    templateId?: unknown;
    email?: unknown;
  } | null;
  const templateId =
    typeof body?.templateId === "string" ? body.templateId.trim() : "";
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!templateId) {
    return Response.json({ message: "Missing template." }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return Response.json({ message: "Enter a valid email." }, { status: 400 });
  }

  const upstream = await fetch(
    `${API_URL}/public/community-templates/${encodeURIComponent(templateId)}/test-send`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: email }),
      cache: "no-store",
    },
  );

  const raw = await upstream.json().catch(() => null);
  if (!upstream.ok) {
    return Response.json(
      raw ?? { message: `Could not send the test (${upstream.status}).` },
      { status: upstream.status },
    );
  }
  return Response.json(raw ?? { ok: true });
}
