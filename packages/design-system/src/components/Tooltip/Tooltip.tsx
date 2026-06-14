import {
  cloneElement,
  forwardRef,
  isValidElement,
  useState,
  useId,
  type HTMLAttributes,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { cx } from "../../lib/cx";

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

const toneClasses: Record<TooltipTone, string> = {
  ink: "bg-madoo-ink text-madoo-accent-fg shadow-(--shadow-border-ink) [--tooltip-bg:var(--ink)]",
  light:
    "bg-madoo-surface text-madoo-ink-soft shadow-madoo-border [--tooltip-bg:var(--surface)]",
  accent:
    "bg-madoo-accent text-madoo-accent-fg shadow-(--shadow-border-accent) [--tooltip-bg:var(--accent)]",
};

const sideClasses: Record<TooltipSide, string> = {
  top: "bottom-[calc(100%+10px)]",
  bottom: "top-[calc(100%+10px)]",
  left: "right-[calc(100%+10px)]",
  right: "left-[calc(100%+10px)]",
};

function alignClasses(side: TooltipSide, align: TooltipAlign) {
  if (side === "top" || side === "bottom") {
    if (align === "start") return "left-0";
    if (align === "end") return "right-0";
    return "left-1/2 -translate-x-1/2";
  }

  if (align === "start") return "top-0";
  if (align === "end") return "bottom-0";
  return "top-1/2 -translate-y-1/2";
}

function arrowClasses(side: TooltipSide, align: TooltipAlign) {
  if (side === "top") {
    if (align === "start") return "-bottom-1 left-3";
    if (align === "end") return "-bottom-1 right-3";
    return "-bottom-1 left-[calc(50%-4px)]";
  }
  if (side === "bottom") {
    if (align === "start") return "-top-1 left-3";
    if (align === "end") return "-top-1 right-3";
    return "-top-1 left-[calc(50%-4px)]";
  }
  if (side === "left") {
    if (align === "start") return "right-[-4px] top-2.5";
    if (align === "end") return "bottom-2.5 right-[-4px]";
    return "right-[-4px] top-[calc(50%-4px)]";
  }
  if (align === "start") return "left-[-4px] top-2.5";
  if (align === "end") return "bottom-2.5 left-[-4px]";
  return "left-[-4px] top-[calc(50%-4px)]";
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
      onBlur,
      onMouseLeave,
      ...rest
    },
    ref,
  ) {
    const generatedId = useId();
    const [dismissed, setDismissed] = useState(false);
    const tooltipId = `${generatedId}-tooltip`;
    const shouldRenderTooltip = !disabled && Boolean(content) && !dismissed;

    const trigger = isValidElement(children)
      ? cloneElement(children, {
          onClick: (event: MouseEvent<HTMLElement>) => {
            setDismissed(true);
            (
              children.props as {
                onClick?: (event: MouseEvent<HTMLElement>) => void;
              }
            ).onClick?.(event);
          },
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
        className={cx(
          "group relative inline-flex w-max max-w-full align-middle",
          className,
        )}
        data-side={side}
        data-align={align}
        data-tone={tone}
        data-disabled={disabled ? "true" : undefined}
        onBlur={(event) => {
          setDismissed(false);
          onBlur?.(event);
        }}
        onMouseLeave={onMouseLeave}
        {...rest}
      >
        {trigger}
        {shouldRenderTooltip ? (
          <span
            id={tooltipId}
            role="tooltip"
            className={cx(
              "invisible pointer-events-none absolute z-[var(--z-popover)] inline-flex w-max max-w-[min(280px,calc(100vw-32px))] origin-center scale-[0.98] items-center rounded-lg px-2.5 py-1.75 text-left font-madoo-sans text-[12.5px] font-medium leading-[1.35] whitespace-normal opacity-0 transition-[opacity,visibility,transform] duration-150 ease-out group-hover:visible group-hover:scale-100 group-hover:opacity-100 group-focus-within:visible group-focus-within:scale-100 group-focus-within:opacity-100",
              toneClasses[tone],
              sideClasses[side],
              alignClasses(side, align),
            )}
          >
            {content}
            <span
              className={cx(
                "absolute -z-10 h-2 w-2 rotate-45 bg-(--tooltip-bg) opacity-0 shadow-[inherit] transition-[opacity,transform] duration-150 ease-out group-hover:opacity-100 group-focus-within:opacity-100",
                arrowClasses(side, align),
              )}
              aria-hidden="true"
            />
          </span>
        ) : null}
      </span>
    );
  },
);
