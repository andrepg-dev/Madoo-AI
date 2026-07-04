"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Card, Icon, cx } from "@madoo/design-system";
import type { Role } from "@madoo/shared";

export type SettingsArea = "account" | "workspace" | "support";
export type AccountSection = "profile" | "billing" | "referral" | "sound";
export type WorkspaceSection = "overview" | "avatar" | "members" | "danger";

export type NavIcon =
  | "user"
  | "barChart"
  | "bell"
  | "settings"
  | "image"
  | "copy"
  | "lock"
  | "message"
  | "sparkle";

export type NavItem = {
  area: SettingsArea;
  section?: AccountSection | WorkspaceSection;
  label: string;
  description: string;
  icon: NavIcon;
};

export type NavGroup = { label: string; items: NavItem[] };

/** URL segment for a nav item, e.g. /settings/profile, /settings/general. */
export function slugOf(item: NavItem): string {
  if (item.area === "workspace" && item.section === "overview") return "general";
  return item.section ?? item.area;
}

export function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function canAdmin(role: Role | undefined) {
  return role === "OWNER" || role === "ADMIN";
}

export function SettingsNavRow({
  active,
  icon,
  label,
  href,
}: {
  active: boolean;
  icon: NavIcon;
  label: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cx(
        "inline-flex h-8 min-h-8 w-full cursor-pointer select-none items-center justify-start gap-2.5 overflow-hidden rounded-lg border-0 px-2.5 py-0 font-madoo-sans text-(length:--font-size-base) leading-none no-underline transition-[background,color,box-shadow] duration-(--duration-base) ease-out",
        active
          ? "bg-[color-mix(in_srgb,var(--accent)_10%,white)] font-normal text-madoo-accent-deep shadow-[inset_0_0_0_0.5px_color-mix(in_srgb,var(--accent)_18%,transparent)] hover:text-madoo-accent-deep"
          : "bg-transparent font-normal text-madoo-ink-soft hover:bg-[rgb(var(--rule-rgb)/0.08)] hover:text-madoo-ink",
      )}
    >
      <span
        className="inline-flex shrink-0 items-center justify-center"
        style={{ width: 15, height: 15 }}
      >
        <Icon name={icon} size={15} />
      </span>
      <span className="truncate">{label}</span>
    </Link>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <div className="text-(length:--font-size-xs) font-medium uppercase leading-none tracking-[0.08em] text-madoo-ink-muted">
        {eyebrow}
      </div>
      <h1 className="mt-2 text-3xl font-semibold leading-none text-madoo-ink">
        {title}
      </h1>
      <p className="mt-3 max-w-2xl text-(length:--font-size-base) leading-6 text-madoo-ink-muted">
        {description}
      </p>
    </div>
  );
}

export function SettingsCard({
  title,
  description,
  children,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Card className="rounded-[20px]! p-5!">
      {title || description ? (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title ? (
              <h2 className="text-lg font-semibold leading-none text-madoo-ink">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="mt-2 text-(length:--font-size-sm) leading-5 text-madoo-ink-muted">
                {description}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
      {children}
    </Card>
  );
}
