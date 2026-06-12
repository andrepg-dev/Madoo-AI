"use client";

import { useParams, useRouter } from "next/navigation";
import { GeneratingScreen } from "@/components/home/GeneratingScreen";
import { useEmail } from "@/hooks/use-emails";

export default function EmailGeneratePage() {
  const params = useParams();
  const router = useRouter();
  const raw = params.emailId;
  const emailId = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] ?? "" : "";
  const { data: email, isLoading, isError } = useEmail(emailId || null);

  if (!emailId) {
    return null;
  }

  if (isLoading) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--ink-soft)", fontSize: 14 }}>Loading…</p>
      </div>
    );
  }

  if (isError || !email) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--ink-soft)", fontSize: 14 }}>No se encontró el email.</p>
      </div>
    );
  }

  return (
    <GeneratingScreen
      emailId={emailId}
      prompt={email.prompt}
      onDone={() => router.replace(`/emails/${emailId}/editor`)}
    />
  );
}
