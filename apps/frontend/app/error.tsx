"use client";

import { ErrorScreen } from "@/components/shell/ErrorScreen";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorScreen error={error} reset={reset} />;
}
