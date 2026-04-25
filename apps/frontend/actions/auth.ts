"use client";

import { useMutation, useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { fetcher } from "@/lib/fetch";
import { getToken } from "@/lib/storage";

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  createdAt: string;
};

export type GoogleLoginInput = {
  idToken: string;
  pendingPrompt?: string;
  pendingTone?: string;
  pendingLength?: string;
  pendingAudience?: string;
};

export type GoogleLoginResponse = {
  token: string;
  user: AuthUser;
  pendingPromptId: string | null;
};

export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
};

export const authApi = {
  loginWithGoogle: (body: GoogleLoginInput) =>
    fetcher.post<GoogleLoginResponse, GoogleLoginInput>("/auth/google", body),
  me: () => fetcher.get<AuthUser>("/auth/me"),
};

export function useGoogleLogin() {
  return useMutation({
    mutationFn: (body: GoogleLoginInput) => authApi.loginWithGoogle(body),
  });
}

export function useMe(
  options?: Omit<UseQueryOptions<AuthUser>, "queryKey" | "queryFn">,
) {
  return useQuery<AuthUser>({
    queryKey: authKeys.me(),
    queryFn: () => authApi.me(),
    enabled: typeof window !== "undefined" && Boolean(getToken()),
    retry: false,
    staleTime: 1000 * 60 * 5,
    ...options,
  });
}
