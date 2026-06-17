import { cn } from "@/lib/utils";

export function ExportTabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={cn(
        "h-8 cursor-pointer rounded-lg px-3 text-xs font-medium transition",
        active
          ? "bg-white text-madoo-ink shadow-madoo-border"
          : "text-madoo-ink-muted hover:text-madoo-ink",
      )}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}
