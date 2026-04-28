import { cx } from "../../lib/cx";
import "./SegmentedControl.css";

export interface SegmentedItem {
  value: string;
  label: string;
}

export interface SegmentedControlProps {
  items: SegmentedItem[];
  value: string;
  onChange: (value: string) => void;
  variant?: "default" | "minimal";
  className?: string;
  "aria-label"?: string;
}

export function SegmentedControl({
  items,
  value,
  onChange,
  variant = "default",
  className,
  "aria-label": ariaLabel,
}: SegmentedControlProps) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cx(
        "madoo-segmented",
        variant === "minimal" && "madoo-segmented--minimal",
        className,
      )}
    >
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          role="tab"
          aria-pressed={value === item.value}
          aria-selected={value === item.value}
          className="madoo-segmented__item"
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
