"use client";

import { ErrorScreen } from "@/components/shell/ErrorScreen";

export default function CampaignsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorScreen title="Campaigns couldn't load" error={error} reset={reset} />;
}
