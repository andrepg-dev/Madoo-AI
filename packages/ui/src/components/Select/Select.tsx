import {
  forwardRef,
  useId,
  type SelectHTMLAttributes,
} from "react";
import { cx } from "../../lib/cx";
import { Icon } from "../Icon";
import "./Select.css";

export type SelectSize = "sm" | "md" | "lg";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label?: string;
  hint?: string;
  error?: string;
  options?: SelectOption[];
  selectSize?: SelectSize;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    id,
    label,
    hint,
    error,
    options,
    selectSize = "md",
    className,
    children,
    ...rest
  },
  ref,
) {
  const reactId = useId();
  const selectId = id ?? reactId;

  return (
    <div className="madoo-field">
      {label ? (
        <label htmlFor={selectId} className="madoo-field__label">
          {label}
        </label>
      ) : null}
      <div className="madoo-select-wrapper">
        <select
          id={selectId}
          ref={ref}
          aria-invalid={error ? true : undefined}
          className={cx(
            "madoo-select",
            selectSize !== "md" && `madoo-select--${selectSize}`,
            error && "madoo-select--invalid",
            className,
          )}
          {...rest}
        >
          {children
            ? children
            : options?.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))}
        </select>
        <span className="madoo-select-wrapper__chevron" aria-hidden="true">
          <Icon name="chevronDown" size={12} />
        </span>
      </div>
      {error ? (
        <span className="madoo-field__hint madoo-field__hint--error">{error}</span>
      ) : hint ? (
        <span className="madoo-field__hint">{hint}</span>
      ) : null}
    </div>
  );
});
