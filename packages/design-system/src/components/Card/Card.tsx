import {
  forwardRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cx } from "../../lib/cx";

export type CardSize = "md" | "lg";

interface BaseCardProps {
  size?: CardSize;
  surface?: "primary" | "secondary";
  padded?: boolean;
}

const cardBase =
  "rounded-lg bg-madoo-surface p-4 font-madoo-sans text-madoo-ink shadow-madoo-border transition-[background,box-shadow] duration-(--duration-fast) ease-out";

export interface CardProps
  extends BaseCardProps,
    HTMLAttributes<HTMLDivElement> {}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { size = "md", surface = "primary", padded, className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cx(
        cardBase,
        size === "lg" && "rounded-lg",
        surface === "secondary" && "bg-madoo-surface-2",
        padded && "p-5.5",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
});

export interface SelectableCardProps
  extends BaseCardProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, "title"> {
  selected?: boolean;
  title?: ReactNode;
  description?: ReactNode;
}

export const SelectableCard = forwardRef<HTMLButtonElement, SelectableCardProps>(
  function SelectableCard(
    {
      size = "md",
      surface = "primary",
      padded,
      selected,
      title,
      description,
      className,
      children,
      type = "button",
      ...rest
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        aria-pressed={selected}
        className={cx(
          cardBase,
          "cursor-pointer appearance-none text-left hover:shadow-(--shadow-border-rule-hover) focus-visible:outline-none focus-visible:shadow-(--shadow-border-rule-hover)",
          size === "lg" && "rounded-lg",
          surface === "secondary" && "bg-madoo-surface-2",
          padded && "p-5.5",
          selected &&
            "bg-madoo-surface-2 shadow-[inset_0_0_0_0.5px_rgb(var(--rule-rgb)/0.34)] hover:shadow-[inset_0_0_0_0.5px_rgb(var(--rule-rgb)/0.34)] focus-visible:shadow-[inset_0_0_0_0.5px_rgb(var(--rule-rgb)/0.34)]",
          className,
        )}
        {...rest}
      >
        {title ? <div className="mb-1.5 text-[14px] font-medium">{title}</div> : null}
        {description ? (
          <p className="m-0 text-[12.5px] leading-[1.5] text-madoo-ink-faint">
            {description}
          </p>
        ) : null}
        {children}
      </button>
    );
  },
);
