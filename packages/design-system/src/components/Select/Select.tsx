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

const SELECT_EXIT_MS = 160;

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

const fieldClasses = "flex flex-col gap-1.5 font-madoo-sans";
const labelClasses =
  "text-[11px] font-medium uppercase tracking-[0.3px] text-madoo-ink-faint";
const hintClasses = "text-[11.5px] leading-[1.4] text-madoo-ink-faint";

const selectSizeClasses: Record<SelectSize, string> = {
  sm: "text-[12.5px] [--select-gap:6px] [--select-height:30px] [--select-menu-title:12px] [--select-option-padding:7px_10px] [--select-padding:0_10px]",
  md: "text-[14px] [--select-gap:8px] [--select-height:38px] [--select-menu-title:13px] [--select-option-padding:10px_12px] [--select-padding:0_14px]",
  lg: "rounded-[var(--radius-2xl)] text-[32px] [--select-gap:18px] [--select-height:76px] [--select-menu-title:28px] [--select-option-padding:18px_24px] [--select-padding:0_28px] [--select-radius:var(--radius-2xl)] [--select-menu-padding:16px]",
};

const selectVariantClasses: Record<SelectVariant, string> = {
  default: "[--select-bg:var(--surface)] [--select-shadow:var(--shadow-border)]",
  ghost: "[--select-bg:transparent] [--select-shadow:none]",
  surface: "[--select-bg:var(--surface-2)] [--select-shadow:var(--shadow-border)]",
};

const nativeSizeClasses: Record<NativeSelectSize, string> = {
  sm: "h-7 py-0 pl-2.5 pr-[30px] text-xs",
  md: "h-[34px] py-0 pl-3 pr-9 text-[14px]",
  lg: "h-10 py-0 pl-3.5 pr-10 text-[14px]",
};

function normalizeOption(option: SelectOption) {
  return typeof option === "string" ? { label: option, value: option } : option;
}

function useSelectPresence(open: boolean) {
  const [present, setPresent] = useState(open);

  useEffect(() => {
    if (open) {
      setPresent(true);
      return;
    }

    const timeout = window.setTimeout(() => setPresent(false), SELECT_EXIT_MS);
    return () => window.clearTimeout(timeout);
  }, [open]);

  return present;
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
  const menuPresent = useSelectPresence(open);

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
        "relative inline-flex flex-col font-madoo-sans [--select-menu-padding:6px] [--select-radius:var(--radius-lg)]",
        selectSizeClasses[size],
        selectVariantClasses[variant],
      )}
    >
      <button
        type="button"
        className={cx(
          "group inline-flex min-h-[var(--select-height)] cursor-pointer items-center justify-between gap-[var(--select-gap)] whitespace-nowrap rounded-[var(--select-radius)] border-0 bg-[var(--select-bg)] p-[var(--select-padding)] font-[inherit] font-normal leading-none text-[var(--ink)] shadow-[var(--select-shadow)] transition-[background,color,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:bg-[var(--surface)] hover:shadow-[var(--shadow-border-rule-hover)] data-[state=open]:bg-[var(--surface)] data-[state=open]:shadow-[var(--shadow-border-rule-hover)]",
          variant === "ghost" &&
            "hover:bg-[rgb(var(--rule-rgb)_/_0.06)] hover:shadow-none data-[state=open]:bg-[rgb(var(--rule-rgb)_/_0.06)] data-[state=open]:shadow-none",
        )}
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuPresent ? listboxId : undefined}
        data-state={open ? "open" : "closed"}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="overflow-hidden text-ellipsis">{displayValue}</span>
        <span
          className="inline-flex origin-center text-[var(--ink-faint)] transition-[color,transform] duration-[var(--duration-base)] ease-[var(--ease-out)] group-data-[state=open]:rotate-180 group-data-[state=open]:text-[var(--ink-muted)]"
          aria-hidden="true"
        >
          <Icon name="chevronDown" size={size === "lg" ? 22 : 12} />
        </span>
      </button>

      {menuPresent ? (
        <div
          id={listboxId}
          role="listbox"
          aria-hidden={!open}
          data-state={open ? "open" : "closed"}
          className={cx(
            "absolute left-0 top-[calc(100%+10px)] z-[var(--z-popover)] flex min-w-[max(100%,180px)] origin-top-left flex-col gap-0.5 rounded-[var(--select-radius)] bg-[var(--surface)] p-[var(--select-menu-padding)] shadow-[var(--shadow-border)] will-change-[opacity,transform] [--madoo-select-enter-x:3px] data-[state=closed]:pointer-events-none data-[state=closed]:animate-madoo-select-out data-[state=open]:animate-madoo-select-in motion-reduce:animate-none",
            align === "end" &&
              "left-auto right-0 origin-top-right [--madoo-select-enter-x:-3px]",
          )}
          style={menuWidth ? { minWidth: menuWidth } : undefined}
        >
          {menuTitle ?? label ? (
            <div className="p-[var(--select-option-padding)] text-[var(--select-menu-title)] font-medium leading-none text-[var(--ink-muted)]">
              {menuTitle ?? label}
            </div>
          ) : null}
          {normalizedOptions.map((option, index) => {
            const selectedOption = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={selectedOption}
                disabled={option.disabled}
                className="flex w-full animate-madoo-select-option-in cursor-pointer items-center justify-between gap-4 rounded-[var(--radius-lg)] border-0 bg-transparent p-[var(--select-option-padding)] text-left font-[inherit] font-normal leading-[1.2] text-[var(--ink)] transition-[background,color] duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:bg-[var(--surface-2)] focus-visible:bg-[var(--surface-2)] focus-visible:outline-none aria-selected:bg-transparent disabled:cursor-not-allowed disabled:text-[var(--ink-faint)] motion-reduce:animate-none"
                style={{ animationDelay: `${Math.min(index, 4) * 16}ms` }}
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
      <div className={fieldClasses}>
        {label ? (
          <label htmlFor={selectId} className={labelClasses}>
            {label}
          </label>
        ) : null}
        <div className="relative flex items-center">
          <select
            id={selectId}
            ref={ref}
            data-madoo-control="true"
            aria-invalid={error ? true : undefined}
            className={cx(
              "w-full cursor-pointer appearance-none rounded-[var(--radius-lg)] border-0 bg-[var(--surface)] font-madoo-sans text-[var(--ink)] shadow-[var(--shadow-border)] transition-[background,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-out)] enabled:hover:bg-[var(--surface-2)] enabled:hover:shadow-[var(--shadow-border-rule-hover)] focus:outline-none focus:shadow-[var(--shadow-border-accent),0_0_0_3px_color-mix(in_srgb,var(--accent)_18%,transparent)] focus-visible:outline-none",
              nativeSizeClasses[selectSize],
              error && "shadow-[var(--shadow-border-danger)]",
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
          <span
            className="pointer-events-none absolute right-3 inline-flex text-[var(--ink-faint)]"
            aria-hidden="true"
          >
            <Icon name="chevronDown" size={12} />
          </span>
        </div>
        {error ? (
          <span className={cx(hintClasses, "text-madoo-danger")}>{error}</span>
        ) : hint ? (
          <span className={hintClasses}>{hint}</span>
        ) : null}
      </div>
    );
  },
);
