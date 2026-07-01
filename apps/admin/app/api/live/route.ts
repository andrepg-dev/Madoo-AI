import { NextResponse } from "next/server";
import { fetchLive } from "@/actions/live";

// Polled every few seconds by the live-users widget — never cache.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await fetchLive();
    return NextResponse.json(data);
  } catch {
    // Not-authed / backend down → report nobody online rather than error.
    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      online: 0,
      active15m: 0,
      active60m: 0,
      recent: [],
    });
  }
}
