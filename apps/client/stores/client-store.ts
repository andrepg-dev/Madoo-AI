"use client";

import { create } from "zustand";

type ClientState = {
  searchCommandOpen: boolean;
  sidebarOpen: boolean;
  pricingOpen: boolean;
  workspaceId: string | null;
  setSearchCommandOpen: (open: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  setPricingOpen: (open: boolean) => void;
  setWorkspaceId: (workspaceId: string | null) => void;
  toggleSidebar: () => void;
};

export const useClientStore = create<ClientState>((set) => ({
  searchCommandOpen: false,
  sidebarOpen: false,
  pricingOpen: false,
  workspaceId: null,
  setSearchCommandOpen: (searchCommandOpen) => set({ searchCommandOpen }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setPricingOpen: (pricingOpen) => set({ pricingOpen }),
  setWorkspaceId: (workspaceId) => set({ workspaceId }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
