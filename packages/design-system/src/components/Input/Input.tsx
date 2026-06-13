import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { cx } from "../../lib/cx";

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

const fieldClasses = "flex flex-col gap-1.5 font-madoo-sans";
const labelClasses =
  "text-[11px] font-medium uppercase tracking-[0.3px] text-madoo-ink-faint";
const hintClasses = "text-[11.5px] leading-[1.4] text-madoo-ink-faint";

const wrapperSizeClasses: Record<InputSize, string> = {
  sm: "h-7",
  md: "h-8.5",
  lg: "h-10",
};

const wrapperVariantClasses: Record<InputVariant, string> = {
  default: "bg-madoo-surface shadow-madoo-border",
  filled: "bg-madoo-surface-2 shadow-madoo-border",
  ghost: "bg-transparent shadow-none focus-within:shadow-none",
};

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
    <div className={fieldClasses}>
      {label ? (
        <label htmlFor={inputId} className={labelClasses}>
          {label}
        </label>
      ) : null}
      <div
        className={cx(
          "relative flex items-center rounded-lg transition-[box-shadow] duration-(--duration-fast) ease-out focus-within:shadow-[var(--shadow-border-accent),0_0_0_3px_color-mix(in_srgb,var(--accent)_18%,transparent)]",
          wrapperVariantClasses[variant],
          wrapperSizeClasses[inputSize],
          error &&
            "shadow-(--shadow-border-danger) focus-within:shadow-[var(--shadow-border-danger),0_0_0_3px_color-mix(in_srgb,var(--danger)_18%,transparent)]",
          className,
        )}
      >
        {startAdornment ? (
          <span className="flex items-center pl-2.5 text-madoo-ink-faint">
            {startAdornment}
          </span>
        ) : null}
        <input
          id={inputId}
          ref={ref}
          data-madoo-control="true"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cx(
            "h-full w-full flex-1 border-0 bg-transparent px-3 font-[inherit] text-[14px] text-madoo-ink outline-none focus-visible:outline-none disabled:cursor-not-allowed disabled:text-madoo-ink-faint",
            inputSize === "sm" && "px-2.5 text-[11.5px]",
          )}
          {...rest}
        />
        {endAdornment ? (
          <span className="flex items-center pr-2.5 text-madoo-ink-faint">
            {endAdornment}
          </span>
        ) : null}
      </div>
      {error ? (
        <span id={`${inputId}-error`} className={cx(hintClasses, "text-madoo-danger")}>
          {error}
        </span>
      ) : hint ? (
        <span id={`${inputId}-hint`} className={hintClasses}>
          {hint}
        </span>
      ) : null}
    </div>
  );
});
