"use client";

import { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  showCloseButton?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "xl",
  showCloseButton = true,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fecha no ESC e bloqueia scroll do body
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  const maxWidthClasses: Record<string, string> = {
    sm: "max-w-md",
    md: "max-w-xl",
    lg: "max-w-2xl",
    xl: "max-w-3xl",
    "2xl": "max-w-4xl",
    "3xl": "max-w-5xl",
  };

  const selectedWidthClass = maxWidthClasses[maxWidth] || maxWidthClasses.xl;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-stone-900/65 backdrop-blur-sm transition-opacity overflow-hidden"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`relative w-full ${selectedWidthClass} max-h-[90vh] flex flex-col rounded-3xl border-2 border-stone-200/90 dark:border-stone-700/90 bg-[#FFFDF8] dark:bg-[#1f1a16] text-stone-800 dark:text-stone-100 shadow-2xl ring-1 ring-black/5 dark:ring-white/5 transition-all animate-in fade-in-0 zoom-in-95 overflow-hidden`}
      >
        {/* Header fixo do card */}
        {(title || showCloseButton) && (
          <div className="shrink-0 px-6 pt-5 pb-4 border-b border-stone-200/70 dark:border-stone-800 bg-[#FFFDF8] dark:bg-[#1f1a16] flex items-start justify-between gap-4 z-10">
            <div className="min-w-0 flex-1">
              {title && (
                <div className="font-display text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 leading-snug">
                  {title}
                </div>
              )}
              {subtitle && (
                <p className="mt-1 text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-full p-2 text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-700 dark:hover:text-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all active:scale-90 cursor-pointer"
                aria-label="Fechar popup"
                title="Fechar (Esc)"
              >
                <X className="w-5 h-5 stroke-[2]" />
              </button>
            )}
          </div>
        )}

        {/* Corpo com rolagem interna no card */}
        <div className="flex-1 overflow-y-auto px-6 py-5 text-left">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
