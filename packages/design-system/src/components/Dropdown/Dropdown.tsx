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

    const timeout = window.setTimeout(
      () => setPresent(false),
      DROPDOWN_EXIT_MS,
    );
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
    if (!nextOpen) {
      const active = document.activeElement;
      const menu = rootRef.current?.querySelector('[role="menu"]');
      if (active instanceof HTMLElement && menu?.contains(active)) {
        active.blur();
      }
    }
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

export interface DropdownTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
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

  const sharedTriggerProps = {
    "aria-haspopup": "menu" as const,
    "aria-expanded": open,
    "data-state": open ? "open" : "closed",
    onClick: (event: ReactMouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      if (!event.defaultPrevented) setOpen(!open);
    },
  };

  if (asChild) {
    const child = Children.only(children);
    if (!isValidElement(child)) return null;

    return cloneElement(child as ReactElement<Record<string, unknown>>, {
      ...sharedTriggerProps,
      ...rest,
      className: cx(
        className,
        (child.props as { className?: string }).className,
      ),
    });
  }

  return (
    <button
      type="button"
      className={cx(
        "inline-flex cursor-pointer items-center justify-center rounded-lg border-0 bg-(--surface) text-(--ink) shadow-madoo-border transition-[background,color,box-shadow] duration-(--duration-fast) ease-out hover:bg-(--surface-2) hover:shadow-(--shadow-border-rule-hover) data-[state=open]:bg-(--surface-2) data-[state=open]:shadow-(--shadow-border-rule-hover)",
        className,
      )}
      {...sharedTriggerProps}
      {...rest}
    >
      {children}
    </button>
  );
}

export interface DropdownContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  align?: "start" | "end";
  side?: "bottom" | "top" | "right";
}

export function DropdownContent({
  children,
  align = "start",
  side = "bottom",
  className,
  ...rest
}: DropdownContentProps) {
  const { open } = useDropdown();
  const present = useDropdownPresence(open);
  if (!present) return null;

  const positionClass =
    side === "right"
      ? align === "end"
        ? "bottom-0 left-[calc(100%+8px)] origin-bottom-left [--madoo-dropdown-enter-x:-5px] [--madoo-dropdown-enter-y:0px]"
        : "left-[calc(100%+8px)] top-0 origin-top-left [--madoo-dropdown-enter-x:-5px] [--madoo-dropdown-enter-y:0px]"
      : side === "top"
        ? align === "end"
          ? "bottom-[calc(100%+8px)] right-0 origin-bottom-right [--madoo-dropdown-enter-x:3px] [--madoo-dropdown-enter-y:5px]"
          : "bottom-[calc(100%+8px)] left-0 origin-bottom-left [--madoo-dropdown-enter-x:-3px] [--madoo-dropdown-enter-y:5px]"
        : align === "end"
          ? "right-0 top-[calc(100%+8px)] origin-top-right [--madoo-dropdown-enter-x:3px] [--madoo-dropdown-enter-y:-5px]"
          : "left-0 top-[calc(100%+8px)] origin-top-left [--madoo-dropdown-enter-x:-3px] [--madoo-dropdown-enter-y:-5px]";

  return (
    <div
      role="menu"
      aria-hidden={!open}
      data-state={open ? "open" : "closed"}
      className={cx(
        "absolute z-[var(--z-popover)] flex min-w-45 flex-col gap-0.5 rounded-lg bg-(--surface) shadow-(--shadow-border-rule-hover) will-change-[opacity,transform] data-[state=closed]:pointer-events-none data-[state=closed]:animate-madoo-dropdown-out data-[state=open]:animate-madoo-dropdown-in data-[state=open]:[&>*]:animate-madoo-dropdown-item-in data-[state=open]:[&>*:nth-child(2)]:[animation-delay:18ms] data-[state=open]:[&>*:nth-child(3)]:[animation-delay:30ms] data-[state=open]:[&>*:nth-child(4)]:[animation-delay:42ms] motion-reduce:animate-none motion-reduce:[&>*]:animate-none",
        positionClass,
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export interface DropdownItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  onSelect?: () => void;
  /** Render the child element (e.g. a Next.js <Link>) instead of a <button>. */
  asChild?: boolean;
}

export function DropdownItem({
  children,
  className,
  onClick,
  onSelect,
  asChild = false,
  ...rest
}: DropdownItemProps) {
  const { setOpen } = useDropdown();

  const itemClassName = cx(
    "flex w-full cursor-pointer items-center justify-between gap-3 rounded-md border-0 bg-transparent px-2.5 py-2.25 text-left font-[inherit] text-[14px] leading-[1.2] text-(--ink) transition-[background,color] duration-(--duration-fast) ease-out hover:bg-(--surface-2) focus-visible:bg-(--surface-2) focus-visible:outline-none disabled:cursor-not-allowed disabled:text-(--ink-faint)",
    className,
  );

  const handleClick = (event: ReactMouseEvent<HTMLElement>) => {
    onClick?.(event as ReactMouseEvent<HTMLButtonElement>);
    if (event.defaultPrevented || rest.disabled) return;
    onSelect?.();
    setOpen(false);
  };

  if (asChild) {
    const child = Children.only(children);
    if (!isValidElement(child)) return null;

    const childProps = child.props as {
      className?: string;
      onClick?: (event: ReactMouseEvent<HTMLElement>) => void;
    };

    return cloneElement(child as ReactElement<Record<string, unknown>>, {
      role: "menuitem",
      ...rest,
      className: cx(itemClassName, childProps.className),
      onClick: (event: ReactMouseEvent<HTMLElement>) => {
        childProps.onClick?.(event);
        handleClick(event);
      },
    });
  }

  return (
    <button
      type="button"
      role="menuitem"
      className={itemClassName}
      onClick={handleClick}
      {...rest}
    >
      {children}
    </button>
  );
}

export type DropdownDividerProps = HTMLAttributes<HTMLDivElement>;

export function DropdownDivider({ className, ...rest }: DropdownDividerProps) {
  return (
    <div
      role="separator"
      className={cx("-mx-2 h-px shadow-(--shadow-border-top)", className)}
      {...rest}
    />
  );
}
