import type { HTMLAttributes } from "react";
import { cx } from "../../lib/cx";
import "./Tag.css";

export type TagTone = "accent" | "neutral" | "success" | "warn" | "danger" | "info";

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: TagTone;
  size?: "sm" | "md";
  /** Usar familia sans en vez de mono (default) */
  sans?: boolean;
}

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
        "madoo-tag",
        `madoo-tag--${tone}`,
        size === "sm" && "madoo-tag--sm",
        sans && "madoo-tag--sans",
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
