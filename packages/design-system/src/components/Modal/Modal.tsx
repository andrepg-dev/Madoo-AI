import {
  useEffect,
  useState,
  type HTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from "react";
import { cx } from "../../lib/cx";
import { Icon } from "../Icon";

const MODAL_EXIT_MS = 170;

export type ModalSize = "sm" | "md" | "lg" | "xl";

export interface ModalProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  open: boolean;
  onClose: () => void;
  size?: ModalSize;
  /** Texto del eyebrow superior, ej: "STEP 1 OF 5" */
  eyebrow?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  /** Footer custom (botones) */
  footer?: ReactNode;
  /** Oculta el boton "X" superior */
  hideCloseButton?: boolean;
  /** Cierra al hacer click fuera del modal (default: true) */
  closeOnOverlayClick?: boolean;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-95",
  md: "max-w-120",
  lg: "max-w-160",
  xl: "max-w-205",
};

function useModalPresence(open: boolean) {
  const [present, setPresent] = useState(open);

  useEffect(() => {
    if (open) {
      setPresent(true);
      return;
    }

    const timeout = window.setTimeout(() => setPresent(false), MODAL_EXIT_MS);
    return () => window.clearTimeout(timeout);
  }, [open]);

  return present;
}

export function Modal({
  open,
  onClose,
  size = "md",
  eyebrow,
  title,
  description,
  footer,
  hideCloseButton,
  closeOnOverlayClick = true,
  className,
  children,
  ...rest
}: ModalProps) {
  const present = useModalPresence(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!present) return null;

  const handleOverlayClick = () => {
    if (!open) return;
    if (closeOnOverlayClick) onClose();
  };
  const stop = (e: MouseEvent) => e.stopPropagation();

  return (
    <div
      className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-[rgba(20,15,10,0.4)] p-6 backdrop-blur-sm will-change-[opacity,backdrop-filter] data-[state=closed]:pointer-events-none data-[state=closed]:animate-madoo-modal-overlay-out data-[state=open]:animate-madoo-modal-overlay-in max-[640px]:items-end max-[640px]:p-3 motion-reduce:animate-none"
      role="presentation"
      data-state={open ? "open" : "closed"}
      aria-hidden={!open}
      onClick={handleOverlayClick}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={stop}
        data-state={open ? "open" : "closed"}
        className={cx(
          "relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-(--radius-panel) bg-madoo-surface font-madoo-sans text-madoo-ink shadow-madoo-border origin-center will-change-[opacity,transform] data-[state=closed]:animate-madoo-modal-out data-[state=open]:animate-madoo-modal-in max-[640px]:max-h-[95vh] max-[640px]:max-w-full max-[640px]:origin-bottom max-[640px]:rounded-b-none motion-reduce:animate-none",
          sizeClasses[size],
          className,
        )}
        {...rest}
      >
        {(eyebrow || title || description || !hideCloseButton) && (
          <header className="flex animate-madoo-modal-content-in items-start gap-3.5 px-6 py-4.5 shadow-(--shadow-border-bottom) max-[640px]:px-4 max-[640px]:py-3.5 motion-reduce:animate-none">
            <div className="min-w-0 flex-1">
              {eyebrow ? (
                <div className="text-[11px] font-medium uppercase tracking-[1px] text-madoo-ink-faint">
                  {eyebrow}
                </div>
              ) : null}
              {title ? (
                <h2 className="m-0 mt-0.5 text-base font-medium">{title}</h2>
              ) : null}
              {description ? (
                <p className="mt-1 text-[13px] leading-[1.5] text-madoo-ink-soft">
                  {description}
                </p>
              ) : null}
            </div>
            {!hideCloseButton ? (
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-0 bg-madoo-surface-2 text-madoo-ink-soft transition-[background,color,transform] duration-(--duration-fast) ease-out hover:scale-[1.04] hover:bg-madoo-border hover:text-madoo-ink active:scale-[0.98]"
              >
                <Icon name="x" size={14} />
              </button>
            ) : null}
          </header>
        )}
        <div className="flex-1 animate-madoo-modal-content-in overflow-y-auto p-6 [animation-delay:24ms] max-[640px]:p-4 motion-reduce:animate-none">
          {children}
        </div>
        {footer ? (
          <footer className="flex animate-madoo-modal-content-in flex-wrap justify-between gap-2 px-5 py-3.5 shadow-(--shadow-border-top) [animation-delay:36ms] max-[640px]:px-4 max-[640px]:py-3 motion-reduce:animate-none">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}
