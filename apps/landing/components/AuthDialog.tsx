"use client";

import { useEffect } from "react";

type AuthDialogProps = {
  open: boolean;
  onClose: () => void;
};

const authProviders = [
  {
    name: "Google",
    label: "Continue with Google",
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
    label: "Continue with GitHub",
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
  {
    name: "Apple",
    label: "Continue with Apple",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <path
          fill="currentColor"
          d="M16.43 12.53c-.02-2.02 1.65-2.99 1.72-3.04-.94-1.37-2.4-1.56-2.92-1.58-1.24-.13-2.43.73-3.06.73-.64 0-1.62-.71-2.66-.69-1.37.02-2.64.8-3.34 2.02-1.43 2.48-.37 6.15 1.03 8.16.68.98 1.49 2.09 2.55 2.05 1.02-.04 1.41-.66 2.65-.66 1.23 0 1.58.66 2.66.64 1.1-.02 1.79-1 2.46-1.99.78-1.14 1.1-2.25 1.12-2.31-.02-.01-2.14-.82-2.16-3.33ZM14.42 6.6c.56-.68.94-1.62.84-2.56-.81.03-1.79.54-2.38 1.22-.52.6-.98 1.56-.86 2.48.91.07 1.84-.46 2.4-1.14Z"
        />
      </svg>
    ),
  },
];

export default function AuthDialog({ open, onClose }: AuthDialogProps) {
  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[#071123]/45 px-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-dialog-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close login dialog"
        onClick={onClose}
        tabIndex={-1}
      />

      <div className="font-figtree relative w-full max-w-[390px] rounded-[28px] bg-[#FAFBFD] px-7 py-7 text-[#101114] shadow-[0_28px_90px_rgba(7,17,35,0.28),0_0_0_1px_rgba(12,52,106,0.12),inset_0_1px_0_rgba(255,255,255,0.92)]">
        <button
          type="button"
          className="absolute right-5 top-5 inline-flex h-7 w-7 items-center justify-center rounded-full text-zinc-500 transition hover:bg-black/5 hover:text-zinc-900"
          aria-label="Close"
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
          <p className="text-2xl leading-none text-zinc-400">Start building.</p>
          <h2 id="auth-dialog-title" className="mt-1 text-2xl leading-tight">
            Create free account
          </h2>
        </div>

        <div className="grid gap-3">
          {authProviders.map((provider) => (
            <button
              key={provider.name}
              type="button"
              className="flex h-8 w-full items-center justify-center gap-2 rounded-lg bg-white text-sm text-[#101114] shadow-[0_1px_2px_rgba(16,17,20,0.035),0_0_0_0.5px_rgba(16,17,20,0.22)] transition hover:bg-[#f7f8fb] hover:shadow-[0_2px_6px_rgba(16,17,20,0.055),0_0_0_0.5px_rgba(16,17,20,0.28)]"
            >
              <span className="text-[#101114]">{provider.icon}</span>
              {provider.label}
            </button>
          ))}
        </div>

        <div className="my-5 flex items-center gap-3 text-xs text-zinc-900">
          <span className="h-px flex-1 bg-zinc-300" />
          <span>OR</span>
          <span className="h-px flex-1 bg-zinc-300" />
        </div>

        <div className="grid gap-2.5">
          <input
            type="email"
            placeholder="Email"
            className="h-8 rounded-lg bg-white px-3.5 text-sm text-[#101114] outline-none shadow-[0_1px_2px_rgba(16,17,20,0.035),0_0_0_0.5px_rgba(16,17,20,0.22)] placeholder:text-zinc-600 focus:shadow-[0_2px_6px_rgba(16,17,20,0.055),0_0_0_0.5px_rgba(12,52,106,0.34)]"
          />
          <button
            type="button"
            className="h-8 rounded-lg bg-[#101114] text-sm text-white shadow-[0_8px_20px_rgba(16,17,20,0.16),0_0_0_0.5px_rgba(16,17,20,0.22)] transition hover:bg-[#26282d]"
          >
            Continue
          </button>
        </div>

        <p className="mt-5 text-xs leading-5 text-zinc-500">
          By continuing, you agree to the{" "}
          <a className="font-medium text-zinc-700 underline underline-offset-2" href="/terms">
            Terms of Service
          </a>{" "}
          and{" "}
          <a className="font-medium text-zinc-700 underline underline-offset-2" href="/privacy">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
}
