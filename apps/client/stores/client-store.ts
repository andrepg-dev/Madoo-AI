"use client";

import { create } from "zustand";

type ClientState = {
  searchCommandOpen: boolean;
  sidebarOpen: boolean;
  /** Off-canvas nav drawer open state (mobile only). */
  mobileNavOpen: boolean;
  pricingOpen: boolean;
  workspaceId: string | null;
  /**
   * Files attached in the home prompt box, handed off across the client-side
   * navigation to the project page (URLs can't carry File objects). The project
   * page consumes and clears these to upload + attach to the first generation.
   */
  pendingPromptImages: File[];
  setSearchCommandOpen: (open: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  setMobileNavOpen: (open: boolean) => void;
  setPricingOpen: (open: boolean) => void;
  setWorkspaceId: (workspaceId: string | null) => void;
  setPendingPromptImages: (files: File[]) => void;
  consumePendingPromptImages: () => File[];
  toggleSidebar: () => void;
  toggleMobileNav: () => void;
};

export const useClientStore = create<ClientState>((set, get) => ({
  searchCommandOpen: false,
  sidebarOpen: false,
  mobileNavOpen: false,
  pricingOpen: false,
  workspaceId: null,
  pendingPromptImages: [],
  setSearchCommandOpen: (searchCommandOpen) => set({ searchCommandOpen }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
  setPricingOpen: (pricingOpen) => set({ pricingOpen }),
  setWorkspaceId: (workspaceId) => set({ workspaceId }),
  setPendingPromptImages: (pendingPromptImages) => set({ pendingPromptImages }),
  consumePendingPromptImages: () => {
    const { pendingPromptImages } = get();
    if (pendingPromptImages.length > 0) set({ pendingPromptImages: [] });
    return pendingPromptImages;
  },
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleMobileNav: () =>
    set((state) => ({ mobileNavOpen: !state.mobileNavOpen })),
}));
