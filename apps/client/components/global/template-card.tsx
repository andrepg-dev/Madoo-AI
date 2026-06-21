import { Icon, cx } from "@madoo/design-system";
import { useState, type ReactNode } from "react";

type TemplateCardProps = {
  badge?: string;
  disabled?: boolean;
  masonryIndex?: number;
  menu?: ReactNode;
  onClick?: () => void;
  onToggleStar?: () => void;
  previewUrl?: string | null;
  starred?: boolean;
  subtitle?: string;
  title: string;
};

// Default tile heights (height / width) used before the preview image loads,
// kept varied so the masonry stays lively while previews stream in. These
// mirror `templateMasonryWeights` in the gallery so column balancing matches.
const defaultHeightRatios = [1.25, 1.4, 1.33, 1.43, 1.5] as const;
// Once the real screenshot loads we size the tile to its true aspect ratio so a
// long email reads as a long card instead of being squeezed into a short box.
// Clamp the extremes so a near-landscape email stays usable and an unusually
// long one doesn't dominate its column (its top is shown via object-cover).
const MIN_HEIGHT_RATIO = 0.6;
const MAX_HEIGHT_RATIO = 2.3;

function clampHeightRatio(ratio: number): number {
  return Math.min(MAX_HEIGHT_RATIO, Math.max(MIN_HEIGHT_RATIO, ratio));
}

export default function TemplateCard({
  badge,
  disabled,
  masonryIndex,
  menu,
  onClick,
  onToggleStar,
  previewUrl,
  starred,
  subtitle,
  title,
}: TemplateCardProps) {
  const hasActions = Boolean(onToggleStar || menu);
  const defaultHeightRatio =
    typeof masonryIndex === "number"
      ? defaultHeightRatios[masonryIndex % defaultHeightRatios.length]
      : 1.25;
  const [heightRatio, setHeightRatio] = useState<number>(defaultHeightRatio);

  return (
    <article
      className={cx(
        // max-w caps the card so the masonry still decides its real width but a
        // sparse grid never stretches a card across the column. Matches the
        // landing gallery cards.
        "group w-full min-w-0 max-w-62 text-left",
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
        <div
          className="relative flex items-center justify-center overflow-hidden rounded-lg bg-white shadow-[inset_0_0_0_0.5px_rgb(12_52_106/0.16)] transition-[box-shadow] duration-150 group-focus-within:shadow-[inset_0_0_0_1.5px_var(--accent)] group-hover:shadow-[inset_0_0_0_1px_rgb(12_52_106/0.22)]"
          style={{ aspectRatio: 1 / heightRatio }}
        >
          {previewUrl ? (
            <img
              alt=""
              className="h-full w-full object-cover object-top"
              loading="lazy"
              onLoad={(event) => {
                const { naturalWidth, naturalHeight } = event.currentTarget;
                if (naturalWidth > 0 && naturalHeight > 0) {
                  setHeightRatio(
                    clampHeightRatio(naturalHeight / naturalWidth),
                  );
                }
              }}
              src={previewUrl}
            />
          ) : (
            <Icon name="message" size={32} className="text-[#d8d3c7]" />
          )}
          {badge ? (
            <span className="absolute left-2 top-2 rounded-md bg-white/90 px-2 py-1 text-[11px] font-medium leading-none text-madoo-ink shadow-madoo-border backdrop-blur">
              {badge}
            </span>
          ) : null}
        </div>
      </button>

      <div className="mt-2.5 min-w-0">
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
    </article>
  );
}
