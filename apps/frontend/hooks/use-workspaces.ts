"use client";

import { useQuery } from "@tanstack/react-query";
import { getMyWorkspaces } from "@/actions/workspaces";

export function useWorkspaces(enabled = true) {
  return useQuery({
    queryKey: ["workspaces", "me"],
    queryFn: getMyWorkspaces,
    enabled,
    staleTime: 1000 * 60 * 5,
  });
}
