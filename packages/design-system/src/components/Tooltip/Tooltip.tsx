import {
  cloneElement,
  forwardRef,
  isValidElement,
  useId,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { cx } from "../../lib/cx";
import "./Tooltip.css";

export type TooltipSide = "top" | "right" | "bottom" | "left";
export type TooltipAlign = "start" | "center" | "end";
export type TooltipTone = "ink" | "light" | "accent";

export interface TooltipProps extends Omit<
  HTMLAttributes<HTMLSpanElement>,
  "content"
> {
  content: ReactNode;
  children: ReactElement;
  side?: TooltipSide;
  align?: TooltipAlign;
  tone?: TooltipTone;
  disabled?: boolean;
}

export const Tooltip = forwardRef<HTMLSpanElement, TooltipProps>(
  function Tooltip(
    {
      content,
      children,
      side = "top",
      align = "center",
      tone = "ink",
      disabled,
      className,
      ...rest
    },
    ref,
  ) {
    const generatedId = useId();
    const tooltipId = `${generatedId}-tooltip`;
    const shouldRenderTooltip = !disabled && Boolean(content);

    const trigger = isValidElement(children)
      ? cloneElement(children, {
          "aria-describedby": shouldRenderTooltip
            ? [
                (children.props as { "aria-describedby"?: string })[
                  "aria-describedby"
                ],
                tooltipId,
              ]
                .filter(Boolean)
                .join(" ")
            : undefined,
        } as Partial<ReactElement["props"]>)
      : children;

    return (
      <span
        ref={ref}
        className={cx("madoo-tooltip", className)}
        data-side={side}
        data-align={align}
        data-tone={tone}
        data-disabled={disabled ? "true" : undefined}
        {...rest}
      >
        {trigger}
        {shouldRenderTooltip ? (
          <span
            id={tooltipId}
            role="tooltip"
            className="madoo-tooltip__content"
          >
            {content}
            <span className="madoo-tooltip__arrow" aria-hidden="true" />
          </span>
        ) : null}
      </span>
    );
  },
);
