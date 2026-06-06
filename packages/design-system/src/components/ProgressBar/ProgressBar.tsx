import type { HTMLAttributes } from "react";
import { cx } from "../../lib/cx";

export interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  /** Valor entre 0 y 100 */
  value: number;
  tone?: "accent" | "success" | "ink";
  variant?: "default" | "thin";
  label?: string;
}

const fillToneClasses = {
  accent: "bg-madoo-accent",
  success: "bg-madoo-success",
  ink: "bg-madoo-ink",
} satisfies Record<NonNullable<ProgressBarProps["tone"]>, string>;

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
        "flex w-full overflow-hidden rounded-full bg-madoo-surface-2",
        variant === "thin" ? "h-[3px] rounded-none" : "h-1.5",
        className,
      )}
      {...rest}
    >
      <div
        className={cx(
          "h-full transition-[width] duration-[var(--duration-slow)] ease-[var(--ease-out)]",
          fillToneClasses[tone],
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
