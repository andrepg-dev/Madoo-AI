"use client";

import { CLIENT_APP_URL, GITHUB_CLIENT_ID, GOOGLE_CLIENT_ID } from "@/lib/env";
import { loadGsiScript, type GsiCredentialResponse } from "@/lib/google-gsi";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type AuthDialogProps = {
  open: boolean;
  onClose: () => void;
  locale?: "en" | "es";
  prompt?: string;
  tone?: string;
  length?: string;
  audience?: string;
  nextUrl?: string | null;
};

type AuthResult = {
  pendingPromptId?: string | null;
};

type EmailAuthMode = "login" | "register";
type EmailStep = "email" | "password";

type PendingPayload = {
  pendingPrompt?: string;
  pendingTone?: string;
  pendingLength?: string;
  pendingAudience?: string;
};

const authProviders = [
  {
    name: "Google",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <path
          fill="currentColor"
          d="M21.6 12.23c0-.74-.07-1.45-.19-2.12H12v4.01h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.9-1.75 2.98-4.32 2.98-7.41Z"
        />
        <path
          fill="currentColor"
          d="M12 22c2.7 0 4.97-.9 6.62-2.36l-3.24-2.5c-.9.6-2.04.95-3.38.95-2.6 0-4.81-1.76-5.6-4.12H3.06v2.58A9.98 9.98 0 0 0 12 22Z"
        />
        <path
          fill="currentColor"
          d="M6.4 13.97A6.03 6.03 0 0 1 6.08 12c0-.68.12-1.34.32-1.97V7.45H3.06A9.98 9.98 0 0 0 2 12c0 1.61.38 3.14 1.06 4.55l3.34-2.58Z"
        />
        <path
          fill="currentColor"
          d="M12 5.91c1.47 0 2.8.51 3.84 1.5l2.88-2.88C16.96 2.9 14.7 2 12 2A9.98 9.98 0 0 0 3.06 7.45l3.34 2.58C7.19 7.67 9.4 5.91 12 5.91Z"
        />
      </svg>
    ),
  },
  {
    name: "GitHub",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <path
          fill="currentColor"
          fillRule="evenodd"
          d="M12 2.25c-5.38 0-9.75 4.37-9.75 9.75 0 4.3 2.79 7.95 6.66 9.24.49.09.67-.21.67-.47v-1.83c-2.71.59-3.28-1.16-3.28-1.16-.44-1.12-1.08-1.42-1.08-1.42-.89-.61.07-.6.07-.6.98.07 1.5 1.01 1.5 1.01.87 1.49 2.28 1.06 2.84.81.09-.63.34-1.06.62-1.31-2.16-.25-4.43-1.08-4.43-4.82 0-1.06.38-1.94 1.01-2.62-.1-.25-.44-1.24.1-2.58 0 0 .83-.26 2.68 1 .78-.22 1.61-.33 2.44-.33s1.66.11 2.44.33c1.85-1.26 2.68-1 2.68-1 .54 1.34.2 2.33.1 2.58.63.68 1.01 1.56 1.01 2.62 0 3.75-2.28 4.57-4.45 4.82.35.3.66.9.66 1.82v2.7c0 .26.17.56.67.47A9.76 9.76 0 0 0 21.75 12c0-5.38-4.37-9.75-9.75-9.75Z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
];

const authCopy = {
  en: {
    closeLogin: "Close login dialog",
    close: "Close",
    eyebrow: "Start building.",
    title: "Log in to your account",
    continueWith: "Continue with",
    or: "OR",
    name: "Name",
    email: "Email",
    password: "Password",
    continue: "Continue",
    createAccount: "Create account",
    signInInstead: "Sign in instead",
    useDifferentEmail: "Use a different email",
    termsPrefix: "By continuing, you agree to the",
    terms: "Terms of Service",
    and: "and",
    privacy: "Privacy Policy",
    authFailed: "Login failed. Try again.",
    emailInvalid: "Enter a valid email.",
    passwordRequired: "Enter your password.",
    passwordLength: "Password must be at least 8 characters.",
  },
  es: {
    closeLogin: "Cerrar diálogo de inicio de sesión",
    close: "Cerrar",
    eyebrow: "Empieza a crear.",
    title: "Inicia sesión en tu cuenta",
    continueWith: "Continuar con",
    or: "O",
    name: "Nombre",
    email: "Email",
    password: "Contraseña",
    continue: "Continuar",
    createAccount: "Crear cuenta",
    signInInstead: "Iniciar sesión",
    useDifferentEmail: "Usar otro email",
    termsPrefix: "Al continuar, aceptas los",
    terms: "Términos de Servicio",
    and: "y la",
    privacy: "Política de Privacidad",
    authFailed: "No se pudo iniciar sesión. Intenta de nuevo.",
    emailInvalid: "Ingresa un email válido.",
    passwordRequired: "Ingresa tu contraseña.",
    passwordLength: "La contraseña debe tener al menos 8 caracteres.",
  },
} as const;

