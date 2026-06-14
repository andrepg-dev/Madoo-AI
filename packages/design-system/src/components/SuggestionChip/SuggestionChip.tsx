import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cx } from "../../lib/cx";

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
        "inline-flex cursor-pointer items-center gap-1.5 rounded-full border-0 px-3 py-1.75 font-madoo-sans text-[12.5px] transition-[background,color,box-shadow] duration-(--duration-fast) ease-out",
        variant === "accent"
          ? "bg-madoo-accent-soft text-madoo-accent-deep shadow-(--shadow-border-rule) hover:bg-madoo-accent hover:text-madoo-accent-fg hover:shadow-(--shadow-border-rule-hover)"
          : "bg-madoo-surface text-madoo-ink-soft shadow-madoo-border hover:bg-madoo-surface-2 hover:text-madoo-ink",
        pressed && "bg-madoo-ink text-madoo-accent-fg shadow-(--shadow-border-ink)",
        className,
      )}
      {...rest}
    >
      {leadingIcon}
      {children}
    </button>
  );
});
