"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { MyWorkspace } from "@madoo/shared";
import { workspaceKeys, workspacesApi } from "@/actions/workspaces";
import { useAuth } from "@/components/auth/AuthContext";
import {
  clearWorkspaceId,
  getToken,
  getWorkspaceId,
  setWorkspaceId as persistWorkspaceId,
} from "@/lib/storage";

type WorkspaceState = {
  workspaces: MyWorkspace[];
  activeWorkspace: MyWorkspace | null;
  loading: boolean;
  setActiveWorkspaceId: (id: string) => void;
};

const WorkspaceCtx = createContext<WorkspaceState | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const wsQuery = useQuery<MyWorkspace[]>({
    queryKey: workspaceKeys.me(),
    queryFn: () => workspacesApi.listMine(),
    enabled: typeof window !== "undefined" && Boolean(getToken()),
    staleTime: 1000 * 60 * 5,
  });

  const [activeId, setActiveIdState] = useState<string | null>(() =>
    typeof window === "undefined" ? null : getWorkspaceId(),
  );

  useEffect(() => {
    if (!wsQuery.data || wsQuery.data.length === 0) return;
    const isValid = activeId && wsQuery.data.some((w) => w.id === activeId);
    if (!isValid) {
      const next = wsQuery.data[0]!.id;
      setActiveIdState(next);
      persistWorkspaceId(next);
    }
  }, [wsQuery.data, activeId]);

  useEffect(() => {
    if (!user) {
      setActiveIdState(null);
      clearWorkspaceId();
    }
  }, [user]);

  const setActiveWorkspaceId = useCallback((id: string) => {
    setActiveIdState(id);
    persistWorkspaceId(id);
  }, []);

  const value = useMemo<WorkspaceState>(() => {
    const workspaces = wsQuery.data ?? [];
    const activeWorkspace = workspaces.find((w) => w.id === activeId) ?? null;
    return {
      workspaces,
      activeWorkspace,
      loading: wsQuery.isLoading,
      setActiveWorkspaceId,
    };
  }, [wsQuery.data, wsQuery.isLoading, activeId, setActiveWorkspaceId]);

  return <WorkspaceCtx.Provider value={value}>{children}</WorkspaceCtx.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceCtx);
  if (!ctx) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return ctx;
}
