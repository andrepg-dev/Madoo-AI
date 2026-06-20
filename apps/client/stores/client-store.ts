"use client";

import { create } from "zustand";

type ClientState = {
  searchCommandOpen: boolean;
  sidebarOpen: boolean;
  /** Off-canvas nav drawer open state (mobile only). */
  mobileNavOpen: boolean;
  pricingOpen: boolean;
  workspaceId: string | null;
  setSearchCommandOpen: (open: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  setMobileNavOpen: (open: boolean) => void;
  setPricingOpen: (open: boolean) => void;
  setWorkspaceId: (workspaceId: string | null) => void;
  toggleSidebar: () => void;
  toggleMobileNav: () => void;
};

export const useClientStore = create<ClientState>((set) => ({
  searchCommandOpen: false,
  sidebarOpen: false,
  mobileNavOpen: false,
  pricingOpen: false,
  workspaceId: null,
  setSearchCommandOpen: (searchCommandOpen) => set({ searchCommandOpen }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
  setPricingOpen: (pricingOpen) => set({ pricingOpen }),
  setWorkspaceId: (workspaceId) => set({ workspaceId }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleMobileNav: () =>
    set((state) => ({ mobileNavOpen: !state.mobileNavOpen })),
}));
