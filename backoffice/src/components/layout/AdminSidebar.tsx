"use client";

import React from "react";
import type { AdminRole } from "@/types/api";

export type AdminTabType =
  | "OVERVIEW"
  | "AI_METRICS"
  | "USERS_FAMILIES"
  | "LGPD_GOVERNANCE"
  | "TEAM"
  | "TICKETS"
  | "SETTINGS"
  | "AUDIT";

interface AdminSidebarProps {
  activeTab: AdminTabType;
  onTabChange: (tab: AdminTabType) => void;
  openTicketsCount?: number;
  usersCount?: number;
  teamCount?: number;
  userRole?: AdminRole | null;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function AdminSidebar({
  activeTab,
  onTabChange,
  openTicketsCount = 0,
  usersCount = 0,
  teamCount = 0,
  userRole,
  mobileOpen = false,
  onCloseMobile,
}: AdminSidebarProps) {
  const navItems: {
    id: AdminTabType;
    label: string;
    icon: React.ReactNode;
    badge?: number | string;
    hasSubmenu?: boolean;
  }[] = [
    {
      id: "TEAM",
      label: "Painel Administrativo",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    {
      id: "OVERVIEW",
      label: "Visão Geral & Health",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      id: "AI_METRICS",
      label: "Consumo & Métricas IA",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
    {
      id: "USERS_FAMILIES",
      label: "Usuários & Famílias",
      badge: usersCount > 0 ? usersCount : undefined,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      id: "LGPD_GOVERNANCE",
      label: "Governança & LGPD",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      id: "TEAM",
      label: "Equipe & Acessos",
      hasSubmenu: true,
      badge: teamCount > 0 ? teamCount : undefined,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      id: "TICKETS",
      label: "Chamados Globais",
      badge: openTicketsCount > 0 ? `${openTicketsCount} aberto${openTicketsCount > 1 ? "s" : ""}` : undefined,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      id: "SETTINGS",
      label: "Configurações Globais",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      id: "AUDIT",
      label: "Auditoria do Sistema",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
  ];

  return (
    <>
      {/* Mobile backdrop overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-stone-900/50 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-[260px] flex-col border-r border-stone-200/80 dark:border-stone-800 bg-[#FCF8F2] dark:bg-[#1C1815] transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Top Logo / Branding */}
        <div className="flex h-18 items-center justify-between px-6 border-b border-stone-200/60 dark:border-stone-800/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-sm text-white font-black text-xl">
              🛡️
            </div>
            <div>
              <span className="font-display text-lg font-black tracking-tight text-stone-900 dark:text-stone-100">
                GeLu
              </span>
              <span className="ml-1 font-display text-xs font-bold text-orange-600 dark:text-orange-400 block -mt-1">
                Backoffice
              </span>
            </div>
          </div>

          {/* Close button on mobile */}
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden rounded-lg p-1.5 text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1.5 custom-scrollbar">
          {navItems.map((item, idx) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={`${item.id}-${idx}`}
                type="button"
                onClick={() => {
                  onTabChange(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`group relative flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-[13px] font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-r from-orange-500/15 to-amber-500/10 text-orange-700 dark:text-orange-300 font-bold shadow-2xs"
                    : "text-stone-600 dark:text-stone-400 hover:bg-stone-100/80 dark:hover:bg-stone-800/60 hover:text-stone-900 dark:hover:text-stone-200"
                }`}
              >
                {/* Active Indicator Bar on the left */}
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-orange-600 dark:bg-orange-500" />
                )}

                <div className="flex items-center gap-3">
                  <span
                    className={`shrink-0 transition-colors ${
                      isActive
                        ? "text-orange-600 dark:text-orange-400"
                        : "text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-300"
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        isActive
                          ? "bg-orange-500 text-white"
                          : "bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {item.hasSubmenu && (
                    <svg
                      className={`w-3.5 h-3.5 text-stone-400 transition-transform ${
                        isActive ? "rotate-180 text-orange-600" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer with System Version and Online status */}
        <div className="p-4 border-t border-stone-200/60 dark:border-stone-800/80 space-y-3">
          <div className="rounded-xl border border-stone-200/80 dark:border-stone-800 bg-white/70 dark:bg-stone-900/60 p-3 shadow-2xs">
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-500 dark:text-stone-400 font-medium">Versão do Sistema</span>
              <span className="inline-flex items-center gap-1.5 font-bold text-stone-800 dark:text-stone-200">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </span>
            </div>
            <div className="mt-1 font-display text-sm font-black text-stone-900 dark:text-stone-100">
              v1.0.0
            </div>
          </div>

          <div className="text-[11px] text-stone-400 dark:text-stone-500 text-center leading-tight">
            GeLu Backoffice © 2026<br />Todos os direitos reservados.
          </div>
        </div>
      </aside>
    </>
  );
}
