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
  return `<style>html{scrollbar-width:thin;scrollbar-color:${thumb} transparent;}::-webkit-scrollbar{width:20px;}::-webkit-scrollbar-track{background:transparent;margin-block:16px;}::-webkit-scrollbar-thumb{background:${thumb};border:7px solid transparent;border-right-width:9px;border-radius:999px;background-clip:padding-box;min-height:72px;}::-webkit-scrollbar-thumb:hover{background:${thumbHover};border:7px solid transparent;border-right-width:9px;background-clip:padding-box;}</style>`;
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

      <section className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-8 pt-8 sm:px-8 sm:pt-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10">
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

            <div
              className={cx(
                "madoo-paper-border mx-auto overflow-hidden rounded-2xl bg-white shadow-[0_20px_60px_rgb(7_17_35/0.08)] transition-[max-width] duration-300 ease-out",
                device === "mobile" ? "max-w-[400px]" : "max-w-none",
              )}
            >
              <iframe
                title={template.name}
                srcDoc={srcDoc}
                sandbox=""
                referrerPolicy="no-referrer"
                className={cx(
                  "block h-[600px] w-full border-0 sm:h-[720px] lg:h-[calc(100vh-172px)]",
                  scheme === "dark" ? "bg-[#0b0b0c]" : "bg-white",
                )}
              />
            </div>
          </div>

          {/* Info panel */}
          <aside className="flex min-w-0 flex-col self-start lg:sticky lg:top-24">
            {category ? (
              <span className="mb-3 inline-flex w-fit items-center rounded-full bg-madoo-ink/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-madoo-copy">
                {category}
              </span>
            ) : null}

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
        <section className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-24 pt-6 sm:px-8">
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
