"use client";

import React from "react";

interface AdminPageHeaderProps {
  breadcrumbs: { label: string; active?: boolean }[];
  title: string;
  subtitle: string;
  onViewLgpdDetails?: () => void;
  isLgpdActive?: boolean;
}

export function AdminPageHeader({
  breadcrumbs,
  title,
  subtitle,
  onViewLgpdDetails,
  isLgpdActive = true,
}: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
      {/* Left: Breadcrumbs + Title + Subtitle */}
      <div>
        <nav className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 mb-1.5">
          <span className="text-sm">🏠</span>
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              <span className="text-stone-300 dark:text-stone-600">›</span>
              <span
                className={
                  crumb.active
                    ? "font-bold text-stone-800 dark:text-stone-200"
                    : "text-stone-500 dark:text-stone-400"
                }
              >
                {crumb.label}
              </span>
            </React.Fragment>
          ))}
        </nav>

        <h1 className="font-display text-2xl sm:text-3xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
          {title}
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-stone-500 dark:text-stone-400 font-medium max-w-2xl">
          {subtitle}
        </p>
      </div>

      {/* Right: LGPD Compliance Card matching the mockup */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200/90 dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 p-3 sm:px-4 sm:py-3 shadow-2xs shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 dark:bg-orange-950/40 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-lg">
            🛡️
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                Proteção de Dados (LGPD)
              </span>
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  isLgpdActive ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
                }`}
              />
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              {isLgpdActive
                ? "Em conformidade com a Lei 13.709/2018."
                : "Atenção: Modo revelado em andamento."}
            </p>
          </div>
        </div>

        {onViewLgpdDetails && (
          <button
            type="button"
            onClick={onViewLgpdDetails}
            className="ml-2 inline-flex items-center gap-1 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-3 py-1.5 text-xs font-bold text-stone-700 dark:text-stone-200 hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 hover:text-orange-600 transition-all cursor-pointer whitespace-nowrap"
          >
            <span>Ver detalhes</span>
            <span className="text-stone-400 group-hover:text-orange-600">→</span>
          </button>
        )}
      </div>
    </div>
  );
}
