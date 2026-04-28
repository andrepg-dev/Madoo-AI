import type { HTMLAttributes } from "react";
import { cx } from "../../lib/cx";
import "./ProgressBar.css";

export interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  /** Valor entre 0 y 100 */
  value: number;
  tone?: "accent" | "success" | "ink";
  variant?: "default" | "thin";
  label?: string;
}

export function ProgressBar({
  value,
  tone = "accent",
  variant = "default",
  label,
  className,
  ...rest
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cx(
        "madoo-progress",
        "madoo-progress--inline",
        variant === "thin" && "madoo-progress--thin",
        tone !== "accent" && `madoo-progress--${tone}`,
        className,
      )}
      {...rest}
    >
      <div className="madoo-progress__fill" style={{ width: `${clamped}%` }} />
    </div>
  );
}
