"use client";

import { useParams, useRouter } from "next/navigation";
import { EditorScreen } from "@/components/home/EditorScreen";
import { useEmail } from "@/hooks/use-emails";

export default function EmailEditorPage() {
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
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
        }}
      >
        <p style={{ color: "var(--ink-soft)", fontSize: 14 }}>No se pudo cargar el email.</p>
        <button
          type="button"
          style={{
            borderRadius: 10,
            padding: "8px 14px",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            cursor: "pointer",
          }}
          onClick={() => router.push("/")}
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  return (
    <EditorScreen
      emailId={emailId}
      genSummary={{
        prompt: email.prompt,
        tone: email.tone ?? "Friendly",
        length: email.length ?? "Medium",
        audience: email.audience ?? "Existing customers",
      }}
      onBack={() => router.push("/")}
    />
  );
}
