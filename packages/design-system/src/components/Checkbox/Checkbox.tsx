import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cx } from "../../lib/cx";
import { Icon } from "../Icon";
import "./Checkbox.css";

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: ReactNode;
  description?: ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { id, label, description, disabled, className, ...rest },
  ref,
) {
  const reactId = useId();
  const inputId = id ?? reactId;

  return (
    <label
      htmlFor={inputId}
      className={cx(
        "madoo-checkbox",
        disabled && "madoo-checkbox--disabled",
        className,
      )}
    >
      <span style={{ position: "relative", display: "inline-flex" }}>
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          disabled={disabled}
          className="madoo-checkbox__input"
          {...rest}
        />
        <span className="madoo-checkbox__control">
          <span className="madoo-checkbox__check" aria-hidden="true">
            <Icon name="check" size={11} />
          </span>
        </span>
      </span>
      {(label || description) && (
        <span className="madoo-checkbox__text">
          {label ? <span className="madoo-checkbox__label">{label}</span> : null}
          {description ? (
            <span className="madoo-checkbox__description">{description}</span>
          ) : null}
        </span>
      )}
    </label>
  );
});
