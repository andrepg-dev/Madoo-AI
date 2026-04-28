import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "../../lib/cx";
import { Icon } from "../Icon";
import "./Banner.css";

export type BannerTone = "accent" | "info" | "success" | "warn" | "danger";

export interface BannerProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  tone?: BannerTone;
  title?: ReactNode;
  icon?: ReactNode;
}

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
        "madoo-banner",
        tone !== "accent" && `madoo-banner--${tone}`,
        className,
      )}
      {...rest}
    >
      <div className="madoo-banner__icon" aria-hidden="true">
        {fallbackIcon}
      </div>
      <div className="madoo-banner__body">
        {title ? <div className="madoo-banner__title">{title}</div> : null}
        <div>{children}</div>
      </div>
    </div>
  );
}
