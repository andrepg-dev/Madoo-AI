import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
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
  const rootRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef(new Map<string, HTMLButtonElement>());
  const [indicator, setIndicator] = useState({ left: 0, width: 0, ready: false });

  useEffect(() => {
    const updateIndicator = () => {
      const activeItem = itemRefs.current.get(value);
      if (!activeItem) return;

      setIndicator({
        left: activeItem.offsetLeft,
        width: activeItem.offsetWidth,
        ready: true,
      });
    };

    updateIndicator();

    if (typeof ResizeObserver === "undefined") return undefined;

    const observer = new ResizeObserver(updateIndicator);
    if (rootRef.current) observer.observe(rootRef.current);
    itemRefs.current.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, [items, value]);

  const indicatorStyle = {
    "--madoo-segmented-indicator-x": `${indicator.left}px`,
    "--madoo-segmented-indicator-width": `${indicator.width}px`,
  } as CSSProperties;

  return (
    <div
      ref={rootRef}
      role="tablist"
      aria-label={ariaLabel}
      style={indicatorStyle}
      className={cx(
        "madoo-segmented",
        indicator.ready && "madoo-segmented--ready",
        variant === "minimal" && "madoo-segmented--minimal",
        className,
      )}
    >
      <span className="madoo-segmented__indicator" aria-hidden="true" />
      {items.map((item) => (
        <button
          key={item.value}
          ref={(node) => {
            if (node) itemRefs.current.set(item.value, node);
            else itemRefs.current.delete(item.value);
          }}
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
