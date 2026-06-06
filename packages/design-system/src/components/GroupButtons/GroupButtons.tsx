import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { cx } from "../../lib/cx";

export interface GroupButtonItem {
  value: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface GroupButtonsProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "value"> {
  items: readonly GroupButtonItem[];
  value: string;
  onChange: (value: string) => void;
  size?: "sm" | "md" | "lg";
  showLabels?: boolean;
  className?: string;
  "aria-label"?: string;
}

const sizeClasses: Record<NonNullable<GroupButtonsProps["size"]>, string> = {
  sm: "h-9 min-w-9 px-2.5",
  md: "h-12 min-w-12 px-3.5",
  lg: "h-16 min-w-16 px-[18px]",
};

export function GroupButtons({
  items,
  value,
  onChange,
  size = "md",
  showLabels = false,
  className,
  "aria-label": ariaLabel,
  ...buttonProps
}: GroupButtonsProps) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cx("inline-flex items-center isolate font-madoo-sans", className)}
    >
      {items.map((item) => {
        const selected = item.value === value;

        return (
          <button
            {...buttonProps}
            key={item.value}
            type="button"
            aria-label={showLabels ? undefined : item.label}
            aria-pressed={selected}
            disabled={buttonProps.disabled || item.disabled}
            className={cx(
              "relative -ml-px inline-flex cursor-pointer appearance-none items-center justify-center gap-2 border-0 bg-madoo-surface font-[inherit] text-[12.5px] font-medium leading-none text-madoo-ink shadow-[var(--shadow-border)] transition-[background,color,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-out)] first:ml-0 first:rounded-l-[var(--radius-lg)] last:rounded-r-[var(--radius-lg)] only:rounded-[var(--radius-lg)] enabled:hover:bg-madoo-bg-2 enabled:hover:shadow-[var(--shadow-border-rule-hover)] disabled:cursor-not-allowed disabled:opacity-55 aria-pressed:z-10 aria-pressed:bg-madoo-ink aria-pressed:text-madoo-accent-fg aria-pressed:shadow-[var(--shadow-border-ink)] aria-pressed:enabled:hover:bg-madoo-ink-soft",
              sizeClasses[size],
            )}
            onClick={() => onChange(item.value)}
          >
            {item.icon ? (
              <span className="inline-flex items-center justify-center" aria-hidden="true">
                {item.icon}
              </span>
            ) : null}
            {showLabels ? (
              <span className="whitespace-nowrap">{item.label}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
