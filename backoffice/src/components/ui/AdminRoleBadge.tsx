"use client";

import React from "react";
import type { AdminRole } from "@/types/api";

interface AdminRoleBadgeProps {
  role: AdminRole;
}

export function AdminRoleBadge({ role }: AdminRoleBadgeProps) {
  if (role === "SUPER_ADMIN") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 dark:border-amber-700 bg-amber-100/80 dark:bg-amber-950/50 px-3 py-1 text-xs font-black text-amber-900 dark:text-amber-200 shadow-2xs">
        <span>👑</span>
        <span>Super Admin</span>
      </span>
    );
  }

  if (role === "ADMIN") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-300 dark:border-sky-700 bg-sky-100/80 dark:bg-sky-950/50 px-3 py-1 text-xs font-black text-sky-900 dark:text-sky-200 shadow-2xs">
        <span>🛡️</span>
        <span>Admin Operacional</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 dark:border-emerald-700 bg-emerald-100/80 dark:bg-emerald-950/50 px-3 py-1 text-xs font-black text-emerald-900 dark:text-emerald-200 shadow-2xs">
      <span>🎧</span>
      <span>Suporte & Leitura</span>
    </span>
  );
}

interface AdminStatusBadgeProps {
  active: boolean;
}

export function AdminStatusBadge({ active }: AdminStatusBadgeProps) {
  if (active) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Ativo
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 px-2.5 py-0.5 text-xs font-bold text-stone-600 dark:text-stone-400">
      <span className="h-1.5 w-1.5 rounded-full bg-stone-400" />
      Inativo
    </span>
  );
}
