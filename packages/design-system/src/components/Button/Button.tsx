import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cx } from "../../lib/cx";

export type ButtonVariant =
  | "primary"
  | "accent"
  | "secondary"
  | "ghost"
  | "icon"
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

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-madoo-ink text-madoo-accent-fg enabled:hover:bg-madoo-ink-soft disabled:bg-madoo-surface-2 disabled:text-madoo-ink-faint disabled:opacity-100",
  accent:
    "bg-madoo-accent text-madoo-accent-fg enabled:hover:bg-madoo-accent-deep disabled:bg-madoo-surface-2 disabled:text-madoo-ink-faint disabled:opacity-100",
  secondary:
    "bg-madoo-surface text-madoo-ink shadow-madoo-border enabled:hover:bg-madoo-bg",
  ghost:
    "bg-transparent text-madoo-ink-soft enabled:hover:bg-madoo-bg enabled:hover:text-madoo-ink",
  icon:
    "h-8 w-8 p-0! bg-transparent text-madoo-ink-soft enabled:hover:bg-madoo-bg enabled:hover:text-madoo-ink",
  dashed:
    "bg-transparent text-madoo-ink-faint shadow-madoo-border enabled:hover:bg-madoo-bg enabled:hover:text-madoo-ink-soft",
  danger:
    "bg-madoo-danger text-white enabled:hover:bg-[#87311f]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "gap-1.5 px-2.5 py-1.5 text-[12.5px]",
  md: "px-3.5 py-2 text-[13.5px]",
  lg: "px-4 py-2.5 text-[13.5px]",
};

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
        "inline-flex cursor-pointer select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg border-0 font-madoo-sans font-medium leading-none no-underline transition-[background,color,box-shadow,opacity] duration-(--duration-fast) ease-out disabled:cursor-not-allowed disabled:opacity-60 aria-disabled:cursor-not-allowed aria-disabled:opacity-60",
        variantClasses[variant],
        sizeClasses[size],
        block && "w-full",
        className,
      )}
      {...rest}
    >
      {leftIcon}
      {children}
      {rightIcon}
      {shortcut ? (
        <kbd
          className={cx(
            "ml-1 inline-flex h-5.5 w-5.5 shrink-0 items-center justify-center whitespace-nowrap rounded-sm bg-white/10 font-madoo-mono text-[10.5px] font-medium leading-none text-inherit",
            ["secondary", "ghost", "dashed"].includes(variant) &&
              "bg-madoo-bg-2 text-madoo-ink-soft shadow-madoo-border",
          )}
        >
          {shortcut}
        </kbd>
      ) : null}
    </button>
  );
});
