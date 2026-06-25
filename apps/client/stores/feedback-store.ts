"use client";

import { create } from "zustand";

type FeedbackState = {
  /** Whether the feedback modal is open. */
  open: boolean;
  setOpen: (open: boolean) => void;
};

export const useFeedbackStore = create<FeedbackState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
