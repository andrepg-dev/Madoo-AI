"use client";

import { workspacesApi, workspacesKeys } from "@/actions/workspaces.client";
import { TemplateReasonModal } from "@/components/onboarding/TemplateReasonModal";
import { GOOGLE_CLIENT_ID } from "@/lib/env";
import { loadGsiScript, type GsiCredentialResponse } from "@/lib/google-gsi";
import { clearPendingPrompt, type StoredPrompt } from "@/lib/storage";
import { useAuthStore } from "@/stores/auth";
import { useWorkspaceStore } from "@/stores/workspace";
import type { MyWorkspace, User } from "@madoo/shared";
import { Banner, Modal } from "@madoo/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

type LoginResult = {
  user: User;
  workspaces: MyWorkspace[];
  defaultWorkspaceId: string;
};

export function LoginModal() {
  const qc = useQueryClient();
  const loginOpen = useAuthStore((s) => s.loginOpen);
  const closeLogin = useAuthStore((s) => s.closeLogin);
  const pendingPromptForGate = useAuthStore((s) => s.pendingPromptForGate);
  const buttonRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reasonModalOpen, setReasonModalOpen] = useState(false);

  const pendingRef = useRef<StoredPrompt | null>(pendingPromptForGate);
  pendingRef.current = pendingPromptForGate;

  const reasonMutation = useMutation({
    mutationFn: (templateCreationReason: string) =>
      workspacesApi.updateMe({ templateCreationReason }),
    onSuccess: (workspace) => {
      const current =
        qc.getQueryData<MyWorkspace[]>(["workspaces", "me"]) ?? [];
      qc.setQueryData(
        ["workspaces", "me"],
        current.map((item) => (item.id === workspace.id ? workspace : item)),
      );
      void qc.invalidateQueries({ queryKey: workspacesKeys.all });
      void qc.invalidateQueries({ queryKey: ["workspaces", "me"] });
    },
  });

  const saveReason = async (templateCreationReason: string) => {
    try {
      await reasonMutation.mutateAsync(templateCreationReason);
    } finally {
      setReasonModalOpen(false);
    }
  };

  useEffect(() => {
    if (!loginOpen) return;
    setError(null);
    setSubmitting(false);

    if (!GOOGLE_CLIENT_ID) {
      setError(
        "Google sign-in is not configured. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID.",
      );
      return;
    }

    let cancelled = false;

    const handleCredential = async (resp: GsiCredentialResponse) => {
      if (cancelled) return;
      const pending = pendingRef.current;
      setSubmitting(true);
      try {
        const response = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            idToken: resp.credential,
            pendingPrompt: pending?.prompt,
            pendingTone: pending?.tone,
            pendingLength: pending?.length,
            pendingAudience: pending?.audience,
          }),
        });
        const payload = (await response.json().catch(() => null)) as
          | LoginResult
          | { message?: string | string[] }
          | null;
        if (!response.ok) {
          const raw = payload && "message" in payload ? payload.message : null;
          const msg = Array.isArray(raw)
            ? raw.join(", ")
            : (raw ?? `Login failed (${response.status})`);
          throw new Error(msg);
        }

        const result = payload as LoginResult;
        if (!result?.user || !result.defaultWorkspaceId) {
          throw new Error("Invalid login response.");
        }
        clearPendingPrompt();
        qc.setQueryData(["me"], result.user);
        qc.setQueryData(["workspaces", "me"], result.workspaces);
        useWorkspaceStore
          .getState()
          .setActiveWorkspaceId(result.defaultWorkspaceId);
        useAuthStore.getState().closeLogin();
        const defaultWorkspace =
          result.workspaces.find((w) => w.id === result.defaultWorkspaceId) ??
          result.workspaces[0];
        if (!defaultWorkspace?.templateCreationReason) {
          setReasonModalOpen(true);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Login failed";
        setError(msg);
      } finally {
        setSubmitting(false);
      }
    };

    loadGsiScript()
      .then(() => {
        if (cancelled || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredential,
          ux_mode: "popup",
          auto_select: false,
          cancel_on_tap_outside: false,
        });
        if (buttonRef.current) {
          buttonRef.current.innerHTML = "";
          window.google.accounts.id.renderButton(buttonRef.current, {
            type: "standard",
            theme: "filled_black",
            size: "large",
            shape: "pill",
            text: "continue_with",
            logo_alignment: "center",
            width: 320,
          });
        }
      })
      .catch(() =>
        setError("Couldn't load Google sign-in. Check your connection."),
      );

    return () => {
      cancelled = true;
    };
  }, [loginOpen, qc]);

  return (
    <>
      <Modal open={loginOpen} onClose={closeLogin} size="sm">
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 11,
            background: "var(--accent)",
            color: "var(--accent-fg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-instrument-serif), serif",
            fontStyle: "italic",
            fontSize: 22,
            fontWeight: 600,
          }}
        >
          M
        </div>

        <h2
          className="serif"
          style={{
            fontSize: 26,
            fontWeight: 400,
            margin: "16px 0 6px",
            letterSpacing: -0.4,
          }}
        >
          Continue to Madoo AI
        </h2>
        <p
          style={{
            fontSize: 13.5,
            color: "var(--ink-soft)",
            marginTop: 0,
            lineHeight: 1.5,
          }}
        >
          {pendingPromptForGate?.prompt
            ? "We'll save your prompt and pick up right where you left off."
            : "Sign in to generate, save, and export beautiful emails."}
        </p>

        {pendingPromptForGate?.prompt && (
          <div
            style={{
              marginTop: 16,
              padding: 12,
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              fontSize: 12.5,
              color: "var(--ink-soft)",
              lineHeight: 1.5,
              fontStyle: "italic",
            }}
          >
            &quot;{pendingPromptForGate.prompt.slice(0, 180)}
            {pendingPromptForGate.prompt.length > 180 ? "…" : ""}&quot;
          </div>
        )}

        <div
          style={{
            marginTop: 22,
            display: "flex",
            justifyContent: "center",
            minHeight: 44,
          }}
        >
          <div
            ref={buttonRef}
            style={{
              opacity: submitting ? 0.5 : 1,
              pointerEvents: submitting ? "none" : "auto",
            }}
          />
        </div>

        {error && (
          <Banner tone="danger" style={{ marginTop: 14 }}>
            {error}
          </Banner>
        )}

        <div
          style={{
            marginTop: 18,
            fontSize: 11,
            color: "var(--ink-faint)",
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          By continuing you agree to our Terms and Privacy.
        </div>
      </Modal>

      <TemplateReasonModal
        open={reasonModalOpen}
        pending={reasonMutation.isPending}
        onClose={() => void saveReason("not_sure_yet")}
        onSelect={(value) => void saveReason(value)}
        onSkip={() => void saveReason("not_sure_yet")}
      />
    </>
  );
}
