import type { HTMLAttributes } from "react";
import { cx } from "../../lib/cx";

export interface KbdProps extends HTMLAttributes<HTMLElement> {
  /** Tema sobre fondo oscuro (Botones primary, ink) */
  inverse?: boolean;
  size?: "md" | "lg";
}

export function Kbd({ inverse, size = "md", className, children, ...rest }: KbdProps) {
  return (
    <kbd
      className={cx(
        "inline-flex h-6 w-6 shrink-0 items-center justify-center whitespace-nowrap rounded-[var(--radius-sm)] bg-madoo-bg-2 font-madoo-mono text-[10.5px] font-medium leading-none text-madoo-ink-soft shadow-[var(--shadow-border)]",
        inverse &&
          "bg-white/15 text-inherit shadow-[inset_0_0_0_0.5px_rgb(255_255_255_/_0.22)]",
        size === "lg" && "h-7 w-7 text-xs",
        className,
      )}
      {...rest}
    >
      {children}
    </kbd>
  );
}
