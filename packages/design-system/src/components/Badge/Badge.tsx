import type { HTMLAttributes } from "react";
import { cx } from "../../lib/cx";

export type BadgeTone =
  | "accent"
  | "neutral"
  | "success"
  | "warn"
  | "danger"
  | "info"
  | "solid";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  /** Muestra un punto a la izquierda del label */
  dot?: boolean;
}

const toneClasses: Record<BadgeTone, string> = {
  accent: "bg-madoo-accent-soft text-madoo-accent-deep",
  neutral: "bg-madoo-surface-2 text-madoo-ink-soft",
  success: "bg-madoo-success-soft text-madoo-success",
  warn: "bg-madoo-warn-soft text-madoo-warn",
  danger: "bg-madoo-danger-soft text-madoo-danger",
  info: "bg-madoo-info-soft text-madoo-info",
  solid: "bg-madoo-ink text-madoo-accent-fg",
};

export function Badge({
  tone = "accent",
  dot,
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.25 whitespace-nowrap rounded-full px-3 py-1.25 font-madoo-sans text-[11px] font-medium",
        toneClasses[tone],
        dot &&
          "before:inline-block before:h-1.5 before:w-1.5 before:shrink-0 before:rounded-full before:bg-current before:content-['']",
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
