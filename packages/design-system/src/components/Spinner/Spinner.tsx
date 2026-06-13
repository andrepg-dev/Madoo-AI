import type { HTMLAttributes } from "react";
import { cx } from "../../lib/cx";

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  size?: "sm" | "md" | "lg";
  label?: string;
}

export function Spinner({
  size = "md",
  label = "Cargando…",
  className,
  ...rest
}: SpinnerProps) {
  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={label}
      className={cx(
        "inline-block animate-spin rounded-full border-current border-r-transparent",
        size === "sm" && "h-3 w-3 border-[1.5px]",
        size === "md" && "h-4.5 w-4.5 border-2",
        size === "lg" && "h-7 w-7 border-[3px]",
        className,
      )}
      {...rest}
    />
  );
}
