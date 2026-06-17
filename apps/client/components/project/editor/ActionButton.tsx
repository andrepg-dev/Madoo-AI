import { Button } from "@madoo/design-system";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { cn } from "@/lib/utils";

export function ActionButton({
  icon,
  label,
  onClick,
  selected = false,
}: {
  icon: IconSvgElement;
  label: string;
  onClick?: () => void;
  selected?: boolean;
}) {
  return (
    <Button
      aria-label={label}
      aria-pressed={selected}
      className={cn(
        "h-6 w-6 rounded-md",
        selected && "bg-white text-madoo-ink shadow-madoo-border",
      )}
      onClick={onClick}
      variant="icon"
      size="sm"
    >
      <HugeiconsIcon
        aria-hidden="true"
        icon={icon}
        primaryColor="currentColor"
        size={13}
        strokeWidth={1.5}
      />
    </Button>
  );
}
