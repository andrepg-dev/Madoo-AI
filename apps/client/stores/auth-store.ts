"use client";

import type { User } from "@madoo/shared";
import { create } from "zustand";

type AuthState = {
  user: User | null;
  userLoaded: boolean;
  setUser: (user: User | null) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  userLoaded: false,
  setUser: (user) => set({ user, userLoaded: true }),
}));
