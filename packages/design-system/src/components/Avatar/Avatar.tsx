import type { HTMLAttributes } from "react";
import { cx } from "../../lib/cx";
import "./Avatar.css";

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
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]).join("");
}

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
        "madoo-avatar",
        `madoo-avatar--${size}`,
        tone !== "accent" && `madoo-avatar--${tone}`,
        circle && "madoo-avatar--circle",
        className,
      )}
      role={src ? "img" : undefined}
      aria-label={src ? alt ?? name : undefined}
      {...rest}
    >
      {src ? <img src={src} alt={alt ?? name ?? ""} /> : children ?? getInitials(name)}
    </div>
  );
}
