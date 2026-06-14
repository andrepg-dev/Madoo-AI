import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cx } from "../../lib/cx";
import { Icon } from "../Icon";

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
        "group inline-flex cursor-pointer select-none items-start gap-2.5 font-madoo-sans text-[14px] text-madoo-ink",
        disabled && "cursor-not-allowed opacity-60",
        className,
      )}
    >
      <span className="relative inline-flex">
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          disabled={disabled}
          className="peer absolute inset-0 m-0 cursor-inherit opacity-0"
          {...rest}
        />
        <span className="relative h-4.5 w-4.5 shrink-0 rounded-sm bg-madoo-surface shadow-madoo-border transition-[background,box-shadow,transform] duration-(--duration-fast) ease-out after:pointer-events-none after:absolute after:inset-0 after:scale-75 after:rounded-[inherit] after:bg-[rgb(var(--rule-rgb)/0.1)] after:opacity-0 after:content-[''] group-hover:bg-madoo-surface-2 group-hover:shadow-(--shadow-border-rule-hover) group-active:scale-[0.94] peer-focus-visible:shadow-[var(--shadow-border-accent),0_0_0_3px_color-mix(in_srgb,var(--accent)_20%,transparent)] peer-checked:animate-madoo-checkbox-control-in peer-checked:bg-madoo-accent-deep peer-checked:shadow-(--shadow-border-accent) peer-checked:after:animate-madoo-checkbox-fill-pulse peer-checked:group-hover:bg-madoo-accent-deep peer-checked:[&>span]:scale-100 peer-checked:[&>span]:rotate-0 peer-checked:[&>span]:opacity-100 motion-reduce:animate-none motion-reduce:after:animate-none">
          <span
            className="absolute inset-0 flex scale-[0.68] rotate-[-8deg] items-center justify-center text-madoo-accent-fg opacity-0 transition-[opacity,transform] duration-(--duration-fast) ease-out motion-reduce:transition-none"
            aria-hidden="true"
          >
            <Icon name="check" size={11} />
          </span>
        </span>
      </span>
      {(label || description) && (
        <span className="flex flex-col gap-0.5 text-[13px] leading-[1.45]">
          {label ? <span className="font-medium">{label}</span> : null}
          {description ? (
            <span className="text-xs text-madoo-ink-faint">{description}</span>
          ) : null}
        </span>
      )}
    </label>
  );
});
