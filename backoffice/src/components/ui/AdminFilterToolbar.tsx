"use client";

import React from "react";
import type { AdminRole } from "@/types/api";

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
  searchPlaceholder = "Buscar por nome, e-mail ou perfil...",
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
            className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white px-4 py-2.5 text-xs font-black shadow-sm transition-all hover:shadow-md cursor-pointer shrink-0"
          >
            <span className="text-base leading-none">+</span>
            <span>{primaryActionLabel}</span>
          </button>
        )}
      </div>

      {/* Filter Controls Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5">
        {/* Search Input */}
        <div className="relative lg:col-span-5">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-2xl border border-stone-200/90 dark:border-stone-800 bg-white dark:bg-stone-900/90 py-2.5 pl-10 pr-4 text-xs text-stone-800 dark:text-stone-200 placeholder-stone-400 focus:border-orange-500 focus:outline-hidden shadow-2xs"
          />
        </div>

        {/* Roles Filter Dropdown */}
        {showRoleFilter && onRoleFilterChange && (
          <div className="lg:col-span-3">
            <select
              value={selectedRoleFilter}
              onChange={(e) => onRoleFilterChange(e.target.value)}
              className="w-full rounded-2xl border border-stone-200/90 dark:border-stone-800 bg-white dark:bg-stone-900/90 px-3.5 py-2.5 text-xs font-semibold text-stone-700 dark:text-stone-300 focus:border-orange-500 focus:outline-hidden shadow-2xs cursor-pointer"
            >
              <option value="ALL">Todos os Perfis</option>
              <option value="SUPER_ADMIN">👑 Super Admin</option>
              <option value="ADMIN">🛡️ Admin Operacional</option>
              <option value="SUPPORT">🎧 Suporte & Leitura</option>
            </select>
          </div>
        )}

        {/* Status Filter Dropdown */}
        {onStatusFilterChange && (
          <div className="lg:col-span-2">
            <select
              value={selectedStatusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="w-full rounded-2xl border border-stone-200/90 dark:border-stone-800 bg-white dark:bg-stone-900/90 px-3.5 py-2.5 text-xs font-semibold text-stone-700 dark:text-stone-300 focus:border-orange-500 focus:outline-hidden shadow-2xs cursor-pointer"
            >
              <option value="ALL">Todos os Status</option>
              <option value="ACTIVE">● Ativo</option>
              <option value="INACTIVE">○ Inativo</option>
            </select>
          </div>
        )}

        {/* Date Filter Dropdown */}
        {onDateFilterChange && (
          <div className="lg:col-span-2">
            <select
              value={selectedDateFilter}
              onChange={(e) => onDateFilterChange(e.target.value)}
              className="w-full rounded-2xl border border-stone-200/90 dark:border-stone-800 bg-white dark:bg-stone-900/90 px-3.5 py-2.5 text-xs font-semibold text-stone-700 dark:text-stone-300 focus:border-orange-500 focus:outline-hidden shadow-2xs cursor-pointer"
            >
              <option value="ALL">📅 Cadastrado em (Todos)</option>
              <option value="7D">Últimos 7 dias</option>
              <option value="30D">Últimos 30 dias</option>
              <option value="THIS_MONTH">Este mês</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
