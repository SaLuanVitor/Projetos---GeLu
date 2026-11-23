"use client";

import React from "react";

interface AdminFilterToolbarProps {
  title: string;
  subtitle: string;
  searchPlaceholder?: string;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedRoleFilter?: string;
  onRoleFilterChange?: (role: string) => void;
  selectedStatusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
  selectedDateFilter?: string;
  onDateFilterChange?: (date: string) => void;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  showRoleFilter?: boolean;
}

export function AdminFilterToolbar({
  title,
  subtitle,
  searchPlaceholder = "Buscar por nome ou e-mail...",
  searchTerm,
  onSearchChange,
  selectedRoleFilter = "ALL",
  onRoleFilterChange,
  selectedStatusFilter = "ALL",
  onStatusFilterChange,
  selectedDateFilter = "ALL",
  onDateFilterChange,
  primaryActionLabel,
  onPrimaryAction,
  showRoleFilter = true,
}: AdminFilterToolbarProps) {
  const selectCls =
    "h-9 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-3 text-xs font-medium text-stone-700 dark:text-stone-300 focus:border-orange-500 focus:outline-none shadow-xs cursor-pointer";

  return (
    <div className="space-y-4">
      {/* Header with Title and Action CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg sm:text-xl font-black text-stone-900 dark:text-stone-100">
            {title}
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
            {subtitle}
          </p>
        </div>

        {primaryActionLabel && onPrimaryAction && (
          <button
            type="button"
            onClick={onPrimaryAction}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0"
          >
            <span className="text-base leading-none">+</span>
            <span>{primaryActionLabel}</span>
          </button>
        )}
      </div>

      {/* Filter Controls Row — All in one row */}
      <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-0.5">
        {/* Search Input */}
        <div className="relative w-48 sm:w-56 md:w-64 shrink-0">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-9 w-full rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 pl-9 pr-3 text-xs text-stone-800 dark:text-stone-200 placeholder-stone-400 focus:border-orange-500 focus:outline-none transition-all shadow-xs"
          />
        </div>

        {/* Roles Filter Dropdown */}
        {showRoleFilter && onRoleFilterChange && (
          <select
            value={selectedRoleFilter}
            onChange={(e) => onRoleFilterChange(e.target.value)}
            className={`${selectCls} shrink-0`}
          >
            <option value="ALL">Todos os Perfis</option>
            <option value="SUPER_ADMIN">👑 Super Admin</option>
            <option value="ADMIN">🛡️ Admin Operacional</option>
            <option value="SUPPORT">🎧 Suporte & Leitura</option>
          </select>
        )}

        {/* Status Filter Dropdown */}
        {onStatusFilterChange && (
          <select
            value={selectedStatusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className={`${selectCls} shrink-0`}
          >
            <option value="ALL">Todos os Status</option>
            <option value="ACTIVE">● Ativo</option>
            <option value="INACTIVE">○ Inativo</option>
          </select>
        )}

        {/* Date Filter Dropdown */}
        {onDateFilterChange && (
          <select
            value={selectedDateFilter}
            onChange={(e) => onDateFilterChange(e.target.value)}
            className={`${selectCls} shrink-0`}
          >
            <option value="ALL">📅 Data (Todos)</option>
            <option value="7D">Últimos 7 dias</option>
            <option value="30D">Últimos 30 dias</option>
            <option value="THIS_MONTH">Este mês</option>
          </select>
        )}
      </div>
    </div>
  );
}
