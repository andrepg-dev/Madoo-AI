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

export type ToastTone = "default" | "success" | "danger" | "warn";

export type Toast = {
  id: string;
  tone?: ToastTone;
  title: string;
  body?: string;
  durationMs?: number;
};

type ToastInput = Omit<Toast, "id"> & { id?: string };

const toastToneClasses: Record<ToastTone, string> = {
  default: "bg-madoo-surface text-madoo-ink shadow-madoo-border",
  success:
    "bg-[rgba(232,248,240,0.96)] text-[#1f5c43] shadow-[inset_0_0_0_1px_rgba(36,132,96,0.45)]",
  danger:
    "bg-[rgba(252,232,228,0.96)] text-[#802018] shadow-[inset_0_0_0_1px_rgba(180,60,50,0.4)]",
  warn: "bg-[rgba(252,244,224,0.96)] text-[#6c4a14] shadow-[inset_0_0_0_1px_rgba(196,132,36,0.4)]",
};

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
      <div
        className="pointer-events-none fixed bottom-6 right-6 z-[var(--z-toast)] flex max-w-[calc(100vw-32px)] flex-col gap-2 max-[480px]:inset-x-3 max-[480px]:bottom-3 max-[480px]:max-w-none"
        role="region"
        aria-label="Notifications"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cx(
              "pointer-events-auto flex w-full min-w-[min(240px,100%)] max-w-90 animate-madoo-toast-in items-start gap-2.5 rounded-lg px-3.5 py-2.5 text-[13px] leading-[1.4] motion-reduce:animate-none",
              toastToneClasses[t.tone ?? "default"],
            )}
            role="status"
          >
            <div className="flex-1">
              <div className="text-[13px] font-medium">{t.title}</div>
              {t.body ? (
                <div className="mt-0.5 text-[12.5px] opacity-85">{t.body}</div>
              ) : null}
            </div>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => dismiss(t.id)}
              className="cursor-pointer border-0 bg-transparent p-0 text-sm leading-none text-inherit opacity-60"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
