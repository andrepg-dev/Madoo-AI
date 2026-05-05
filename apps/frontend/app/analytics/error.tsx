"use client";

import { ErrorScreen } from "@/components/shell/ErrorScreen";

export default function AnalyticsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorScreen title="Analytics couldn't load" error={error} reset={reset} />;
}
