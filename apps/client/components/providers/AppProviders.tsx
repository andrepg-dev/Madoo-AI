"use client";

import { SearchCommandProvider } from "../shell/SearchCommandProvider";
import { QueryProvider } from "./QueryProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <SearchCommandProvider>{children}</SearchCommandProvider>
    </QueryProvider>
  );
}
