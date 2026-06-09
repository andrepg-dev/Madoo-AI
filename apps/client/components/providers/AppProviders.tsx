"use client";

import { Toaster } from "@madoo/design-system";
import { SearchCommandProvider } from "../shell/SearchCommandProvider";
import { QueryProvider } from "./QueryProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <Toaster>
        <SearchCommandProvider>{children}</SearchCommandProvider>
      </Toaster>
    </QueryProvider>
  );
}
