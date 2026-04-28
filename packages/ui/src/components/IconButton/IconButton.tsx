import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cx } from "../../lib/cx";
import "./IconButton.css";

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
          "madoo-icon-btn",
          variant !== "soft" && `madoo-icon-btn--${variant}`,
          `madoo-icon-btn--${size}`,
          className,
        )}
        {...rest}
      >
        {children}
      </button>
    );
  },
);
