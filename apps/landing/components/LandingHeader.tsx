"use client";

import { ArrowDown01Icon, Menu01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { LandingButton } from "./LandingButton";

type LandingHeaderCopy = {
  solutions: string;
  resources: string;
  community: string;
  pricing: string;
  login: string;
  getStarted: string;
  mobileMenu: string;
};

type LandingHeaderProps = {
  copy: LandingHeaderCopy;
  onAuthClick?: () => void;
  sectionHrefPrefix?: "" | "/";
  scrolledBackgroundClassName?: string;
};

function HeaderAction({
  children,
  href,
}: {
  children: ReactNode;
  href: string;
}) {
  return (
    <Link
      className="hidden cursor-pointer items-center gap-2 rounded-lg bg-madoo-ink px-4 py-2 text-sm leading-none text-white transition hover:bg-madoo-ink-hover sm:inline-flex"
      href={href}
    >
      {children}
    </Link>
  );
}

export function LandingHeader({
  copy,
  onAuthClick,
  sectionHrefPrefix = "",
  scrolledBackgroundClassName = "bg-madoo-paper-tint/50",
}: LandingHeaderProps) {
  const [hasScrolled, setHasScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setHasScrolled(window.scrollY > 4);

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const headerClassName = [
    "font-ibm-plex-sans sticky top-0 left-0 right-0 z-[100] pointer-events-auto transition",
    hasScrolled ? `${scrolledBackgroundClassName} ` : "bg-transparent",
  ].join(" ");
  const mobileMenuId = "landing-mobile-menu";
  const navLinks = [
    {
      label: copy.solutions,
      href: `${sectionHrefPrefix}#solutions`,
      hasArrow: true,
    },
    {
      label: copy.resources,
      href: `${sectionHrefPrefix}#resources`,
      hasArrow: true,
    },
    { label: copy.community, href: `${sectionHrefPrefix}#community` },
    { label: copy.pricing, href: "/pricing" },
  ];
  const closeMobileMenu = () => setMobileMenuOpen(false);
  const openAuthFromMobile = () => {
    closeMobileMenu();
    onAuthClick?.();
  };

  return (
    <header className={headerClassName}>
      <div className="flex h-16 items-center justify-between px-4 sm:px-8 xl:px-48">
        <div className="flex min-w-0 gap-16">
          <Link
            className="flex min-w-0 cursor-pointer items-center gap-2.5"
            href="/"
            aria-label="Madoo AI home"
            onClick={closeMobileMenu}
          >
            <img
              className="h-7 w-7 object-contain"
              src="/madoo-transparent.png"
              alt=""
              aria-hidden="true"
            />
            <span className="truncate font-medium leading-none tracking-normal text-black">
              Madoo AI
            </span>
          </Link>

          <nav
            className="hidden items-center gap-8 text-sm text-madoo-nav lg:flex"
            aria-label="Primary navigation"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                className="inline-flex cursor-pointer items-center gap-2"
                href={link.href}
              >
                {link.label}
                {link.hasArrow ? (
                  <HugeiconsIcon
                    icon={ArrowDown01Icon}
                    size={13}
                    strokeWidth={2.4}
                    className="text-[#4f5b68] [&_path]:[stroke-linecap:square] [&_path]:[stroke-linejoin:miter]"
                    aria-hidden="true"
                  />
                ) : null}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden gap-1.5 sm:flex">
          {onAuthClick ? (
            <>
              <LandingButton variant="secondary" onClick={onAuthClick}>
                {copy.login}
              </LandingButton>

              <LandingButton onClick={onAuthClick}>
                {copy.getStarted}
              </LandingButton>
            </>
          ) : (
            <>
              <Link
                className="madoo-paper-border madoo-paper-border-hover hidden cursor-pointer items-center gap-2 rounded-lg bg-madoo-paper px-3 py-2 text-sm leading-none text-madoo-ink transition sm:inline-flex"
                href="/"
              >
                {copy.login}
              </Link>
              <HeaderAction href="/">{copy.getStarted}</HeaderAction>
            </>
          )}
        </div>

        <button
          className="madoo-paper-border inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg bg-madoo-paper/60 text-madoo-nav sm:hidden"
          type="button"
          aria-label={copy.mobileMenu}
          aria-controls={mobileMenuId}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((current) => !current)}
        >
          <HugeiconsIcon
            icon={Menu01Icon}
            size={21}
            strokeWidth={2}
            aria-hidden="true"
          />
        </button>
      </div>

      {mobileMenuOpen ? (
        <div
          id={mobileMenuId}
          className="madoo-paper-border mx-2 mb-2 rounded-xl bg-white/95 p-2 backdrop-blur sm:hidden"
        >
          <nav
            className="grid gap-1 text-sm text-madoo-nav"
            aria-label="Mobile navigation"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                className="flex min-h-11 items-center justify-between rounded-lg px-3 font-medium transition hover:bg-madoo-surface"
                href={link.href}
                onClick={closeMobileMenu}
              >
                {link.label}
                {link.hasArrow ? (
                  <HugeiconsIcon
                    icon={ArrowDown01Icon}
                    size={14}
                    strokeWidth={2.4}
                    className="text-[#4f5b68] [&_path]:[stroke-linecap:square] [&_path]:[stroke-linejoin:miter]"
                    aria-hidden="true"
                  />
                ) : null}
              </Link>
            ))}
          </nav>

          <div className="mt-2 grid gap-2 pt-2 shadow-[inset_0_0.5px_0_rgb(var(--madoo-rule-rgb)/0.12)]">
            {onAuthClick ? (
              <>
                <LandingButton
                  variant="secondary"
                  className="w-full justify-center"
                  onClick={openAuthFromMobile}
                >
                  {copy.login}
                </LandingButton>
                <LandingButton
                  className="w-full justify-center"
                  onClick={openAuthFromMobile}
                >
                  {copy.getStarted}
                </LandingButton>
              </>
            ) : (
              <>
                <Link
                  className="madoo-paper-border madoo-paper-border-hover flex min-h-10 cursor-pointer items-center justify-center rounded-lg bg-madoo-paper px-3 text-sm leading-none text-madoo-ink transition"
                  href="/"
                  onClick={closeMobileMenu}
                >
                  {copy.login}
                </Link>
                <Link
                  className="flex min-h-10 cursor-pointer items-center justify-center rounded-lg bg-madoo-ink px-4 text-sm leading-none text-white transition hover:bg-madoo-ink-hover"
                  href="/"
                  onClick={closeMobileMenu}
                >
                  {copy.getStarted}
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
