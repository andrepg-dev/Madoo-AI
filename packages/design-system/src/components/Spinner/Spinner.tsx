import type { HTMLAttributes } from "react";
import { cx } from "../../lib/cx";
import "./Spinner.css";

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
        "madoo-spinner",
        size !== "md" && `madoo-spinner--${size}`,
        className,
      )}
      {...rest}
    />
  );
}
