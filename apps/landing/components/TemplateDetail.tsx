"use client";

import {
  clientHomeUrl,
  clientUseTemplateUrl,
  isLikelySignedIn,
} from "@/lib/client-app";
import type {
  LandingCommunityTemplate,
  LandingCommunityTemplateDetail,
} from "@/lib/community-templates";
import {
  AiMagicIcon,
  ComputerIcon,
  Moon02Icon,
  SmartPhone01Icon,
  Sun03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cx } from "@madoo/design-system";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AuthDialog from "./AuthDialog";
import { TEMPLATE_ROLE_LABELS, localeCopy } from "./HomePage";
import { LandingHeader } from "./LandingHeader";

type Locale = "en" | "es";
type Device = "desktop" | "mobile";
type Scheme = "light" | "dark";

// Emails gate their dark styles behind `prefers-color-scheme`, which normally
// follows the viewer's OS. Rewrite those queries to always/never match so the
// preview toggle controls the rendered scheme deterministically — CSS-only, so
// it works inside the fully sandboxed iframe (no scripts allowed).
function applyScheme(html: string, scheme: Scheme): string {
  const dark = scheme === "dark";
  return html
    .replace(
      /prefers-color-scheme\s*:\s*dark/gi,
      dark ? "min-width:0px" : "max-width:0px",
    )
    .replace(
      /prefers-color-scheme\s*:\s*light/gi,
      dark ? "max-width:0px" : "min-width:0px",
    );
}

// Mirror the app's `madoo-preview-scrollbar`: a slim, rounded thumb floating
// over a transparent track. Injected into the preview iframe so the email body
// scrolls with the same chrome as the product instead of the browser default.
function previewScrollbarStyle(scheme: Scheme): string {
  const thumb = scheme === "dark" ? "rgba(255,255,255,0.26)" : "#555555";
  const thumbHover = scheme === "dark" ? "rgba(255,255,255,0.4)" : "#3f3f3f";
  return `<style>html{scrollbar-width:thin;scrollbar-color:${thumb} transparent;overflow-x:hidden;}body{overflow-x:hidden;}::-webkit-scrollbar{width:20px;height:0;}::-webkit-scrollbar-track{background:transparent;margin-block:16px;}::-webkit-scrollbar-thumb{background:${thumb};border:7px solid transparent;border-right-width:9px;border-radius:999px;background-clip:padding-box;min-height:72px;}::-webkit-scrollbar-thumb:hover{background:${thumbHover};border:7px solid transparent;border-right-width:9px;background-clip:padding-box;}</style>`;
}

// Slip our style into the email's <head> (or <body>) so it wins without a
// script — the iframe is fully sandboxed.
function injectHead(html: string, snippet: string): string {
  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, `${snippet}</head>`);
  }
  if (/<body[^>]*>/i.test(html)) {
    return html.replace(/(<body[^>]*>)/i, `$1${snippet}`);
  }
  return `${snippet}${html}`;
}

