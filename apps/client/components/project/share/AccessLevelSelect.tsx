"use client";

import { cn } from "@/lib/utils";
import {
  ArrowDown01Icon,
  PencilEdit02Icon,
  Tick02Icon,
  UserLock01Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { Badge } from "@madoo/design-system";
import { useState } from "react";

export type AccessLevel = "admin" | "edit" | "view";

type Option = {
  value: AccessLevel;
  label: string;
  description: string;
  icon: IconSvgElement;
  pro: boolean;
};

const options: Option[] = [
  {
    value: "admin",
    label: "Admin",
    description: "Full access to project",
    icon: UserLock01Icon,
    pro: true,
  },
  {
    value: "edit",
    label: "Can edit",
    description: "Edit the project and its settings",
    icon: PencilEdit02Icon,
    pro: false,
  },
  {
    value: "view",
    label: "Can view",
    description: "Can view project but can’t modify",
    icon: ViewIcon,
    pro: true,
  },
];

/**
 * Project access-level picker. The two Pro tiers are gated: selecting one calls
 * `onUpgrade` (pricing) instead of applying. Inline expand avoids nesting a
 * second popover inside the share dropdown.
 */
export function AccessLevelSelect({
  value,
  onChange,
  onUpgrade,
}: {
  value: AccessLevel;
  onChange: (value: AccessLevel) => void;
  onUpgrade: () => void;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((option) => option.value === value) ?? options[1];

  const select = (option: Option) => {
    if (option.pro) {
      onUpgrade();
      setOpen(false);
      return;
    }
    onChange(option.value);
    setOpen(false);
  };

  return (
    <div className="grid gap-1.5">
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        className="inline-flex items-center gap-1.5 rounded-lg bg-madoo-surface-2 px-2.5 py-1.5 text-xs font-medium text-madoo-ink transition hover:bg-madoo-surface"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        {current.label}
        <HugeiconsIcon
          aria-hidden="true"
          className={cn("transition-transform", open && "rotate-180")}
          icon={ArrowDown01Icon}
          primaryColor="currentColor"
          size={14}
          strokeWidth={1.7}
        />
      </button>

      {open ? (
        <ul className="grid gap-0.5 rounded-xl bg-white p-1.5 shadow-madoo-border" role="listbox">
          {options.map((option) => {
            const active = option.value === value;
            return (
              <li key={option.value}>
                <button
                  aria-selected={active}
                  className={cn(
                    "flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left transition",
                    active ? "bg-madoo-surface-2" : "hover:bg-madoo-surface",
                  )}
                  onClick={() => select(option)}
                  role="option"
                  type="button"
                >
                  <HugeiconsIcon
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-madoo-ink-soft"
                    icon={option.icon}
                    primaryColor="currentColor"
                    size={17}
                    strokeWidth={1.6}
                  />
                  <span className="grid min-w-0 flex-1 gap-0.5">
                    <span className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-madoo-ink">
                        {option.label}
                      </span>
                      {option.pro ? <Badge tone="accent">Pro</Badge> : null}
                    </span>
                    <span className="text-xs text-madoo-ink-muted">
                      {option.description}
                    </span>
                  </span>
                  {active ? (
                    <HugeiconsIcon
                      aria-hidden="true"
                      className="mt-0.5 shrink-0 text-madoo-ink"
                      icon={Tick02Icon}
                      primaryColor="currentColor"
                      size={16}
                      strokeWidth={1.9}
                    />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
