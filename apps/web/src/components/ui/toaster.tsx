"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Toast Context ───────────────────────────────────────────────────────────

type ToastVariant = "default" | "success" | "error";

interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastContextValue {
  toast: (opts: Omit<ToastMessage, "id">) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <Toaster>");
  return ctx;
}

// ─── Toaster ─────────────────────────────────────────────────────────────────

export function Toaster({ children }: { children?: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const toast = React.useCallback((opts: Omit<ToastMessage, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...opts, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const VARIANT_STYLES: Record<ToastVariant, string> = {
    default: "border-border bg-card text-foreground",
    success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    error: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast Viewport */}
      <div
        aria-live="assertive"
        aria-atomic="true"
        className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="alert"
            className={cn(
              "relative flex flex-col gap-1 rounded-xl border px-4 py-3 shadow-lg",
              "animate-in slide-in-from-bottom-4 fade-in duration-300",
              VARIANT_STYLES[t.variant ?? "default"]
            )}
          >
            <button
              onClick={() => dismiss(t.id)}
              className="absolute right-2 top-2 rounded-md p-0.5 opacity-60 hover:opacity-100 transition-opacity"
              aria-label="Dismiss notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <p className="pr-5 text-sm font-semibold leading-tight">{t.title}</p>
            {t.description && (
              <p className="text-xs opacity-80">{t.description}</p>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
