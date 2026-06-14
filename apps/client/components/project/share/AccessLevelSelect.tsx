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
import { useEffect, useRef, useState } from "react";

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
    description: "Full access to the project",
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
    description: "View the project but can’t modify it",
    icon: ViewIcon,
    pro: true,
  },
];

/**
 * Project access-level picker. The two Pro tiers are gated: selecting one calls
 * `onUpgrade` (pricing) instead of applying. Rendered as a compact popover that
 * floats over (rather than pushing) the share panel.
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
  const rootRef = useRef<HTMLDivElement>(null);
  const current = options.find((option) => option.value === value) ?? options[1];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const select = (option: Option) => {
    setOpen(false);
    if (option.pro) {
      onUpgrade();
      return;
    }
    onChange(option.value);
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        className="inline-flex items-center gap-1.5 rounded-lg bg-madoo-surface px-2.5 py-1.5 text-xs font-medium text-madoo-ink shadow-madoo-border transition-[background,box-shadow] hover:bg-madoo-bg hover:shadow-(--shadow-border-rule-hover)"
        onClick={() => setOpen((previous) => !previous)}
        type="button"
      >
        <HugeiconsIcon
          aria-hidden="true"
          className="text-madoo-ink-soft"
          icon={current.icon}
          primaryColor="currentColor"
          size={14}
          strokeWidth={1.7}
        />
        {current.label}
        <HugeiconsIcon
          aria-hidden="true"
          className={cn(
            "text-madoo-ink-muted transition-transform",
            open && "rotate-180",
          )}
          icon={ArrowDown01Icon}
          primaryColor="currentColor"
          size={13}
          strokeWidth={1.7}
        />
      </button>

      {open ? (
        <ul
          className="absolute bottom-full right-0 z-[var(--z-popover)] mb-1.5 grid w-64 gap-0.5 rounded-lg bg-madoo-surface p-1.5 shadow-(--shadow-border-rule-hover)"
          role="listbox"
        >
          {options.map((option) => {
            const active = option.value === value;
            return (
              <li key={option.value}>
                <button
                  aria-selected={active}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors",
                    active ? "bg-madoo-surface-2" : "hover:bg-madoo-bg",
                  )}
                  onClick={() => select(option)}
                  role="option"
                  type="button"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-md bg-madoo-surface-2 text-madoo-ink-soft">
                    <HugeiconsIcon
                      aria-hidden="true"
                      icon={option.icon}
                      primaryColor="currentColor"
                      size={15}
                      strokeWidth={1.6}
                    />
                  </span>
                  <span className="grid min-w-0 flex-1 gap-0.5">
                    <span className="flex items-center gap-1.5">
                      <span className="text-[13px] font-medium text-madoo-ink">
                        {option.label}
                      </span>
                      {option.pro ? <Badge tone="accent">Pro</Badge> : null}
                    </span>
                    <span className="text-[11px] leading-4 text-madoo-ink-muted">
                      {option.description}
                    </span>
                  </span>
                  {active ? (
                    <HugeiconsIcon
                      aria-hidden="true"
                      className="shrink-0 text-madoo-accent-deep"
                      icon={Tick02Icon}
                      primaryColor="currentColor"
                      size={15}
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
