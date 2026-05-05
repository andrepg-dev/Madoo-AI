"use client";

import { ErrorScreen } from "@/components/shell/ErrorScreen";

export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorScreen title="Settings couldn't load" error={error} reset={reset} />;
}
