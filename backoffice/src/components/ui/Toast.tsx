"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { createPortal } from "react-dom";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, durationMs?: number) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "info", durationMs = 4000) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);

      setTimeout(() => {
        removeToast(id);
      }, durationMs);
    },
    [removeToast]
  );

  const success = useCallback(
    (msg: string) => showToast(msg, "success"),
    [showToast]
  );
  const error = useCallback(
    (msg: string) => showToast(msg, "error"),
    [showToast]
  );
  const info = useCallback((msg: string) => showToast(msg, "info"), [showToast]);
  const warning = useCallback(
    (msg: string) => showToast(msg, "warning"),
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}
      {mounted &&
        createPortal(
          <div className="fixed top-5 right-5 z-[110] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none p-2">
            {toasts.map((toast) => (
              <div
                key={toast.id}
                className={`pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 shadow-xl backdrop-blur-md transition-all animate-in slide-in-from-top-3 fade-in duration-200 ${
                  toast.type === "success"
                    ? "border-emerald-300 bg-emerald-50/95 text-emerald-950 shadow-emerald-900/10"
                    : toast.type === "error"
                    ? "border-red-300 bg-red-50/95 text-red-950 shadow-red-900/10"
                    : toast.type === "warning"
                    ? "border-amber-300 bg-amber-50/95 text-amber-950 shadow-amber-900/10"
                    : "border-stone-300 bg-[#FFFDF8]/95 text-stone-900 shadow-stone-900/10"
                }`}
                role="status"
              >
                {/* Ícone */}
                <span className="mt-0.5 shrink-0">
                  {toast.type === "success" && (
                    <svg
                      className="h-5 w-5 text-emerald-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2.5"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                  )}
                  {toast.type === "error" && (
                    <svg
                      className="h-5 w-5 text-red-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2.5"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  )}
                  {toast.type === "warning" && (
                    <svg
                      className="h-5 w-5 text-amber-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2.5"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                      />
                    </svg>
                  )}
                  {toast.type === "info" && (
                    <svg
                      className="h-5 w-5 text-stone-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2.5"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                      />
                    </svg>
                  )}
                </span>

                <div className="flex-1 text-sm font-semibold leading-snug">
                  {toast.message}
                </div>

                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="shrink-0 rounded-lg p-1 text-stone-400 hover:text-stone-700 transition-colors"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fallback gracioso se chamado fora do provider
    return {
      showToast: (m: string) => console.log("[TOAST]", m),
      success: (m: string) => console.log("[SUCCESS]", m),
      error: (m: string) => console.error("[ERROR]", m),
      info: (m: string) => console.info("[INFO]", m),
      warning: (m: string) => console.warn("[WARN]", m),
    };
  }
  return ctx;
}
