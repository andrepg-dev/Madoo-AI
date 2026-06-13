import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cx } from "../../lib/cx";

export type IconButtonVariant = "soft" | "solid" | "outline" | "ghost" | "accent";
export type IconButtonSize = "sm" | "md" | "lg";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Texto descriptivo obligatorio para accesibilidad */
  "aria-label": string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  /** Contenido (normalmente <Icon />) */
  children: ReactNode;
}

const variantClasses: Record<IconButtonVariant, string> = {
  soft: "bg-madoo-surface-2 text-madoo-ink-soft enabled:hover:bg-madoo-surface enabled:hover:text-madoo-ink",
  solid: "bg-madoo-ink text-madoo-accent-fg enabled:hover:bg-madoo-ink-soft",
  outline:
    "bg-madoo-surface text-madoo-ink-soft shadow-madoo-border enabled:hover:bg-madoo-surface-2 enabled:hover:text-madoo-ink",
  ghost: "bg-transparent text-madoo-ink-soft enabled:hover:bg-madoo-surface-2 enabled:hover:text-madoo-ink",
  accent:
    "bg-madoo-accent text-madoo-accent-fg enabled:hover:bg-madoo-accent-deep",
};

const sizeClasses: Record<IconButtonSize, string> = {
  sm: "h-7 w-7",
  md: "h-8 w-8",
  lg: "h-10 w-10",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    {
      variant = "soft",
      size = "md",
      className,
      type = "button",
      children,
      ...rest
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={cx(
          "inline-flex cursor-pointer items-center justify-center rounded-lg border-0 transition-[background,color,box-shadow] duration-(--duration-fast) ease-out disabled:cursor-not-allowed disabled:opacity-60",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...rest}
      >
        {children}
      </button>
    );
  },
);
