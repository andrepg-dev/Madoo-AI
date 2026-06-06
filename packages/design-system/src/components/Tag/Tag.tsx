import type { HTMLAttributes } from "react";
import { cx } from "../../lib/cx";

export type TagTone = "accent" | "neutral" | "success" | "warn" | "danger" | "info";

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: TagTone;
  size?: "sm" | "md";
  /** Usar familia sans en vez de mono (default) */
  sans?: boolean;
}

const toneClasses: Record<TagTone, string> = {
  accent: "bg-madoo-accent-soft text-madoo-accent-deep",
  neutral: "bg-madoo-surface-2 text-madoo-ink-soft",
  success: "bg-madoo-success-soft text-madoo-success",
  warn: "bg-madoo-warn-soft text-madoo-warn",
  danger: "bg-madoo-danger-soft text-madoo-danger",
  info: "bg-madoo-info-soft text-madoo-info",
};

export function Tag({
  tone = "accent",
  size = "md",
  sans,
  className,
  children,
  ...rest
}: TagProps) {
  return (
    <span
      className={cx(
        "inline-flex w-fit items-center gap-[5px] rounded-[var(--radius-lg)] px-[9px] py-[5px] font-madoo-mono text-xs font-medium",
        toneClasses[tone],
        size === "sm" && "px-1.5 py-0.5 text-[10.5px]",
        sans && "font-madoo-sans",
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
