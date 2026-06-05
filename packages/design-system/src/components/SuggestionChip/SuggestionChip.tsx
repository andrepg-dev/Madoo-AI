import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cx } from "../../lib/cx";
import "./SuggestionChip.css";

export interface SuggestionChipProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "accent";
  pressed?: boolean;
  leadingIcon?: ReactNode;
}

export const SuggestionChip = forwardRef<
  HTMLButtonElement,
  SuggestionChipProps
>(function SuggestionChip(
  { variant = "default", pressed, leadingIcon, className, children, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-pressed={pressed}
      className={cx(
        "madoo-chip",
        variant === "accent" && "madoo-chip--accent",
        className,
      )}
      {...rest}
    >
      {leadingIcon}
      {children}
    </button>
  );
});
