import { Icon, cx } from "@madoo/design-system";

type TemplateCardProps = {
  avatarLabel?: string;
  badge?: string;
  disabled?: boolean;
  onClick?: () => void;
  previewUrl?: string | null;
  subtitle?: string;
  title: string;
};

export default function TemplateCard({
  avatarLabel,
  badge,
  disabled,
  onClick,
  previewUrl,
  subtitle,
  title,
}: TemplateCardProps) {
  const initials = (avatarLabel ?? title).trim().charAt(0).toUpperCase() || "M";

  return (
    <button
      aria-label={title}
      className={cx(
        "group min-w-0 cursor-pointer border-0 bg-transparent p-0 text-left disabled:cursor-not-allowed disabled:opacity-70",
        !disabled && "focus-visible:outline-none",
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <div className="relative flex aspect-4/5 min-h-52 items-center justify-center overflow-hidden rounded-lg bg-white shadow-[inset_0_0_0_0.5px_rgb(12_52_106/0.16)] transition-[box-shadow,transform] duration-150 group-enabled:group-hover:-translate-y-0.5 group-enabled:group-hover:shadow-[inset_0_0_0_0.5px_rgb(12_52_106/0.18),0_12px_28px_rgb(16_24_40/0.08)] group-focus-visible:shadow-[inset_0_0_0_1.5px_var(--accent)]">
        {previewUrl ? (
          <img
            alt=""
            className="h-full w-full object-cover"
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

      <div className="mt-2.5 grid grid-cols-[28px_minmax(0,1fr)] items-start gap-1.5">
        <span className="inline-flex size-6 items-center justify-center rounded-full bg-[#7224aa] text-sm text-white">
          {initials}
        </span>
        <div className="min-w-0">
          <h3 className="m-0 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium leading-[1.2] text-[#101114]">
            {title}
          </h3>
          {subtitle ? (
            <p className="m-0 mt-1 overflow-hidden text-ellipsis whitespace-nowrap text-xs leading-none text-madoo-ink-muted">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
    </button>
  );
}
