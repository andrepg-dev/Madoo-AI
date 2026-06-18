import {
  forwardRef,
  useId,
  type TextareaHTMLAttributes,
} from "react";
import { cx } from "../../lib/cx";

export type TextareaVariant = "default" | "filled" | "ghost";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  variant?: TextareaVariant;
  /** Desactiva el resize vertical nativo */
  noResize?: boolean;
}

const fieldClasses = "flex flex-col gap-1.5 font-madoo-sans";
const labelClasses =
  "text-[11px] font-medium uppercase tracking-[0.3px] text-madoo-ink-faint";
const hintClasses = "text-[11.5px] leading-[1.4] text-madoo-ink-faint";

const wrapperVariantClasses: Record<TextareaVariant, string> = {
  default: "bg-madoo-surface shadow-madoo-border",
  filled: "bg-madoo-surface-2 shadow-madoo-border",
  ghost: "bg-transparent shadow-none focus-within:shadow-none",
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    {
      id,
      label,
      hint,
      error,
      variant = "default",
      noResize,
      className,
      rows = 3,
      ...rest
    },
    ref,
  ) {
    const reactId = useId();
    const taId = id ?? reactId;
    const describedBy = error ? `${taId}-error` : hint ? `${taId}-hint` : undefined;

    return (
      <div className={fieldClasses}>
        {label ? (
          <label htmlFor={taId} className={labelClasses}>
            {label}
          </label>
        ) : null}
        <div
          className={cx(
            "relative flex rounded-lg transition-[box-shadow] duration-(--duration-fast) ease-out focus-within:shadow-(--shadow-border-accent)",
            wrapperVariantClasses[variant],
            error && "shadow-(--shadow-border-danger)",
            className,
          )}
        >
          <textarea
            id={taId}
            ref={ref}
            data-madoo-control="true"
            rows={rows}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={cx(
              "min-h-24 w-full flex-1 resize-y border-0 bg-transparent px-3.5 py-3 font-[inherit] text-[14px] leading-[1.55] text-madoo-ink outline-none focus-visible:outline-none",
              noResize && "resize-none",
            )}
            {...rest}
          />
        </div>
        {error ? (
          <span id={`${taId}-error`} className={cx(hintClasses, "text-madoo-danger")}>
            {error}
          </span>
        ) : hint ? (
          <span id={`${taId}-hint`} className={hintClasses}>
            {hint}
          </span>
        ) : null}
      </div>
    );
  },
);
