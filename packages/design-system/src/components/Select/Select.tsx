import {
  forwardRef,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type SelectHTMLAttributes,
} from "react";
import { cx } from "../../lib/cx";
import { Icon } from "../Icon";
import "./Select.css";

export type SelectSize = "sm" | "md" | "lg";
export type SelectVariant = "default" | "ghost" | "surface";
export type SelectAlign = "start" | "end";

export type SelectOption =
  | string
  | {
      label: string;
      value: string;
      disabled?: boolean;
    };

export interface SelectProps {
  value: string;
  options: readonly SelectOption[];
  onChange: (value: string) => void;
  label?: string;
  menuTitle?: string;
  placeholder?: string;
  menuWidth?: number;
  size?: SelectSize;
  variant?: SelectVariant;
  align?: SelectAlign;
}

export type NativeSelectSize = "sm" | "md" | "lg";

export interface NativeSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface NativeSelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label?: string;
  hint?: string;
  error?: string;
  options?: NativeSelectOption[];
  selectSize?: NativeSelectSize;
}

function normalizeOption(option: SelectOption) {
  return typeof option === "string" ? { label: option, value: option } : option;
}

export function Select({
  value,
  options,
  onChange,
  label,
  menuTitle,
  placeholder = "Select",
  menuWidth,
  size = "md",
  variant = "default",
  align = "start",
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const normalizedOptions = useMemo(() => options.map(normalizeOption), [options]);
  const selected = normalizedOptions.find((option) => option.value === value);
  const displayValue = selected?.label ?? (value || placeholder);

  useEffect(() => {
    const onDoc = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={cx(
        "madoo-select",
        `madoo-select--${size}`,
        `madoo-select--${variant}`,
        `madoo-select--align-${align}`,
      )}
    >
      <button
        type="button"
        className="madoo-select__trigger"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="madoo-select__value">{displayValue}</span>
        <Icon name="chevronDown" size={size === "lg" ? 22 : 12} />
      </button>

      {open ? (
        <div
          id={listboxId}
          role="listbox"
          className="madoo-select__menu"
          style={menuWidth ? { minWidth: menuWidth } : undefined}
        >
          {menuTitle ?? label ? (
            <div className="madoo-select__menu-title">{menuTitle ?? label}</div>
          ) : null}
          {normalizedOptions.map((option) => {
            const selectedOption = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={selectedOption}
                disabled={option.disabled}
                className="madoo-select__option"
                onClick={() => {
                  if (option.disabled) return;
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                <span>{option.label}</span>
                {selectedOption ? <Icon name="check" size={size === "lg" ? 22 : 14} /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export const NativeSelect = forwardRef<HTMLSelectElement, NativeSelectProps>(
  function NativeSelect(
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
        <div className="madoo-native-select-wrapper">
          <select
            id={selectId}
            ref={ref}
            aria-invalid={error ? true : undefined}
            className={cx(
              "madoo-native-select",
              selectSize !== "md" && `madoo-native-select--${selectSize}`,
              error && "madoo-native-select--invalid",
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
          <span className="madoo-native-select-wrapper__chevron" aria-hidden="true">
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
  },
);
