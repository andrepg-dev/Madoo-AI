"use client";

import { ErrorScreen } from "@/components/shell/ErrorScreen";

export default function ContactsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorScreen title="Contacts couldn't load" error={error} reset={reset} />;
}
