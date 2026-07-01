"use client";

import { useEffect, useRef, useState } from "react";
import { loginWithGoogleAction } from "@/actions/auth";
import { GOOGLE_CLIENT_ID } from "@/lib/env";
import { loadGsiScript, type GsiCredentialResponse } from "@/lib/google-gsi";

export function LoginForm() {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      setError("Google sign-in is not configured.");
      return;
    }

    let cancelled = false;

    loadGsiScript()
      .then(() => {
        if (cancelled || !window.google?.accounts?.id || !buttonRef.current) {
          return;
        }

        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response: GsiCredentialResponse) => {
            if (!response.credential) {
              setError("Google sign-in failed. Try again.");
              return;
            }
            setPending(true);
            setError(null);
            void loginWithGoogleAction(response.credential).then((result) => {
              // A successful sign-in redirects server-side; only an error path
              // returns here.
              if (result?.error) {
                setPending(false);
                setError(result.error);
              }
            });
          },
          auto_select: false,
          cancel_on_tap_outside: false,
          ux_mode: "popup",
        });

        buttonRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(buttonRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "rectangular",
          text: "continue_with",
          logo_alignment: "center",
          width: 300,
        });
      })
      .catch(() => {
        if (!cancelled) setError("Could not load Google sign-in.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="google-signin">
      {error ? <p className="error">{error}</p> : null}
      <div
        ref={buttonRef}
        className={pending ? "google-button is-pending" : "google-button"}
      />
      {pending ? <p className="signing-in">Signing in…</p> : null}
    </div>
  );
}
