"use client";

import { useClientStore } from "@/stores/client-store";
import { Menu01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";

/**
 * Mobile-only top bar with a hamburger that opens the off-canvas nav drawer.
 * Hidden on md+ where the Sidebar sits in the grid flow.
 */
export function MobileTopBar() {
  const setMobileNavOpen = useClientStore((state) => state.setMobileNavOpen);

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 bg-white px-2 shadow-(--shadow-border-bottom-soft) md:hidden">
      <button
        type="button"
        aria-label="Open navigation"
        onClick={() => setMobileNavOpen(true)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-madoo-ink-soft transition hover:bg-madoo-surface-2 hover:text-madoo-ink"
      >
        <HugeiconsIcon
          aria-hidden="true"
          icon={Menu01Icon}
          primaryColor="currentColor"
          size={20}
          strokeWidth={1.5}
        />
      </button>
      <Link
        aria-label="Madoo home"
        href="/"
        className="inline-flex items-center"
      >
        <Image
          alt="Madoo"
          height={24}
          width={24}
          src="/madoo-transparent.png"
          className="rounded-[7px] object-contain"
          priority
        />
      </Link>
    </header>
  );
}
