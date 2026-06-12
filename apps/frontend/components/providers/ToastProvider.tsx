"use client";

import type { ReactNode } from "react";
import { Toaster } from "@madoo/design-system";

export function ToastProvider({ children }: { children: ReactNode }) {
  return <Toaster>{children}</Toaster>;
}
