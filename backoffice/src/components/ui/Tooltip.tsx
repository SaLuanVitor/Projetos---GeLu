"use client";

import type { ReactNode } from "react";
import { useState } from "react";

interface TooltipProps {
  children: ReactNode;
  text: string;
  position?: "top" | "bottom" | "left" | "right";
  align?: "center" | "left" | "right";
  className?: string;
}

export function Tooltip({
  children,
  text,
  position = "bottom",
  align = "center",
  className = "",
}: TooltipProps) {
  const [visible, setVisible] = useState(false);

  const getPositionClasses = () => {
    if (position === "bottom") {
      if (align === "right") return "top-full right-0 mt-2";
      if (align === "left") return "top-full left-0 mt-2";
      return "top-full left-1/2 -translate-x-1/2 mt-2";
    }
    if (position === "top") {
      if (align === "right") return "bottom-full right-0 mb-2";
      if (align === "left") return "bottom-full left-0 mb-2";
      return "bottom-full left-1/2 -translate-x-1/2 mb-2";
    }
    if (position === "left") {
      return "right-full top-1/2 -translate-y-1/2 mr-2";
    }
    if (position === "right") {
      return "left-full top-1/2 -translate-y-1/2 ml-2";
    }
    return "top-full left-1/2 -translate-x-1/2 mt-2";
  };

  const getArrowClasses = () => {
    if (position === "bottom") {
      const alignClass =
        align === "right"
          ? "right-3"
          : align === "left"
          ? "left-3"
          : "left-1/2 -translate-x-1/2";
      return `bottom-full ${alignClass} border-b-stone-900 border-x-transparent border-t-transparent`;
    }
    if (position === "top") {
      const alignClass =
        align === "right"
          ? "right-3"
          : align === "left"
          ? "left-3"
          : "left-1/2 -translate-x-1/2";
      return `top-full ${alignClass} border-t-stone-900 border-x-transparent border-b-transparent`;
    }
    if (position === "left") {
      return "left-full top-1/2 -translate-y-1/2 border-l-stone-900 border-y-transparent border-r-transparent";
    }
    if (position === "right") {
      return "right-full top-1/2 -translate-y-1/2 border-r-stone-900 border-y-transparent border-l-transparent";
    }
    return "bottom-full left-1/2 -translate-x-1/2 border-b-stone-900 border-x-transparent border-t-transparent";
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          className={`absolute z-50 whitespace-nowrap rounded-lg bg-stone-900 px-2.5 py-1 text-xs font-semibold text-white shadow-lg border border-stone-700 pointer-events-none transition-all duration-150 animate-in fade-in zoom-in-95 ${getPositionClasses()}`}
        >
          {text}
          <div
            className={`absolute border-4 ${getArrowClasses()}`}
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
}

export function InfoHint({
  text,
  position = "top",
  className = "",
}: {
  text: string;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}) {
  return (
    <Tooltip text={text} position={position} className={`inline-block ${className}`}>
      <span
        tabIndex={0}
        aria-label={text}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 text-[10px] font-bold cursor-help hover:bg-primary hover:text-white transition-colors"
      >
        ?
      </span>
    </Tooltip>
  );
}
