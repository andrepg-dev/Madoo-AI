import type { CSSProperties, HTMLAttributes } from "react";
import { cx } from "../../lib/cx";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "block" | "text" | "circle";
  width?: number | string;
  height?: number | string;
}

export function Skeleton({
  variant = "block",
  width,
  height,
  className,
  style,
  ...rest
}: SkeletonProps) {
  const finalStyle: CSSProperties = {
    ...(width !== undefined ? { width } : null),
    ...(height !== undefined ? { height } : null),
    ...style,
  };
  return (
    <div
      aria-hidden="true"
      className={cx(
        "block w-full animate-madoo-skeleton-shimmer rounded-lg bg-[linear-gradient(90deg,var(--surface-2,rgba(0,0,0,0.05))_0%,var(--surface-3,rgba(0,0,0,0.08))_50%,var(--surface-2,rgba(0,0,0,0.05))_100%)] bg-[length:200%_100%] motion-reduce:animate-none motion-reduce:opacity-70",
        variant === "text" && "h-3",
        variant === "circle" && "rounded-full",
        className,
      )}
      style={finalStyle}
      {...rest}
    />
  );
}
