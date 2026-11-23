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
  const schemeStyles = {
    orange: {
      border: active ? "border-orange-500 ring-2 ring-orange-500/20" : "border-stone-200/90 dark:border-stone-800",
      bg: "bg-white/80 dark:bg-stone-900/80",
      iconBg: "bg-orange-500/10 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400 border border-orange-500/20",
      waveColor: "rgba(234, 88, 12, 0.12)",
      textValue: "text-stone-900 dark:text-stone-100",
    },
    amber: {
      border: active ? "border-amber-500 ring-2 ring-amber-500/20" : "border-stone-200/90 dark:border-stone-800",
      bg: "bg-white/80 dark:bg-stone-900/80",
      iconBg: "bg-amber-500/10 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-500/20",
      waveColor: "rgba(217, 119, 6, 0.12)",
      textValue: "text-stone-900 dark:text-stone-100",
    },
    blue: {
      border: active ? "border-sky-500 ring-2 ring-sky-500/20" : "border-stone-200/90 dark:border-stone-800",
      bg: "bg-white/80 dark:bg-stone-900/80",
      iconBg: "bg-sky-500/10 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400 border border-sky-500/20",
      waveColor: "rgba(2, 132, 199, 0.12)",
      textValue: "text-stone-900 dark:text-stone-100",
    },
    emerald: {
      border: active ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-stone-200/90 dark:border-stone-800",
      bg: "bg-white/80 dark:bg-stone-900/80",
      iconBg: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-500/20",
      waveColor: "rgba(16, 185, 129, 0.12)",
      textValue: "text-stone-900 dark:text-stone-100",
    },
  }[colorScheme];

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl border p-4.5 shadow-2xs transition-all ${schemeStyles.border} ${schemeStyles.bg} ${
        onClick ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-md" : ""
      }`}
    >
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl shadow-xs ${schemeStyles.iconBg}`}>
            {icon}
          </div>
          <div>
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 block tracking-tight">
              {title}
            </span>
            <span className={`font-display text-2xl sm:text-3xl font-black tracking-tight ${schemeStyles.textValue}`}>
              {value}
            </span>
            {subtitle && (
              <span className="text-[11px] text-stone-400 block mt-0.5">
                {subtitle}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Decorative Wave SVG matching the Mockup */}
      <svg
        className="pointer-events-none absolute right-0 bottom-0 h-16 w-36 opacity-90 transition-opacity"
        viewBox="0 0 144 60"
        fill="none"
        preserveAspectRatio="none"
      >
        <path
          d="M0 45C30 45 42 15 72 25C102 35 114 5 144 12V60H0V45Z"
          fill={schemeStyles.waveColor}
        />
        <path
          d="M0 50C25 50 48 30 75 35C100 40 120 20 144 26V60H0V50Z"
          fill={schemeStyles.waveColor}
          fillOpacity="0.6"
        />
      </svg>
    </div>
  );
}
