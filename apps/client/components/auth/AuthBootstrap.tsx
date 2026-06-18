"use client";

import { getMeOrNull } from "@/actions/auth";
import { useAuthStore } from "@/stores/auth-store";
import { useClientStore } from "@/stores/client-store";
import { readCookie, WORKSPACE_COOKIE } from "@/lib/cookies";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import posthog from "posthog-js";

export function AuthBootstrap() {
  const setUser = useAuthStore((s) => s.setUser);
  const setWorkspaceId = useClientStore((s) => s.setWorkspaceId);

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
    } else {
      posthog.reset();
    }
  }, [user, isFetched, setUser, setWorkspaceId]);

  return null;
}
