import {
  forwardRef,
  useId,
  type TextareaHTMLAttributes,
} from "react";
import { cx } from "../../lib/cx";
import "./Textarea.css";

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
      <div className="madoo-field">
        {label ? (
          <label htmlFor={taId} className="madoo-field__label">
            {label}
          </label>
        ) : null}
        <div
          className={cx(
            "madoo-textarea-wrapper",
            variant !== "default" && `madoo-textarea-wrapper--${variant}`,
            error && "madoo-textarea-wrapper--invalid",
            className,
          )}
        >
          <textarea
            id={taId}
            ref={ref}
            rows={rows}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={cx("madoo-textarea", noResize && "madoo-textarea--no-resize")}
            {...rest}
          />
        </div>
        {error ? (
          <span id={`${taId}-error`} className="madoo-field__hint madoo-field__hint--error">
            {error}
          </span>
        ) : hint ? (
          <span id={`${taId}-hint`} className="madoo-field__hint">
            {hint}
          </span>
        ) : null}
      </div>
    );
  },
);
