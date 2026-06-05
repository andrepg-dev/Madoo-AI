import {
  useEffect,
  useState,
  type HTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from "react";
import { cx } from "../../lib/cx";
import { Icon } from "../Icon";
import "./Modal.css";

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
      className="madoo-modal-overlay"
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
        className={cx("madoo-modal", `madoo-modal--${size}`, className)}
        {...rest}
      >
        {(eyebrow || title || description || !hideCloseButton) && (
          <header className="madoo-modal__header">
            <div className="madoo-modal__title-block">
              {eyebrow ? <div className="madoo-modal__eyebrow">{eyebrow}</div> : null}
              {title ? <h2 className="madoo-modal__title">{title}</h2> : null}
              {description ? (
                <p className="madoo-modal__description">{description}</p>
              ) : null}
            </div>
            {!hideCloseButton ? (
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="madoo-modal__close"
              >
                <Icon name="x" size={14} />
              </button>
            ) : null}
          </header>
        )}
        <div className="madoo-modal__body">{children}</div>
        {footer ? <footer className="madoo-modal__footer">{footer}</footer> : null}
      </div>
    </div>
  );
}
