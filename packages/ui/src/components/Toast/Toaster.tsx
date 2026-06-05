"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cx } from "../../lib/cx";
import "./Toaster.css";

export type ToastTone = "default" | "success" | "danger" | "warn";

export type Toast = {
  id: string;
  tone?: ToastTone;
  title: string;
  body?: string;
  durationMs?: number;
};

type ToastInput = Omit<Toast, "id"> & { id?: string };

type ToastContextValue = {
  toast: (t: ToastInput) => string;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside <Toaster />.");
  }
  return ctx;
}

export function Toaster({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeouts = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const handle = timeouts.current.get(id);
    if (handle) {
      clearTimeout(handle);
      timeouts.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (t: ToastInput): string => {
      const id = t.id ?? `toast_${Math.random().toString(36).slice(2, 10)}`;
      setToasts((prev) => [...prev, { tone: "default", durationMs: 4000, ...t, id }]);
      const duration = t.durationMs ?? 4000;
      if (duration > 0) {
        const handle = setTimeout(() => dismiss(id), duration);
        timeouts.current.set(id, handle);
      }
      return id;
    },
    [dismiss],
  );

  useEffect(() => {
    const map = timeouts.current;
    return () => {
      for (const handle of map.values()) clearTimeout(handle);
      map.clear();
    };
  }, []);

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="madoo-toaster" role="region" aria-label="Notifications">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cx(
              "madoo-toast",
              t.tone && t.tone !== "default" && `madoo-toast--${t.tone}`,
            )}
            role="status"
          >
            <div style={{ flex: 1 }}>
              <div className="madoo-toast__title">{t.title}</div>
              {t.body ? <div className="madoo-toast__body">{t.body}</div> : null}
            </div>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => dismiss(t.id)}
              style={{
                all: "unset",
                cursor: "pointer",
                color: "inherit",
                fontSize: 14,
                lineHeight: 1,
                opacity: 0.6,
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
