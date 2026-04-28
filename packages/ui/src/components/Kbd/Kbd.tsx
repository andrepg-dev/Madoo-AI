import type { HTMLAttributes } from "react";
import { cx } from "../../lib/cx";
import "./Kbd.css";

export interface KbdProps extends HTMLAttributes<HTMLElement> {
  /** Tema sobre fondo oscuro (Botones primary, ink) */
  inverse?: boolean;
  size?: "md" | "lg";
}

export function Kbd({ inverse, size = "md", className, children, ...rest }: KbdProps) {
  return (
    <kbd
      className={cx(
        "madoo-kbd",
        inverse && "madoo-kbd--inverse",
        size === "lg" && "madoo-kbd--lg",
        className,
      )}
      {...rest}
    >
      {children}
    </kbd>
  );
}
