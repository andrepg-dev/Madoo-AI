"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authKeys, useMe, type AuthUser } from "@/actions/auth";
import { clearToken, getToken, setToken, type StoredPrompt } from "@/lib/storage";

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  loginOpen: boolean;
  pendingPromptForGate: StoredPrompt | null;
  openLogin: (pending?: StoredPrompt | null) => void;
  closeLogin: () => void;
  finishLogin: (token: string, user: AuthUser) => void;
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

  const meQuery = useMe({ enabled: hasToken });

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
    (token: string, u: AuthUser) => {
      setToken(token);
      setHasToken(true);
      qc.setQueryData(authKeys.me(), u);
      setLoginOpen(false);
    },
    [qc],
  );

  const logout = useCallback(() => {
    clearToken();
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
