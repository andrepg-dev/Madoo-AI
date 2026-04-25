"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons/Icon";
import { GOOGLE_CLIENT_ID } from "@/lib/env";
import { loadGsiScript, type GsiCredentialResponse } from "@/lib/google-gsi";
import { clearPendingPrompt, type StoredPrompt } from "@/lib/storage";
import { useGoogleLogin } from "@/actions/auth";
import { useAuth } from "./AuthContext";

export function LoginModal() {
  const { loginOpen, closeLogin, finishLogin, pendingPromptForGate } = useAuth();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const googleLogin = useGoogleLogin();
  const submitting = googleLogin.isPending;

  useEffect(() => {
    if (!loginOpen) return;
    setError(null);

    if (!GOOGLE_CLIENT_ID) {
      setError("Google sign-in is not configured. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID.");
      return;
    }

    let cancelled = false;

    const handleCredential = async (resp: GsiCredentialResponse) => {
      if (cancelled) return;
      const pending: StoredPrompt | null = pendingPromptForGate;
      try {
        const result = await googleLogin.mutateAsync({
          idToken: resp.credential,
          pendingPrompt: pending?.prompt,
          pendingTone: pending?.tone,
          pendingLength: pending?.length,
          pendingAudience: pending?.audience,
        });
        if (cancelled) return;
        clearPendingPrompt();
        finishLogin(result.token, result.user);
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Login failed";
        setError(msg);
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
      .catch(() => setError("Couldn't load Google sign-in. Check your connection."));

    return () => {
      cancelled = true;
    };
  }, [loginOpen, finishLogin, pendingPromptForGate, googleLogin]);

  if (!loginOpen) return null;

  return (
    <div
      onClick={closeLogin}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(20,15,10,0.4)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 420,
          background: "var(--surface)",
          borderRadius: 16,
          boxShadow: "0 30px 80px -20px rgba(20,15,10,0.4)",
          padding: 28,
          position: "relative",
        }}
      >
        <button
          type="button"
          onClick={closeLogin}
          aria-label="Close"
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            width: 32,
            height: 32,
            borderRadius: 8,
            border: "none",
            background: "var(--surface-2)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--ink-soft)",
          }}
        >
          <Icon name="x" size={14} />
        </button>

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
          style={{ fontSize: 26, fontWeight: 400, margin: "16px 0 6px", letterSpacing: -0.4 }}
        >
          Continue to Madoo AI
        </h2>
        <p style={{ fontSize: 13.5, color: "var(--ink-soft)", marginTop: 0, lineHeight: 1.5 }}>
          {pendingPromptForGate?.prompt
            ? "We'll save your prompt and pick up right where you left off."
            : "Sign in to generate, save, and send beautiful emails."}
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
          <div ref={buttonRef} style={{ opacity: submitting ? 0.5 : 1, pointerEvents: submitting ? "none" : "auto" }} />
        </div>

        {error && (
          <div
            style={{
              marginTop: 14,
              padding: 10,
              background: "#FBE8E2",
              color: "#A23E2F",
              borderRadius: 8,
              fontSize: 12.5,
              lineHeight: 1.5,
            }}
          >
            {error}
          </div>
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
      </div>
    </div>
  );
}
