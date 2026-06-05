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

  useEffect(() => {
    const onScroll = () => setHasScrolled(window.scrollY > 4);

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const headerClassName = [
    "font-ibm-plex-sans sticky top-0 left-0 right-0 z-[100] pointer-events-auto transition",
    hasScrolled
      ? `${scrolledBackgroundClassName} `
      : "bg-transparent",
  ].join(" ");

  return (
    <header className={headerClassName}>
      <div className="flex h-16 items-center justify-between px-4 sm:px-8 xl:px-48">
        <div className="flex gap-16">
          <Link
            className="flex cursor-pointer items-center gap-2.5"
            href="/"
            aria-label="Madoo AI home"
          >
            <img
              className="h-7 w-7 object-contain"
              src="/madoo-transparent.png"
              alt=""
              aria-hidden="true"
            />
            <span className="font-medium leading-none tracking-normal text-black">
              Madoo AI
            </span>
          </Link>

          <nav
            className="hidden items-center gap-8 text-sm text-madoo-nav lg:flex"
            aria-label="Primary navigation"
          >
            <Link
              className="inline-flex cursor-pointer items-center gap-2"
              href={`${sectionHrefPrefix}#solutions`}
            >
              {copy.solutions}
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                size={13}
                strokeWidth={2.4}
                className="text-[#4f5b68] [&_path]:[stroke-linecap:square] [&_path]:[stroke-linejoin:miter]"
                aria-hidden="true"
              />
            </Link>
            <Link
              className="inline-flex cursor-pointer items-center gap-2"
              href={`${sectionHrefPrefix}#resources`}
            >
              {copy.resources}
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                size={13}
                strokeWidth={2.4}
                className="text-[#4f5b68] [&_path]:[stroke-linecap:square] [&_path]:[stroke-linejoin:miter]"
                aria-hidden="true"
              />
            </Link>
            <Link className="cursor-pointer" href={`${sectionHrefPrefix}#community`}>
              {copy.community}
            </Link>
            <Link className="cursor-pointer" href="/pricing">{copy.pricing}</Link>
          </nav>
        </div>

        <div className="flex gap-1.5">
          {onAuthClick ? (
            <>
              <LandingButton
                variant="secondary"
                className="hidden sm:inline-flex"
                onClick={onAuthClick}
              >
                {copy.login}
              </LandingButton>

              <LandingButton className="hidden sm:inline-flex" onClick={onAuthClick}>
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
          className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-[#c8ddec] text-madoo-nav sm:hidden"
          type="button"
          aria-label={copy.mobileMenu}
        >
          <HugeiconsIcon
            icon={Menu01Icon}
            size={21}
            strokeWidth={2}
            aria-hidden="true"
          />
        </button>
      </div>
    </header>
  );
}
