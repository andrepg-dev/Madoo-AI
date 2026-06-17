import type { CSSProperties } from "react";
import { Button } from "@madoo/design-system";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { cn } from "@/lib/utils";

export function HeaderPillButton({
  children,
  className,
  leftIcon,
  label,
  onClick,
  style,
}: {
  children: string;
  className?: string;
  leftIcon?: IconSvgElement;
  label: string;
  onClick?: () => void;
  style?: CSSProperties;
}) {
  return (
    <Button
      aria-label={label}
      className={cn(
        "h-7 rounded-full px-3 text-xs font-medium shadow-madoo-border",
        className,
      )}
      onClick={onClick}
      size="sm"
      style={style}
      variant="secondary"
    >
      {leftIcon ? (
        <HugeiconsIcon
          aria-hidden="true"
          icon={leftIcon}
          primaryColor="currentColor"
          size={15}
          strokeWidth={1.55}
        />
      ) : null}
      <span>{children}</span>
    </Button>
  );
}
