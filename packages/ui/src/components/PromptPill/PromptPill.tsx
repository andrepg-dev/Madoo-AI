import { useEffect, useRef, useState } from "react";
import { Icon } from "../Icon";
import "./PromptPill.css";

export interface PromptPillProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  /** Maximo ancho del menu */
  menuWidth?: number;
}

export function PromptPill({
  label,
  value,
  options,
  onChange,
  menuWidth,
}: PromptPillProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={ref} className="madoo-pill">
      <button
        type="button"
        className="madoo-pill__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="madoo-pill__label">{label}:</span>
        <span className="madoo-pill__value">{value}</span>
        <Icon name="chevronDown" size={11} />
      </button>
      {open && (
        <div
          role="listbox"
          className="madoo-pill__menu"
          style={menuWidth ? { minWidth: menuWidth } : undefined}
        >
          {options.map((o) => (
            <button
              key={o}
              type="button"
              role="option"
              aria-selected={o === value}
              className="madoo-pill__option"
              onClick={() => {
                onChange(o);
                setOpen(false);
              }}
            >
              {o}
              {o === value && <Icon name="check" size={12} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
