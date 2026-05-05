"use client";

import { ErrorScreen } from "@/components/shell/ErrorScreen";

export default function DomainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorScreen title="Domain settings couldn't load" error={error} reset={reset} />;
}
