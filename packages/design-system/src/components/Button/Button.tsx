import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cx } from "../../lib/cx";
import "./Button.css";

export type ButtonVariant =
  | "primary"
  | "accent"
  | "secondary"
  | "ghost"
  | "dashed"
  | "danger";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Icono o nodo a la izquierda del label */
  leftIcon?: ReactNode;
  /** Icono o nodo a la derecha del label */
  rightIcon?: ReactNode;
  /** Tecla a mostrar al final del boton (estilo "↵" en Generate) */
  shortcut?: ReactNode;
  /** Hace el boton ocupar todo el ancho disponible */
  block?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "lg",
    leftIcon,
    rightIcon,
    shortcut,
    block,
    children,
    className,
    type = "button",
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx(
        "madoo-btn",
        `madoo-btn--${variant}`,
        `madoo-btn--${size}`,
        block && "madoo-btn--block",
        className,
      )}
      {...rest}
    >
      {leftIcon}
      {children}
      {rightIcon}
      {shortcut ? <kbd className="madoo-btn__kbd">{shortcut}</kbd> : null}
    </button>
  );
});
