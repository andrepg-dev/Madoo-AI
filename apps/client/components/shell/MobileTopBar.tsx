"use client";

import { useClientStore } from "@/stores/client-store";
import { Menu01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { IconButton } from "@madoo/design-system";
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
      <IconButton
        aria-label="Open navigation"
        className="h-5! w-5!"
        onClick={() => setMobileNavOpen(true)}
        size="sm"
        variant="ghost"
      >
        <HugeiconsIcon
          aria-hidden="true"
          icon={Menu01Icon}
          primaryColor="currentColor"
          size={16}
          strokeWidth={1.5}
        />
      </IconButton>
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
