import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { cx } from "../../lib/cx";
import "./Input.css";

export type InputSize = "sm" | "md" | "lg";
export type InputVariant = "default" | "filled" | "ghost";

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  hint?: string;
  error?: string;
  /** Adorno a la izquierda (icono / prefijo) */
  startAdornment?: ReactNode;
  /** Adorno a la derecha (icono / sufijo) */
  endAdornment?: ReactNode;
  inputSize?: InputSize;
  variant?: InputVariant;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    id,
    label,
    hint,
    error,
    startAdornment,
    endAdornment,
    inputSize = "md",
    variant = "default",
    className,
    ...rest
  },
  ref,
) {
  const reactId = useId();
  const inputId = id ?? reactId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className="madoo-field">
      {label ? (
        <label htmlFor={inputId} className="madoo-field__label">
          {label}
        </label>
      ) : null}
      <div
        className={cx(
          "madoo-input-wrapper",
          variant !== "default" && `madoo-input-wrapper--${variant}`,
          `madoo-input-wrapper--${inputSize}`,
          error && "madoo-input-wrapper--invalid",
          className,
        )}
      >
        {startAdornment ? (
          <span className="madoo-input__addon">{startAdornment}</span>
        ) : null}
        <input
          id={inputId}
          ref={ref}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="madoo-input"
          {...rest}
        />
        {endAdornment ? (
          <span className="madoo-input__addon madoo-input__addon--right">
            {endAdornment}
          </span>
        ) : null}
      </div>
      {error ? (
        <span id={`${inputId}-error`} className="madoo-field__hint madoo-field__hint--error">
          {error}
        </span>
      ) : hint ? (
        <span id={`${inputId}-hint`} className="madoo-field__hint">
          {hint}
        </span>
      ) : null}
    </div>
  );
});
