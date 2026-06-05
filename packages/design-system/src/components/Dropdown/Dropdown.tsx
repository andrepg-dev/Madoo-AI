import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Icon } from "../Icon";
import "./Dropdown.css";

export type DropdownSize = "sm" | "md" | "lg";
export type DropdownVariant = "default" | "ghost" | "surface";
export type DropdownAlign = "start" | "end";

export type DropdownOption =
  | string
  | {
      label: string;
      value: string;
      disabled?: boolean;
    };

export interface DropdownProps {
  value: string;
  options: readonly DropdownOption[];
  onChange: (value: string) => void;
  label?: string;
  menuTitle?: string;
  placeholder?: string;
  menuWidth?: number;
  size?: DropdownSize;
  variant?: DropdownVariant;
  align?: DropdownAlign;
}

function normalizeOption(option: DropdownOption) {
  return typeof option === "string" ? { label: option, value: option } : option;
}

export function Dropdown({
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
}: DropdownProps) {
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
      className={`madoo-dropdown madoo-dropdown--${size} madoo-dropdown--${variant} madoo-dropdown--align-${align}`}
    >
      <button
        type="button"
        className="madoo-dropdown__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        onClick={() => setOpen((current) => !current)}
      >
        {label ? <span className="madoo-dropdown__label">{label}:</span> : null}
        <span className="madoo-dropdown__value">{displayValue}</span>
        <Icon name="chevronDown" size={size === "lg" ? 22 : 12} />
      </button>

      {open ? (
        <div
          id={listboxId}
          role="listbox"
          className="madoo-dropdown__menu"
          style={menuWidth ? { minWidth: menuWidth } : undefined}
        >
          {menuTitle ? <div className="madoo-dropdown__menu-title">{menuTitle}</div> : null}
          {normalizedOptions.map((option) => {
            const selectedOption = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={selectedOption}
                disabled={option.disabled}
                className="madoo-dropdown__option"
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
