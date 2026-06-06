import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "../../lib/cx";
import { Icon } from "../Icon";

export type BannerTone = "accent" | "info" | "success" | "warn" | "danger";

export interface BannerProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  tone?: BannerTone;
  title?: ReactNode;
  icon?: ReactNode;
}

const toneClasses: Record<BannerTone, string> = {
  accent: "bg-madoo-accent-soft text-madoo-accent-deep",
  info: "bg-madoo-info-soft text-madoo-info",
  success: "bg-madoo-success-soft text-madoo-success",
  warn: "bg-madoo-warn-soft text-madoo-warn",
  danger: "bg-madoo-danger-soft text-madoo-danger",
};

const iconToneClasses: Record<BannerTone, string> = {
  accent: "bg-madoo-accent text-madoo-accent-fg",
  info: "bg-madoo-info text-madoo-info-soft",
  success: "bg-madoo-success text-madoo-success-soft",
  warn: "bg-madoo-warn text-madoo-warn-soft",
  danger: "bg-madoo-danger text-madoo-danger-soft",
};

export function Banner({
  tone = "accent",
  title,
  icon,
  className,
  children,
  ...rest
}: BannerProps) {
  const fallbackIcon = icon ?? <Icon name="sparkle" size={13} />;
  return (
    <div
      role="status"
      className={cx(
        "flex items-start gap-2.5 rounded-[var(--radius-lg)] p-3 font-madoo-sans text-[12.5px] leading-[1.5]",
        toneClasses[tone],
        className,
      )}
      {...rest}
    >
      <div
        className={cx(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-lg)]",
          iconToneClasses[tone],
        )}
        aria-hidden="true"
      >
        {fallbackIcon}
      </div>
      <div className="min-w-0 flex-1">
        {title ? <div className="mb-0.5 font-medium">{title}</div> : null}
        <div>{children}</div>
      </div>
    </div>
  );
}
