import { Download01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export function ExportProviderCard({
  badge,
  busy,
  disabled,
  iconSrc,
  name,
  onClick,
}: {
  badge?: string;
  busy?: boolean;
  disabled?: boolean;
  iconSrc: string;
  name: string;
  onClick?: () => void;
}) {
  return (
    <button
      className="relative flex min-h-18 cursor-pointer items-center gap-3 rounded-xl bg-white px-3 py-2.5 text-left shadow-madoo-border transition hover:bg-madoo-surface disabled:cursor-not-allowed disabled:opacity-60"
      disabled={disabled || busy}
      onClick={onClick}
      type="button"
    >
      {badge ? (
        <span className="absolute right-2.5 top-2.5 text-madoo-accent">
          <HugeiconsIcon
            aria-hidden="true"
            icon={Download01Icon}
            primaryColor="currentColor"
            size={15}
            strokeWidth={1.7}
          />
        </span>
      ) : null}
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-madoo-surface">
        <img
          alt=""
          className="size-6 object-contain"
          loading="lazy"
          src={iconSrc}
        />
      </span>
      <span className="min-w-0 truncate text-sm font-medium text-madoo-ink">
        {busy ? "Working…" : name}
      </span>
    </button>
  );
}
