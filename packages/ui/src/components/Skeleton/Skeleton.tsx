import type { CSSProperties, HTMLAttributes } from "react";
import { cx } from "../../lib/cx";
import "./Skeleton.css";

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
        "madoo-skeleton",
        variant === "text" && "madoo-skeleton--text",
        variant === "circle" && "madoo-skeleton--circle",
        className,
      )}
      style={finalStyle}
      {...rest}
    />
  );
}
