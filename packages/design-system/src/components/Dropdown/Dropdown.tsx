import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { cx } from "../../lib/cx";
import "./Dropdown.css";

interface DropdownContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DropdownContext = createContext<DropdownContextValue | null>(null);

function useDropdown() {
  const context = useContext(DropdownContext);
  if (!context) {
    throw new Error("Dropdown components must be used inside <Dropdown />");
  }
  return context;
}

export interface DropdownProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Dropdown({
  children,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  className,
  ...rest
}: DropdownProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const rootRef = useRef<HTMLDivElement>(null);
  const open = controlledOpen ?? uncontrolledOpen;

  const setOpen = (nextOpen: boolean) => {
    if (controlledOpen === undefined) setUncontrolledOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  useEffect(() => {
    const onDoc = (event: globalThis.MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
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
  });

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div ref={rootRef} className={cx("madoo-dropdown", className)} {...rest}>
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

export interface DropdownTriggerProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  asChild?: boolean;
}

export function DropdownTrigger({
  children,
  asChild = false,
  className,
  onClick,
  ...rest
}: DropdownTriggerProps) {
  const { open, setOpen } = useDropdown();

  const triggerProps = {
    "aria-haspopup": "menu" as const,
    "aria-expanded": open,
    className: cx("madoo-dropdown__trigger", className),
    onClick: (event: ReactMouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      if (!event.defaultPrevented) setOpen(!open);
    },
  };

  if (asChild) {
    const child = Children.only(children);
    if (!isValidElement(child)) return null;

    return cloneElement(child as ReactElement<Record<string, unknown>>, {
      ...triggerProps,
      ...rest,
      className: cx(
        "madoo-dropdown__trigger",
        (child.props as { className?: string }).className,
        className,
      ),
    });
  }

  return (
    <button
      type="button"
      className={cx("madoo-dropdown__trigger", className)}
      onClick={triggerProps.onClick}
      aria-haspopup="menu"
      aria-expanded={open}
      {...rest}
    >
      {children}
    </button>
  );
}

export interface DropdownContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  align?: "start" | "end";
}

export function DropdownContent({
  children,
  align = "start",
  className,
  ...rest
}: DropdownContentProps) {
  const { open } = useDropdown();
  if (!open) return null;

  return (
    <div
      role="menu"
      className={cx(
        "madoo-dropdown__content",
        align === "end" && "madoo-dropdown__content--align-end",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export interface DropdownItemProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  onSelect?: () => void;
}

export function DropdownItem({
  children,
  className,
  onClick,
  onSelect,
  ...rest
}: DropdownItemProps) {
  const { setOpen } = useDropdown();

  return (
    <button
      type="button"
      role="menuitem"
      className={cx("madoo-dropdown__item", className)}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || rest.disabled) return;
        onSelect?.();
        setOpen(false);
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
