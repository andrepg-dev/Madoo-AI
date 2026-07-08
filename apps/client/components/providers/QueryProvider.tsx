"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useClientStore } from "@/stores/client-store";
import { WORKSPACE_SCOPED_QUERY_KEYS } from "@/lib/query-keys";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 1000 * 30,
          },
          mutations: {
            retry: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      <WorkspaceCacheReset client={client} />
      {children}
    </QueryClientProvider>
  );
}

/**
 * Drops every workspace-scoped query cache when the active workspace changes, so
 * a switch reloads that workspace's data instead of showing the previous one's.
 * Centralized here to cover all switch entry points (sidebar, settings, create,
 * delete) with a single source of truth. Mounted queries auto-refetch after
 * removal, using the updated workspace cookie/header.
 */
function WorkspaceCacheReset({ client }: { client: QueryClient }) {
  const workspaceId = useClientStore((s) => s.workspaceId);
  const previous = useRef<string | null>(workspaceId);

  useEffect(() => {
    const prev = previous.current;
    previous.current = workspaceId;
    // Only reset on an actual switch between two workspaces. The initial
    // null -> id assignment at login has nothing cached to clear.
    if (prev === null || prev === workspaceId) return;
    for (const key of WORKSPACE_SCOPED_QUERY_KEYS) {
      client.removeQueries({ queryKey: [key] });
    }
  }, [workspaceId, client]);

  return null;
}
