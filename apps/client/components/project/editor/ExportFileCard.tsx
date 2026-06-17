import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";

export function ExportFileCard({
  busy,
  description,
  disabled,
  icon,
  name,
  onClick,
}: {
  busy?: boolean;
  description: string;
  disabled?: boolean;
  icon: IconSvgElement;
  name: string;
  onClick?: () => void;
}) {
  return (
    <button
      className="flex min-h-18 cursor-pointer items-center gap-3 rounded-xl bg-white px-3 py-2.5 text-left shadow-madoo-border transition hover:bg-madoo-surface disabled:cursor-not-allowed disabled:opacity-60"
      disabled={disabled || busy}
      onClick={onClick}
      type="button"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-madoo-ink text-white">
        <HugeiconsIcon
          aria-hidden="true"
          icon={icon}
          primaryColor="currentColor"
          size={18}
          strokeWidth={1.7}
        />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-madoo-ink">
          {name}
        </span>
        <span className="mt-0.5 block truncate text-xs text-madoo-ink-muted">
          {busy ? "Working…" : description}
        </span>
      </span>
    </button>
  );
}
