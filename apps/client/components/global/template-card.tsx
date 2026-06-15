import { Icon, cx } from "@madoo/design-system";
import type { ReactNode } from "react";

type TemplateCardProps = {
  avatarLabel?: string;
  badge?: string;
  disabled?: boolean;
  menu?: ReactNode;
  onClick?: () => void;
  onToggleStar?: () => void;
  previewUrl?: string | null;
  starred?: boolean;
  subtitle?: string;
  title: string;
};

export default function TemplateCard({
  avatarLabel,
  badge,
  disabled,
  menu,
  onClick,
  onToggleStar,
  previewUrl,
  starred,
  subtitle,
  title,
}: TemplateCardProps) {
  const initials = (avatarLabel ?? title).trim().charAt(0).toUpperCase() || "M";
  const hasActions = Boolean(onToggleStar || menu);

  return (
    <article
      className={cx(
        "group min-w-0 text-left",
        disabled && "pointer-events-none opacity-70",
      )}
    >
      <button
        aria-label={title}
        className={cx(
          "block w-full min-w-0 cursor-pointer border-0 bg-transparent p-0 text-left disabled:cursor-not-allowed",
          !disabled && "focus-visible:outline-none",
        )}
        disabled={disabled}
        onClick={onClick}
        type="button"
      >
        <div className="relative flex aspect-4/5 min-h-52 items-center justify-center overflow-hidden rounded-lg bg-white shadow-[inset_0_0_0_0.5px_rgb(12_52_106/0.16)] transition-[box-shadow] duration-150 group-focus-within:shadow-[inset_0_0_0_1.5px_var(--accent)] group-hover:shadow-[inset_0_0_0_1px_rgb(12_52_106/0.22)]">
          {previewUrl ? (
            <img
              alt=""
              className="h-full w-full object-cover object-top"
              loading="lazy"
              src={previewUrl}
            />
          ) : (
            <Icon name="image" size={32} className="text-[#d8d3c7]" />
          )}
          {badge ? (
            <span className="absolute left-2 top-2 rounded-md bg-white/90 px-2 py-1 text-[11px] font-medium leading-none text-madoo-ink shadow-madoo-border backdrop-blur">
              {badge}
            </span>
          ) : null}
        </div>
      </button>

      <div className="mt-2.5 grid grid-cols-[28px_minmax(0,1fr)] items-start gap-1.5">
        <span className="inline-flex size-6 items-center justify-center rounded-full bg-[#7224aa] text-sm text-white">
          {initials}
        </span>
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-1.5">
            <button
              aria-label={title}
              className="min-w-0 flex-1 cursor-pointer border-0 bg-transparent p-0 text-left focus-visible:outline-none"
              disabled={disabled}
              onClick={onClick}
              type="button"
            >
              <h3 className="m-0 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium leading-[1.2] text-[#101114]">
                {title}
              </h3>
            </button>
            {hasActions ? (
              <div
                className={cx(
                  "flex shrink-0 items-center gap-1 opacity-0 transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100",
                  starred && "opacity-100",
                )}
              >
                {onToggleStar ? (
                  <button
                    aria-label={starred ? `Unstar ${title}` : `Star ${title}`}
                    aria-pressed={starred}
                    className={cx(
                      "grid size-7 cursor-pointer place-items-center rounded-md border-0 bg-white/90 p-0 text-madoo-ink-muted shadow-madoo-border transition-[background,color] hover:bg-white hover:text-amber-500 focus-visible:outline-none focus-visible:shadow-[var(--shadow-border-accent)]",
                      starred && "text-amber-500 [&_svg]:fill-current",
                    )}
                    disabled={disabled}
                    onClick={onToggleStar}
                    type="button"
                  >
                    <Icon name="star" size={13} />
                  </button>
                ) : null}
                {menu}
              </div>
            ) : null}
          </div>
          {subtitle ? (
            <p className="m-0 mt-1 overflow-hidden text-ellipsis whitespace-nowrap text-xs leading-none text-madoo-ink-muted">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