export default function TemplateDetail({
  locale = "en",
  template,
  recommended,
}: {
  locale?: Locale;
  template: LandingCommunityTemplateDetail;
  recommended: LandingCommunityTemplate[];
}) {
  const copy = localeCopy[locale];
  const t = copy.templates;

  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [usingTemplate, setUsingTemplate] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [device, setDevice] = useState<Device>("desktop");
  const [scheme, setScheme] = useState<Scheme>("light");

  // Cookies aren't readable during SSR; detect the session after mount so the
  // header CTA doesn't cause a hydration mismatch.
  useEffect(() => setSignedIn(isLikelySignedIn()), []);

  const supportsDark = useMemo(
    () => /prefers-color-scheme\s*:\s*dark/i.test(template.html),
    [template.html],
  );
  const srcDoc = useMemo(() => {
    const effectiveScheme: Scheme = supportsDark ? scheme : "light";
    const base = supportsDark
      ? applyScheme(template.html, scheme)
      : template.html;
    return injectHead(base, previewScrollbarStyle(effectiveScheme));
  }, [template.html, scheme, supportsDark]);

  const variables = template.variables ?? [];
  const category = template.categories[0] ?? template.category;

  // View is free; "Use" needs a session. Signed-in visitors go straight to the
  // app, otherwise we open the login dialog and resume into the app after auth.
  const handleUse = () => {
    const target = clientUseTemplateUrl(template.id);
    if (isLikelySignedIn()) {
      setUsingTemplate(true);
      window.location.assign(target);
      return;
    }
    setNextUrl(target);
    setAuthDialogOpen(true);
  };

  return (
    <main
      lang={locale}
      className="relative min-h-screen w-full bg-madoo-page font-ibm-plex-sans"
    >
      <LandingHeader
        copy={copy.nav}
        scrolledBackgroundClassName="bg-madoo-page/80 backdrop-blur"
        onAuthClick={signedIn ? undefined : () => setAuthDialogOpen(true)}
        appUrl={signedIn ? clientHomeUrl() : undefined}
        goToAppLabel={copy.nav.goToApp}
      />

      <section className="relative z-10 mx-auto w-full max-w-[1340px] px-4 pb-8 pt-8 sm:px-8 sm:pt-4">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_460px] lg:gap-14">
          {/* Live HTML preview — the email itself, rendered in a sandboxed
              iframe so its styles can't leak into the marketing page. */}
          <div className="min-w-0">
            <div className="mb-3 flex items-center justify-end gap-2">
              {supportsDark ? (
                <Segmented
                  value={scheme}
                  onChange={setScheme}
                  options={[
                    { value: "light", label: t.schemeLight, icon: Sun03Icon },
                    { value: "dark", label: t.schemeDark, icon: Moon02Icon },
                  ]}
                />
              ) : null}
              <Segmented
                value={device}
                onChange={setDevice}
                options={[
                  { value: "desktop", label: t.viewDesktop, icon: ComputerIcon },
                  {
                    value: "mobile",
                    label: t.viewMobile,
                    icon: SmartPhone01Icon,
                  },
                ]}
              />
            </div>

            {/* Stage stays full-width; in phone view it becomes the grey
                surface the device sits on, so the email shrinks — not the
                background. Phone bezel mirrors the app's DeviceFramePreview. */}
            <div
              className={cx(
                "madoo-paper-border h-[600px] overflow-hidden  shadow-[0_20px_60px_rgb(7_17_35/0.08)] transition-colors duration-300 sm:h-[720px] lg:h-[calc(100vh-172px)]",
                device === "mobile"
                  ? "flex justify-center overflow-y-auto overflow-x-hidden bg-[#F7F7F7] p-6"
                  : "flex flex-col bg-white",
              )}
            >
              {device === "mobile" ? (
                <div className="relative flex h-[780px] w-[390px] shrink-0 flex-col overflow-hidden rounded-[2.75rem] border-[10px] border-[#111317] bg-[#111317] shadow-[0_24px_70px_rgb(0_0_0/0.5)]">
                  {/* iOS status bar: gives the email breathing room under the
                      Dynamic Island instead of butting against it. */}
                  <div
                    className={cx(
                      "relative flex h-11 shrink-0 items-center justify-between px-6 pt-1",
                      scheme === "dark"
                        ? "bg-[#0b0b0c] text-white"
                        : "bg-white text-black",
                    )}
                  >
                    <span className="text-[13px] font-semibold tracking-tight">
                      9:41
                    </span>
                    <span className="absolute left-1/2 top-2 h-6 w-24 -translate-x-1/2 rounded-full bg-[#111317]" />
                    <span className="flex items-center gap-1.5">
                      <svg
                        width="17"
                        height="11"
                        viewBox="0 0 17 11"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <rect x="0" y="7.5" width="3" height="3.5" rx="1" />
                        <rect x="4.7" y="5" width="3" height="6" rx="1" />
                        <rect x="9.3" y="2.5" width="3" height="8.5" rx="1" />
                        <rect x="14" y="0" width="3" height="11" rx="1" />
                      </svg>
                      <svg
                        width="25"
                        height="12"
                        viewBox="0 0 25 12"
                        fill="none"
                        aria-hidden="true"
                      >
                        <rect
                          x="0.5"
                          y="0.5"
                          width="21"
                          height="11"
                          rx="3"
                          stroke="currentColor"
                          strokeOpacity="0.35"
                        />
                        <rect
                          x="2"
                          y="2"
                          width="16"
                          height="8"
                          rx="1.5"
                          fill="currentColor"
                        />
                        <path
                          d="M23 4v4a2 2 0 0 0 0-4Z"
                          fill="currentColor"
                          fillOpacity="0.4"
                        />
                      </svg>
                    </span>
                  </div>
                  <iframe
                    title={template.name}
                    srcDoc={srcDoc}
                    sandbox=""
                    referrerPolicy="no-referrer"
                    className={cx(
                      "min-h-0 w-full flex-1 border-0",
                      scheme === "dark" ? "bg-[#0b0b0c]" : "bg-white",
                    )}
                  />
                </div>
              ) : (
                <>
                  {/* Browser chrome mirrors the app's DeviceFramePreview. */}
                  <div className="flex h-11 shrink-0 items-center gap-2 border-b border-black/5 bg-[#f3f4f6] px-4">
                    <span className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                      <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                      <span className="h-3 w-3 rounded-full bg-[#28c840]" />
                    </span>
                    <span className="mx-auto inline-flex h-6 max-w-[60%] items-center truncate rounded-md bg-white px-3 text-xs text-[#6b7280] shadow-[inset_0_0_0_1px_rgb(0_0_0/0.06)]">
                      {template.name}
                    </span>
                  </div>
                  <iframe
                    title={template.name}
                    srcDoc={srcDoc}
                    sandbox=""
                    referrerPolicy="no-referrer"
                    className={cx(
                      "min-h-0 w-full flex-1 border-0",
                      scheme === "dark" ? "bg-[#0b0b0c]" : "bg-white",
                    )}
                  />
                </>
              )}
            </div>
          </div>

          {/* Info panel */}
          <aside className="flex min-w-0 flex-col self-start lg:sticky lg:top-24">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {category ? (
                <span className="inline-flex items-center rounded-full bg-madoo-ink/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-madoo-copy">
                  {category}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-madoo-paper px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-madoo-accent shadow-[0_0_0_0.5px_rgb(var(--madoo-rule-rgb)/0.18)]">
                <HugeiconsIcon icon={AiMagicIcon} size={13} strokeWidth={2} />
                {t.aiGenerated}
              </span>
            </div>

            <h1 className="m-0 text-3xl font-semibold leading-[1.1] text-madoo-text sm:text-4xl">
              {template.name}
            </h1>

            {template.authorName ? (
              <p className="mt-2 text-sm text-madoo-muted">
                {t.by} {template.authorName}
              </p>
            ) : null}

            {template.description ? (
              <p className="mt-4 max-w-xl text-[15px] leading-7 text-madoo-copy">
                {template.description}
              </p>
            ) : null}

            <button
              type="button"
              disabled={usingTemplate}
              onClick={handleUse}
              className="mt-6 h-11 cursor-pointer rounded-lg bg-madoo-ink text-sm font-medium text-white shadow-[0_8px_20px_rgb(var(--madoo-ink-shadow-rgb)/0.16),0_0_0_0.5px_rgb(var(--madoo-ink-shadow-rgb)/0.22)] transition hover:bg-madoo-ink-hover disabled:cursor-wait disabled:opacity-70"
            >
              {usingTemplate ? t.using : t.use}
            </button>

            <CompatibilityTester templateId={template.id} t={t} />

            <div className="mt-7 max-w-xl">
              <h2 className="m-0 text-xs font-medium uppercase tracking-wide text-madoo-muted">
                {t.variables}
              </h2>
              <div className="mt-3 space-y-2">
                {variables.length ? (
                  variables.map((variable) => (
                    <div
                      key={variable.name}
                      className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 shadow-[0_0_0_0.5px_rgb(var(--madoo-rule-rgb)/0.12)]"
                    >
                      <span className="min-w-0 truncate text-sm text-madoo-ink">
                        {variable.label ?? variable.name}
                      </span>
                      {variable.role ? (
                        <span className="shrink-0 rounded-md bg-madoo-neutral-50 px-2 py-0.5 text-[11px] font-medium text-madoo-muted shadow-[0_0_0_0.5px_rgb(var(--madoo-rule-rgb)/0.16)]">
                          {TEMPLATE_ROLE_LABELS[variable.role] ?? variable.role}
                        </span>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <p className="m-0 rounded-lg bg-white px-3 py-2 text-xs leading-5 text-madoo-muted shadow-[0_0_0_0.5px_rgb(var(--madoo-rule-rgb)/0.12)]">
                    {t.noVariables}
                  </p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </section>

      {recommended.length ? (
        <section className="relative z-10 mx-auto w-full max-w-[1440px] px-4 pb-24 pt-6 sm:px-8">
          <div className="border-t border-zinc-200/70 pt-10">
            <h2 className="m-0 text-2xl font-semibold leading-tight text-madoo-text">
              {t.recommended}
            </h2>
            <p className="mt-2 text-sm text-madoo-muted">
              {t.recommendedDescription}
            </p>

            <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {recommended.map((item) => (
                <RecommendedCard
                  key={item.id}
                  template={item}
                  previewAlt={t.previewAlt}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <AuthDialog
        open={authDialogOpen}
        onClose={() => setAuthDialogOpen(false)}
        locale={locale}
        nextUrl={nextUrl}
      />
    </main>
  );
}

const COMPAT_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Official brand marks (sourced via svgl.app), served from /public/logos.
const COMPAT_PROVIDERS = [
  { src: "/logos/gmail.svg", alt: "Gmail" },
  { src: "/logos/outlook.svg", alt: "Microsoft Outlook" },
  { src: "/logos/apple.svg", alt: "Apple Mail" },
] as const;

/**
 * Landing visitors mail themselves the template to check how it renders in
 * their real client (Gmail, Outlook, Apple Mail…). Public, proxied through
 * /api/template-test; the backend rate-limits per recipient and per day.
 */
function CompatibilityTester({
  templateId,
  t,
}: {
  templateId: string;
  t: {
    compatibilityTitle: string;
    compatibilityPlaceholder: string;
    compatibilityCta: string;
    compatibilitySending: string;
    compatibilitySent: string;
    compatibilityError: string;
    compatibilityInvalidEmail: string;
  };
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  const submit = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!COMPAT_EMAIL_RE.test(trimmed)) {
      setStatus("error");
      setMessage(t.compatibilityInvalidEmail);
      return;
    }
    setStatus("sending");
    setMessage("");
    try {
      const res = await fetch("/api/template-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, email: trimmed }),
      });
      if (!res.ok) {
        const raw = (await res.json().catch(() => null)) as {
          message?: string;
        } | null;
        throw new Error(raw?.message ?? t.compatibilityError);
      }
      setStatus("sent");
      setMessage(t.compatibilitySent);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : t.compatibilityError);
    }
  };

  return (
    <div className="mt-4 rounded-lg bg-white p-3">
      <div className="flex items-center gap-3">
        <span className="flex shrink-0 items-center gap-3">
          {COMPAT_PROVIDERS.map((provider) => (
            <img
              alt={provider.alt}
              className="h-[18px] w-[18px] object-contain"
              height={18}
              key={provider.src}
              src={provider.src}
              width={18}
            />
          ))}
        </span>
        <input
          type="email"
          inputMode="email"
          aria-label={t.compatibilityTitle}
          placeholder={t.compatibilityPlaceholder}
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (status === "error" || status === "sent") setStatus("idle");
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void submit();
            }
          }}
          className="h-9 min-w-0 flex-1 rounded-md border-0 bg-madoo-neutral-50 px-3 text-sm text-madoo-text outline-none placeholder:text-madoo-muted"
        />
        <button
          type="button"
          disabled={status === "sending"}
          onClick={() => void submit()}
          className="h-9 shrink-0 cursor-pointer whitespace-nowrap rounded-md bg-madoo-ink px-3 text-[13px] font-medium text-white transition hover:bg-madoo-ink-hover disabled:cursor-wait disabled:opacity-70"
        >
          {status === "sending" ? t.compatibilitySending : t.compatibilityCta}
        </button>
      </div>
      {message ? (
        <p
          className={cx(
            "mb-0 mt-2 text-xs leading-5",
            status === "error" ? "text-red-600" : "text-madoo-accent",
          )}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (next: T) => void;
  options: { value: T; label: string; icon: typeof ComputerIcon }[];
}) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg bg-madoo-neutral-50 p-0.5 shadow-[0_0_0_0.5px_rgb(var(--madoo-rule-rgb)/0.16)]">
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-label={option.label}
            aria-pressed={active}
            title={option.label}
            onClick={() => onChange(option.value)}
            className={cx(
              "inline-flex h-7 w-8 cursor-pointer items-center justify-center rounded-md border-0 transition",
              active
                ? "bg-white text-madoo-ink shadow-[0_0_0_0.5px_rgb(var(--madoo-rule-rgb)/0.16)]"
                : "bg-transparent text-madoo-muted hover:text-madoo-ink",
            )}
          >
            <HugeiconsIcon icon={option.icon} size={15} strokeWidth={1.8} />
          </button>
        );
      })}
    </div>
  );
}

function RecommendedCard({
  template,
  previewAlt,
}: {
  template: LandingCommunityTemplate;
  previewAlt: string;
}) {
  const category = template.categories[0] ?? template.category;

  return (
    <article className="group min-w-0">
      <Link
        href={`/templates/${template.id}`}
        aria-label={template.name}
        className="madoo-paper-border madoo-paper-border-hover relative block aspect-3/4 w-full overflow-hidden rounded-lg bg-white transition focus-visible:shadow-[0_0_0_1.5px_rgb(91_99_255/0.5)] focus-visible:outline-none"
      >
        {template.previewUrl ? (
          <img
            src={template.previewUrl}
            alt={`${template.name} ${previewAlt}`}
            loading="lazy"
            className="h-full w-full object-cover object-top brightness-[1.03] transition duration-200 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-madoo-neutral-50 text-xs text-madoo-muted">
            {template.name}
          </div>
        )}
      </Link>

      <div className="mt-2.5 min-w-0">
        <h3 className="m-0 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium leading-[1.2] text-[#101114]">
          {template.name}
        </h3>
        {category ? (
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-madoo-muted">
            {category}
          </p>
        ) : null}
      </div>
    </article>
  );
}
