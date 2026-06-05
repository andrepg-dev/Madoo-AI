import {
  forwardRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { cx } from "../../lib/cx";
import "./Card.css";

export type CardSize = "md" | "lg";

interface BaseCardProps {
  size?: CardSize;
  surface?: "primary" | "secondary";
  padded?: boolean;
}

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
        "madoo-card",
        size === "lg" && "madoo-card--lg",
        surface === "secondary" && "madoo-card--surface-2",
        padded && "madoo-card--padded",
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
          "madoo-card",
          "madoo-card--interactive",
          size === "lg" && "madoo-card--lg",
          surface === "secondary" && "madoo-card--surface-2",
          padded && "madoo-card--padded",
          selected && "madoo-card--selected",
          className,
        )}
        {...rest}
      >
        {title ? <div className="madoo-card__title">{title}</div> : null}
        {description ? (
          <p className="madoo-card__description">{description}</p>
        ) : null}
        {children}
      </button>
    );
  },
);
