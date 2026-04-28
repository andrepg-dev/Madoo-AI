"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logoutAction } from "@/actions/auth";
import { useAuthStore } from "@/stores/auth";
import { useWorkspaceStore } from "@/stores/workspace";

export function useLogout() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: logoutAction,
    onSuccess: () => {
      useAuthStore.setState({
        loginOpen: false,
        pendingPromptForGate: null,
      });
      useWorkspaceStore.getState().setActiveWorkspaceId(null);
      qc.clear();
    },
  });
}
