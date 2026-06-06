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

const DROPDOWN_EXIT_MS = 160;

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

function useDropdownPresence(open: boolean) {
  const [present, setPresent] = useState(open);

  useEffect(() => {
    if (open) {
      setPresent(true);
      return;
    }

    const timeout = window.setTimeout(() => setPresent(false), DROPDOWN_EXIT_MS);
    return () => window.clearTimeout(timeout);
  }, [open]);

  return present;
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
      <div
        ref={rootRef}
        className={cx("relative inline-flex font-madoo-sans", className)}
        {...rest}
      >
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
    "data-state": open ? "open" : "closed",
    className: cx(
      "inline-flex cursor-pointer items-center justify-center rounded-[var(--radius-lg)] border-0 bg-[var(--surface)] text-[color:var(--ink)] shadow-[var(--shadow-border)] transition-[background,color,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:bg-[var(--surface-2)] hover:shadow-[var(--shadow-border-rule-hover)] data-[state=open]:bg-[var(--surface-2)] data-[state=open]:shadow-[var(--shadow-border-rule-hover)]",
      className,
    ),
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
        triggerProps.className,
        (child.props as { className?: string }).className,
      ),
    });
  }

  return (
    <button
      type="button"
      className={triggerProps.className}
      onClick={triggerProps.onClick}
      aria-haspopup="menu"
      aria-expanded={open}
      data-state={open ? "open" : "closed"}
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
  const present = useDropdownPresence(open);
  if (!present) return null;

  return (
    <div
      role="menu"
      aria-hidden={!open}
      data-state={open ? "open" : "closed"}
      className={cx(
        "absolute left-0 top-[calc(100%+8px)] z-[var(--z-popover)] flex min-w-[180px] origin-top-left flex-col gap-0.5 rounded-[var(--radius-lg)] bg-[var(--surface)]  shadow-[var(--shadow-border)] will-change-[opacity,transform] [--madoo-dropdown-enter-x:-3px] data-[state=closed]:pointer-events-none data-[state=closed]:animate-madoo-dropdown-out data-[state=open]:animate-madoo-dropdown-in data-[state=open]:[&>*]:animate-madoo-dropdown-item-in data-[state=open]:[&>*:nth-child(2)]:[animation-delay:18ms] data-[state=open]:[&>*:nth-child(3)]:[animation-delay:30ms] data-[state=open]:[&>*:nth-child(4)]:[animation-delay:42ms] motion-reduce:animate-none motion-reduce:[&>*]:animate-none",
        align === "end" &&
          "left-auto right-0 origin-top-right [--madoo-dropdown-enter-x:3px]",
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
      className={cx(
        "flex w-full cursor-pointer items-center justify-between gap-3 rounded-[var(--radius-md)] border-0 bg-transparent px-2.5 py-[9px] text-left font-[inherit] text-[14px] leading-[1.2] text-[color:var(--ink)] transition-[background,color] duration-[var(--duration-fast)] ease-[var(--ease-out)] hover:bg-[var(--surface-2)] focus-visible:bg-[var(--surface-2)] focus-visible:outline-none disabled:cursor-not-allowed disabled:text-[color:var(--ink-faint)]",
        className,
      )}
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
