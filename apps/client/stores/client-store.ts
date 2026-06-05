"use client";

import { create } from "zustand";

type ClientState = {
  sidebarOpen: boolean;
  workspaceId: string | null;
  setSidebarOpen: (open: boolean) => void;
  setWorkspaceId: (workspaceId: string | null) => void;
  toggleSidebar: () => void;
};

export const useClientStore = create<ClientState>((set) => ({
  sidebarOpen: false,
  workspaceId: null,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setWorkspaceId: (workspaceId) => set({ workspaceId }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
