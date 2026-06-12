"use client";

import { Toaster } from "@madoo/design-system";
import { Suspense } from "react";
import { AuthBootstrap } from "../auth/AuthBootstrap";
import { SearchCommandProvider } from "../shell/SearchCommandProvider";
import { QueryProvider } from "./QueryProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <Toaster>
        <SearchCommandProvider>
          <Suspense fallback={null}>
            <AuthBootstrap />
          </Suspense>
          {children}
        </SearchCommandProvider>
      </Toaster>
    </QueryProvider>
  );
}
