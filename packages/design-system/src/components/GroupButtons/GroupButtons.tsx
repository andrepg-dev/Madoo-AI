import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { cx } from "../../lib/cx";
import "./GroupButtons.css";

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
      className={cx("madoo-group-buttons", `madoo-group-buttons--${size}`, className)}
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
            className="madoo-group-buttons__item"
            onClick={() => onChange(item.value)}
          >
            {item.icon ? (
              <span className="madoo-group-buttons__icon" aria-hidden="true">
                {item.icon}
              </span>
            ) : null}
            {showLabels ? (
              <span className="madoo-group-buttons__label">{item.label}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
