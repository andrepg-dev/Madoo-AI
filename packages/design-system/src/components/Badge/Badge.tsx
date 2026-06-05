import type { HTMLAttributes } from "react";
import { cx } from "../../lib/cx";
import "./Badge.css";

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
        "madoo-badge",
        tone !== "accent" && `madoo-badge--${tone}`,
        dot && "madoo-badge--dot",
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
