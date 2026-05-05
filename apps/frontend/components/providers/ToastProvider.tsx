"use client";

import type { ReactNode } from "react";
import { Toaster } from "@madoo/ui";

export function ToastProvider({ children }: { children: ReactNode }) {
  return <Toaster>{children}</Toaster>;
}
