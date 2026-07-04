import type { ReactNode } from "react";

import { CLIENT_APP_URL } from "@/lib/env";

// Highlights the most important phrase in a feature block, with an underline in
// a per-keyword accent color so the key idea pops without reading every word.
function Hi({ children, color }: { children: ReactNode; color: string }) {
  return (
    <span
      className="font-semibold text-[#171717] underline decoration-2 underline-offset-4"
      style={{ textDecorationColor: color }}
    >
      {children}
    </span>
  );
}

function getNextSearchParams(nextUrl: string) {
  try {
    return new URL(nextUrl, CLIENT_APP_URL).searchParams;
  } catch {
    return null;
  }
}

export { Hi, getNextSearchParams };
