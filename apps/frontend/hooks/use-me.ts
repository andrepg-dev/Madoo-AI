"use client";

import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/actions/auth";

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });
}
