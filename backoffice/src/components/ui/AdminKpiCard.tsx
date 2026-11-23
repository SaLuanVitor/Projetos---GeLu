"use client";

import React from "react";

export type AdminKpiColorScheme = "orange" | "amber" | "blue" | "emerald";

interface AdminKpiCardProps {
  title: string;
  value: number | string;
  icon: string | React.ReactNode;
  colorScheme: AdminKpiColorScheme;
  subtitle?: string;
  onClick?: () => void;
  active?: boolean;
}

export function AdminKpiCard({
  title,
  value,
  icon,
  colorScheme,
  subtitle,
  onClick,
  active = false,
}: AdminKpiCardProps) {
  // Simple, clean, minimalist styling without wavy blobs
  const colorAccents = {
    orange: {
      activeBorder: "border-orange-500 ring-1 ring-orange-500/30",
      iconBg: "bg-orange-500/10 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400 border border-orange-500/20",
      indicator: "bg-orange-500",
    },
    amber: {
      activeBorder: "border-amber-500 ring-1 ring-amber-500/30",
      iconBg: "bg-amber-500/10 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-500/20",
      indicator: "bg-amber-500",
    },
    blue: {
      activeBorder: "border-sky-500 ring-1 ring-sky-500/30",
      iconBg: "bg-sky-500/10 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400 border border-sky-500/20",
      indicator: "bg-sky-500",
    },
    emerald: {
      activeBorder: "border-emerald-500 ring-1 ring-emerald-500/30",
      iconBg: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-500/20",
      indicator: "bg-emerald-500",
    },
  }[colorScheme] || {
    activeBorder: "border-stone-400",
    iconBg: "bg-stone-100 text-stone-600 border border-stone-200",
    indicator: "bg-stone-500",
  };

  return (
    <div
      onClick={onClick}
      className={`relative rounded-2xl border bg-white dark:bg-stone-900 p-4 shadow-2xs transition-all ${
        active
          ? `${colorAccents.activeBorder} bg-stone-50/50 dark:bg-stone-800/40`
          : "border-stone-200/80 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700"
      } ${onClick ? "cursor-pointer hover:shadow-sm" : ""}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 tracking-tight">
          {title}
        </span>
        <div className={`flex h-8 w-8 items-center justify-center rounded-xl text-sm ${colorAccents.iconBg}`}>
          {icon}
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <div className="font-display text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
          {value}
        </div>
        {subtitle && (
          <span className="text-[11px] font-medium text-stone-400">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