function clientUrl(path: string) {
  return new URL(path, CLIENT_APP_URL).toString();
}

function safeClientRedirect(nextUrl: string | null | undefined) {
  const fallback = clientUrl("/");
  if (!nextUrl) return fallback;

  try {
    const clientOrigin = new URL(CLIENT_APP_URL).origin;
    const url = new URL(nextUrl, CLIENT_APP_URL);
    return url.origin === clientOrigin ? url.toString() : fallback;
  } catch {
    return fallback;
  }
}

function redirectAfterAuth(result: AuthResult, nextUrl?: string | null) {
  if (result.pendingPromptId) {
    const url = new URL("/email-template-project", CLIENT_APP_URL);
    url.searchParams.set("pendingPromptId", result.pendingPromptId);
    window.location.assign(url.toString());
    return;
  }

  window.location.assign(safeClientRedirect(nextUrl));
}

function base64UrlEncode(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return window
    .btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export default function AuthDialog({
  open,
  onClose,
  locale = "en",
  prompt,
  tone,
  length,
  audience,
  nextUrl,
}: AuthDialogProps) {
  const copy = authCopy[locale];
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [emailStep, setEmailStep] = useState<EmailStep>("email");
  const [emailMode, setEmailMode] = useState<EmailAuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pendingPayload: PendingPayload = useMemo(
    () => ({
      pendingPrompt: prompt?.trim() || undefined,
      pendingTone: tone || undefined,
      pendingLength: length || undefined,
      pendingAudience: audience || undefined,
    }),
    [audience, length, prompt, tone],
  );

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  const authenticate = useCallback(
    async function authenticate(
      provider: string,
      payload: Record<string, unknown>,
    ) {
      setIsSubmitting(true);
      setError(null);

      try {
        const response = await fetch(`/api/auth/${provider}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, ...pendingPayload }),
        });

        const raw = (await response.json().catch(() => null)) as
          | AuthResult
          | { message?: string }
          | null;

        if (!response.ok) {
          throw new Error(
            raw && "message" in raw && raw.message
              ? raw.message
              : copy.authFailed,
          );
        }

        redirectAfterAuth((raw ?? {}) as AuthResult, nextUrl);
      } catch (err) {
        setIsSubmitting(false);
        setError(err instanceof Error ? err.message : copy.authFailed);
      }
    },
    [copy.authFailed, nextUrl, pendingPayload],
  );

  useEffect(() => {
    if (!open) return;

    if (!GOOGLE_CLIENT_ID) {
      setError(copy.authFailed);
      return;
    }

    let cancelled = false;

    loadGsiScript()
      .then(() => {
        if (
          cancelled ||
          !window.google?.accounts?.id ||
          !googleButtonRef.current
        ) {
          return;
        }

        const buttonWidth = Math.floor(
          googleButtonRef.current.getBoundingClientRect().width,
        );

        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response: GsiCredentialResponse) => {
            if (!response.credential) {
              setIsSubmitting(false);
              setError(copy.authFailed);
              return;
            }

            void authenticate("google", { idToken: response.credential });
          },
          auto_select: false,
          cancel_on_tap_outside: false,
          ux_mode: "popup",
        });

        googleButtonRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(googleButtonRef.current, {
          type: "standard",
          theme: "outline",
          size: "medium",
          shape: "rectangular",
          text: "continue_with",
          logo_alignment: "center",
          width: Math.max(200, buttonWidth),
          locale,
        });
      })
      .catch(() => {
        if (!cancelled) setError(copy.authFailed);
      });

    return () => {
      cancelled = true;
    };
  }, [authenticate, copy.authFailed, locale, open]);

  function handleGithubLogin() {
    if (!GITHUB_CLIENT_ID) {
      setError(copy.authFailed);
      return;
    }

    const state = base64UrlEncode(
      JSON.stringify({
        next: safeClientRedirect(nextUrl),
        ...pendingPayload,
      }),
    );
    const url = new URL("https://github.com/login/oauth/authorize");
    url.searchParams.set("client_id", GITHUB_CLIENT_ID);
    url.searchParams.set(
      "redirect_uri",
      `${window.location.origin}/api/auth/github/callback`,
    );
    url.searchParams.set("scope", "read:user user:email");
    url.searchParams.set("state", state);
    window.location.assign(url.toString());
  }

  function handleProvider(provider: string) {
    if (provider === "GitHub") {
      handleGithubLogin();
    }
  }

  async function handleEmailContinue() {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const trimmedName = name.trim();

    if (emailStep === "email") {
      if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
        setError(copy.emailInvalid);
        return;
      }

      setError(null);
      setEmailStep("password");
      return;
    }

    if (!trimmedPassword) {
      setError(copy.passwordRequired);
      return;
    }

    if (emailMode === "register" && trimmedPassword.length < 8) {
      setError(copy.passwordLength);
      return;
    }

    await authenticate(emailMode, {
      email: trimmedEmail,
      password: trimmedPassword,
      name: emailMode === "register" && trimmedName ? trimmedName : undefined,
    });
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-madoo-blue-900/45 px-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-dialog-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label={copy.closeLogin}
        onClick={onClose}
        tabIndex={-1}
      />

      <div className="font-ibm-plex-sans relative w-full max-w-97.5 rounded-[28px] bg-madoo-paper px-7 py-7 text-madoo-ink shadow-[0_28px_90px_rgb(7_17_35/0.28),0_0_0_1px_rgb(var(--madoo-rule-rgb)/0.12),inset_0_1px_0_rgb(255_255_255/0.92)]">
        <button
          type="button"
          className="absolute right-5 top-5 inline-flex h-7 w-7 items-center justify-center rounded-full text-zinc-500 transition hover:bg-black/5 hover:text-zinc-900"
          aria-label={copy.close}
          onClick={onClose}
        >
          <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
            <path
              d="m4.25 4.25 7.5 7.5m0-7.5-7.5 7.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className="mb-7">
          <img
            src="/madoo-transparent.png"
            alt="Madoo AI"
            className="mb-5 h-10 w-10 object-contain"
          />
          <p className="text-2xl leading-none text-zinc-400">{copy.eyebrow}</p>
          <h2 id="auth-dialog-title" className="mt-1 text-2xl leading-tight">
            {copy.title}
          </h2>
        </div>

        <div className="grid gap-3">
          {authProviders.map((provider) =>
            provider.name === "Google" ? (
              // The Google Identity button can't be styled to match our palette
              // or radius, so we render our own button and overlay the real GSI
              // button (transparent) on top to capture the click. Keeps the
              // sign-in behavior while making both providers visually identical.
              <div
                key={provider.name}
                className={`group relative ${isSubmitting ? "pointer-events-none opacity-70" : ""}`}
              >
                <div
                  aria-hidden="true"
                  className="flex h-8 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-madoo-paper text-sm text-madoo-ink shadow-[0_1px_2px_rgb(var(--madoo-ink-shadow-rgb)/0.035),0_0_0_0.5px_rgb(var(--madoo-ink-shadow-rgb)/0.22)] transition group-hover:bg-madoo-neutral-50 group-hover:shadow-[0_2px_6px_rgb(var(--madoo-ink-shadow-rgb)/0.055),0_0_0_0.5px_rgb(var(--madoo-ink-shadow-rgb)/0.28)]"
                >
                  <span className="text-madoo-ink">{provider.icon}</span>
                  {copy.continueWith} {provider.name}
                </div>
                <div
                  ref={googleButtonRef}
                  className="absolute inset-0 z-10 overflow-hidden opacity-0 [color-scheme:light] [&>div]:!h-full [&>div]:!w-full"
                />
              </div>
            ) : (
              <button
                key={provider.name}
                type="button"
                disabled={isSubmitting}
                onClick={() => handleProvider(provider.name)}
                className="flex h-8 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-madoo-paper text-sm text-madoo-ink shadow-[0_1px_2px_rgb(var(--madoo-ink-shadow-rgb)/0.035),0_0_0_0.5px_rgb(var(--madoo-ink-shadow-rgb)/0.22)] transition hover:bg-madoo-neutral-50 hover:shadow-[0_2px_6px_rgb(var(--madoo-ink-shadow-rgb)/0.055),0_0_0_0.5px_rgb(var(--madoo-ink-shadow-rgb)/0.28)] disabled:cursor-wait disabled:opacity-70"
              >
                <span className="text-madoo-ink">{provider.icon}</span>
                {copy.continueWith} {provider.name}
              </button>
            ),
          )}
        </div>

        <div className="my-5 flex items-center gap-3 text-xs text-zinc-900">
          <span className="h-px flex-1 bg-zinc-300" />
          <span>{copy.or}</span>
          <span className="h-px flex-1 bg-zinc-300" />
        </div>

        <div className="grid gap-2.5">
          {emailStep === "password" && emailMode === "register" ? (
            <input
              type="text"
              autoComplete="name"
              placeholder={copy.name}
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setError(null);
              }}
              className="h-8 rounded-lg bg-madoo-paper px-3.5 text-sm text-madoo-ink outline-none shadow-[0_1px_2px_rgb(var(--madoo-ink-shadow-rgb)/0.035),0_0_0_0.5px_rgb(var(--madoo-ink-shadow-rgb)/0.22)] placeholder:text-madoo-muted focus:shadow-[0_2px_6px_rgb(var(--madoo-ink-shadow-rgb)/0.055),0_0_0_0.5px_rgb(var(--madoo-rule-rgb)/0.34)]"
            />
          ) : null}

          <input
            type="email"
            placeholder={copy.email}
            value={email}
            disabled={emailStep === "password"}
            onChange={(event) => {
              setEmail(event.target.value);
              setError(null);
            }}
            className="h-8 rounded-lg bg-madoo-paper px-3.5 text-sm text-madoo-ink outline-none shadow-[0_1px_2px_rgb(var(--madoo-ink-shadow-rgb)/0.035),0_0_0_0.5px_rgb(var(--madoo-ink-shadow-rgb)/0.22)] placeholder:text-madoo-muted focus:shadow-[0_2px_6px_rgb(var(--madoo-ink-shadow-rgb)/0.055),0_0_0_0.5px_rgb(var(--madoo-rule-rgb)/0.34)]"
          />

          {emailStep === "password" ? (
            <input
              type="password"
              autoComplete={
                emailMode === "register" ? "new-password" : "current-password"
              }
              placeholder={copy.password}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleEmailContinue();
                }
              }}
              className="h-8 rounded-lg bg-madoo-paper px-3.5 text-sm text-madoo-ink outline-none shadow-[0_1px_2px_rgb(var(--madoo-ink-shadow-rgb)/0.035),0_0_0_0.5px_rgb(var(--madoo-ink-shadow-rgb)/0.22)] placeholder:text-madoo-muted focus:shadow-[0_2px_6px_rgb(var(--madoo-ink-shadow-rgb)/0.055),0_0_0_0.5px_rgb(var(--madoo-rule-rgb)/0.34)]"
            />
          ) : null}

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => void handleEmailContinue()}
            className="h-8 cursor-pointer rounded-lg bg-madoo-ink text-sm text-white shadow-[0_8px_20px_rgb(var(--madoo-ink-shadow-rgb)/0.16),0_0_0_0.5px_rgb(var(--madoo-ink-shadow-rgb)/0.22)] transition hover:bg-madoo-ink-hover"
          >
            {copy.continue}
          </button>

          {emailStep === "password" ? (
            <div className="flex items-center justify-between gap-2 text-xs">
              <button
                type="button"
                className="cursor-pointer text-zinc-500 underline underline-offset-2"
                onClick={() => {
                  setEmailStep("email");
                  setPassword("");
                  setName("");
                  setError(null);
                }}
              >
                {copy.useDifferentEmail}
              </button>
              <button
                type="button"
                className="cursor-pointer font-medium text-zinc-700 underline underline-offset-2"
                onClick={() => {
                  setEmailMode((current) =>
                    current === "login" ? "register" : "login",
                  );
                  setPassword("");
                  setName("");
                  setError(null);
                }}
              >
                {emailMode === "login"
                  ? copy.createAccount
                  : copy.signInInstead}
              </button>
            </div>
          ) : null}
        </div>

        {error ? (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <p className="mt-5 text-xs leading-5 text-zinc-500">
          {copy.termsPrefix}{" "}
          <Link
            className="font-medium text-zinc-700 underline underline-offset-2"
            href="/terms"
          >
            {copy.terms}
          </Link>{" "}
          {copy.and}{" "}
          <Link
            className="font-medium text-zinc-700 underline underline-offset-2"
            href="/privacy"
          >
            {copy.privacy}
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
