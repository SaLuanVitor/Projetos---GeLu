"use client";

import React from "react";
import type { AdminRole } from "@/types/api";
import {
  LayoutDashboard,
  Activity,
  BrainCircuit,
  Users,
  ShieldCheck,
  ShieldAlert,
  UserCog,
  LifeBuoy,
  Settings,
  ScrollText,
  ChevronDown,
  X,
} from "lucide-react";

export type AdminTabType =
  | "DASHBOARD"
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
      id: "DASHBOARD",
      label: "Painel Executivo",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: "AI_METRICS",
      label: "Consumo & Métricas IA",
      icon: <BrainCircuit className="w-5 h-5" />,
    },
    {
      id: "USERS_FAMILIES",
      label: "Usuários & Famílias",
      badge: usersCount > 0 ? usersCount : undefined,
      icon: <Users className="w-5 h-5" />,
    },
    {
      id: "LGPD_GOVERNANCE",
      label: "Governança & LGPD",
      icon: <ShieldAlert className="w-5 h-5" />,
    },
    {
      id: "TEAM",
      label: "Equipe & Acessos",
      hasSubmenu: true,
      badge: teamCount > 0 ? teamCount : undefined,
      icon: <UserCog className="w-5 h-5" />,
    },
    {
      id: "TICKETS",
      label: "Chamados Globais",
      badge: openTicketsCount > 0 ? `${openTicketsCount} aberto${openTicketsCount > 1 ? "s" : ""}` : undefined,
      icon: <LifeBuoy className="w-5 h-5" />,
    },
    {
      id: "SETTINGS",
      label: "Configurações Globais",
      icon: <Settings className="w-5 h-5" />,
    },
    {
      id: "AUDIT",
      label: "Auditoria do Sistema",
      icon: <ScrollText className="w-5 h-5" />,
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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-600 via-orange-600 to-amber-700 shadow-md text-amber-100 border border-amber-400/40">
              <ShieldCheck className="w-5 h-5 text-amber-100" />
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
              <X className="w-5 h-5" />
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
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-stone-400 transition-transform ${
                        isActive ? "rotate-180 text-orange-600" : ""
                      }`}
                    />
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
