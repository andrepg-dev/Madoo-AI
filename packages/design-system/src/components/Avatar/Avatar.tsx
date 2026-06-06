import type { HTMLAttributes } from "react";
import { cx } from "../../lib/cx";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";
export type AvatarTone = "accent" | "ink" | "surface";

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  /** Nombre completo o iniciales — el componente extrae las iniciales */
  name?: string;
  /** URL de la imagen (toma prioridad sobre `name`) */
  src?: string;
  alt?: string;
  size?: AvatarSize;
  tone?: AvatarTone;
  /** Forma circular en lugar de squircle */
  circle?: boolean;
}

function getInitials(name?: string) {
  if (!name) return "?";
  return name[0];
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: "h-[22px] w-[22px] text-[11px]",
  sm: "h-6.5 w-6.5 ml-[1px] text-[13px]",
  md: "h-8 w-8 text-[15px]",
  lg: "h-11 w-11 text-[22px]",
  xl: "h-16 w-16 text-[28px]",
};

const toneClasses: Record<AvatarTone, string> = {
  accent: "bg-madoo-accent text-madoo-accent-fg",
  ink: "bg-madoo-ink text-madoo-accent-fg",
  surface: "bg-madoo-surface-2 text-madoo-ink",
};

export function Avatar({
  name,
  src,
  alt,
  size = "md",
  tone = "accent",
  circle,
  className,
  children,
  ...rest
}: AvatarProps) {
  return (
    <div
      className={cx(
        "inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-[7.5px] font-madoo-display font-medium uppercase not-italic",
        sizeClasses[size],
        toneClasses[tone],
        circle && "rounded-full",
        className,
      )}
      role={src ? "img" : undefined}
      aria-label={src ? alt ?? name : undefined}
      {...rest}
    >
      {src ? (
        <img className="h-full w-full object-cover" src={src} alt={alt ?? name ?? ""} />
      ) : (
        children ?? getInitials(name)
      )}
    </div>
  );
}
