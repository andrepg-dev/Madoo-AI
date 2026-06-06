import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { cx } from "../../lib/cx";

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
        "relative inline-flex gap-1 overflow-x-auto rounded-full bg-madoo-surface-2/35 p-1 font-madoo-sans shadow-[var(--shadow-border)] backdrop-blur-[18px] backdrop-saturate-150",
        variant === "minimal" && "gap-1.5 bg-transparent p-0 shadow-none backdrop-blur-none",
        className,
      )}
    >
      <span
        className={cx(
          "pointer-events-none absolute bottom-1 left-0 top-1 z-0 w-[var(--madoo-segmented-indicator-width)] rounded-full opacity-0 shadow-[inset_0_0_0_0.5px_rgb(var(--rule-rgb)_/_0.34)] transition-[transform,width,opacity] duration-[var(--duration-base)] ease-[var(--ease-out)] [transform:translateX(var(--madoo-segmented-indicator-x,0))]",
          indicator.ready && "opacity-100",
          variant === "minimal" && "hidden",
        )}
        aria-hidden="true"
      />
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
          className="relative z-10 cursor-pointer appearance-none whitespace-nowrap rounded-full border-0 bg-transparent px-3 py-1.5 font-[inherit] text-[12.5px] font-medium text-madoo-ink-muted transition-colors duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:text-madoo-ink aria-pressed:text-madoo-ink"
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
