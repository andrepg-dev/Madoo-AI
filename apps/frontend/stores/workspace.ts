"use client";

import { create } from "zustand";
import { WORKSPACE_COOKIE, readCookie, writeCookie } from "@/lib/cookies";

type WorkspaceState = {
  activeWorkspaceId: string | null;
  hydrateWorkspaceId: () => void;
  setActiveWorkspaceId: (id: string | null) => void;
};

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  activeWorkspaceId: null,
  hydrateWorkspaceId: () =>
    set({
      activeWorkspaceId: readCookie(WORKSPACE_COOKIE),
    }),
  setActiveWorkspaceId: (id) => {
    writeCookie(WORKSPACE_COOKIE, id);
    set({ activeWorkspaceId: id });
  },
}));
