"use client";

import { getMeOrNull } from "@/actions/auth";
import { useAuthStore } from "@/stores/auth-store";
import { useClientStore } from "@/stores/client-store";
import { readCookie, WORKSPACE_COOKIE } from "@/lib/cookies";
import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import posthog from "posthog-js";

// Routes that render without a session (mirrors the middleware allowlist), so we
// don't bounce a public share/invite visitor to the login flow.
const PUBLIC_PREFIXES = ["/invite", "/share"] as const;

function isPublicPath(pathname: string) {
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function AuthBootstrap() {
  const setUser = useAuthStore((s) => s.setUser);
  const setWorkspaceId = useClientStore((s) => s.setWorkspaceId);
  const pathname = usePathname();

  const { data: user, isFetched } = useQuery({
    queryKey: ["me"],
    queryFn: () => getMeOrNull(),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!isFetched) return;
    setUser(user ?? null);
    if (user) {
      const stored = readCookie(WORKSPACE_COOKIE);
      if (stored) setWorkspaceId(stored);
      posthog.identify(user.id, {
        email: user.email,
        name: user.name ?? undefined,
      });
      return;
    }

    // No session (signed out, expired, or revoked). Drop local state and send
    // the visitor through the login flow — unless they're on a public route.
    setWorkspaceId(null);
    posthog.reset();
    if (!isPublicPath(pathname)) {
      window.location.assign("/");
    }
  }, [user, isFetched, pathname, setUser, setWorkspaceId]);

  return null;
}
