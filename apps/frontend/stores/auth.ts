"use client";

import type { StoredPrompt } from "@/lib/storage";
import { create } from "zustand";

type AuthUiState = {
  loginOpen: boolean;
  pendingPromptForGate: StoredPrompt | null;
  openLogin: (pending?: StoredPrompt | null) => void;
  closeLogin: () => void;
};

export const useAuthStore = create<AuthUiState>((set) => ({
  loginOpen: false,
  pendingPromptForGate: null,
  openLogin: (pending = null) =>
    set({
      loginOpen: true,
      pendingPromptForGate: pending,
    }),
  closeLogin: () => set({ loginOpen: false }),
}));
