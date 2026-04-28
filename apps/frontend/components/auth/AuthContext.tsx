"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { MyWorkspace } from "@madoo/shared";
import { authApi, authKeys, type AuthUser } from "@/actions/auth";
import { workspaceKeys } from "@/actions/workspaces";
import {
  clearToken,
  clearWorkspaceId,
  getToken,
  setToken,
  setWorkspaceId,
  type StoredPrompt,
} from "@/lib/storage";

type FinishLoginPayload = {
  token: string;
  user: AuthUser;
  workspaces: MyWorkspace[];
  defaultWorkspaceId: string;
};

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  loginOpen: boolean;
  pendingPromptForGate: StoredPrompt | null;
  openLogin: (pending?: StoredPrompt | null) => void;
  closeLogin: () => void;
  finishLogin: (payload: FinishLoginPayload) => void;
  logout: () => void;
};

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const [hasToken, setHasToken] = useState<boolean>(() =>
    typeof window === "undefined" ? false : Boolean(getToken()),
  );
  const [loginOpen, setLoginOpen] = useState(false);
  const [pendingPromptForGate, setPendingPromptForGate] = useState<StoredPrompt | null>(null);

  const meQuery = useQuery<AuthUser>({
    queryKey: authKeys.me(),
    queryFn: () => authApi.me(),
    enabled: hasToken,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (meQuery.isError) clearToken();
  }, [meQuery.isError]);

  const openLogin = useCallback((pending?: StoredPrompt | null) => {
    setPendingPromptForGate(pending ?? null);
    setLoginOpen(true);
  }, []);

  const closeLogin = useCallback(() => {
    setLoginOpen(false);
  }, []);

  const finishLogin = useCallback(
    ({ token, user: u, workspaces, defaultWorkspaceId }: FinishLoginPayload) => {
      setToken(token);
      setWorkspaceId(defaultWorkspaceId);
      setHasToken(true);
      qc.setQueryData(authKeys.me(), u);
      qc.setQueryData(workspaceKeys.me(), workspaces);
      setLoginOpen(false);
    },
    [qc],
  );

  const logout = useCallback(() => {
    clearToken();
    clearWorkspaceId();
    setHasToken(false);
    qc.removeQueries({ queryKey: authKeys.me() });
    qc.clear();
  }, [qc]);

  const user = meQuery.data ?? null;
  const loading = hasToken && meQuery.isLoading;

  const value = useMemo(
    () => ({
      user,
      loading,
      loginOpen,
      pendingPromptForGate,
      openLogin,
      closeLogin,
      finishLogin,
      logout,
    }),
    [user, loading, loginOpen, pendingPromptForGate, openLogin, closeLogin, finishLogin, logout],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
