"use client";

import { create } from "zustand";

type ClientState = {
  searchCommandOpen: boolean;
  sidebarOpen: boolean;
  workspaceId: string | null;
  setSearchCommandOpen: (open: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  setWorkspaceId: (workspaceId: string | null) => void;
  toggleSidebar: () => void;
};

export const useClientStore = create<ClientState>((set) => ({
  searchCommandOpen: false,
  sidebarOpen: false,
  workspaceId: null,
  setSearchCommandOpen: (searchCommandOpen) => set({ searchCommandOpen }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setWorkspaceId: (workspaceId) => set({ workspaceId }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
