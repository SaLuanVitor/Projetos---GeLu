"use client";

import React, { useState, useRef, useEffect } from "react";
import { ThemeHeaderButton } from "@/components/theme/ThemeHeaderButton";
import type { AdminRole } from "@/types/api";

interface AdminTopbarProps {
  adminEmail?: string;
  adminRole?: AdminRole | null;
  onLogout: () => void;
  onToggleMobileMenu?: () => void;
}

export function AdminTopbar({
  adminEmail = "admin@gelu.com",
  adminRole,
  onLogout,
  onToggleMobileMenu,
}: AdminTopbarProps) {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Derive user initials (e.g., "LV" from luanvitors or email)
  const getInitials = (email: string) => {
    if (!email) return "AD";
    const namePart = email.split("@")[0].replace(/[^a-zA-Z]/g, "");
    if (namePart.length >= 2) {
      return namePart.substring(0, 2).toUpperCase();
    }
    return "AD";
  };

  const initials = getInitials(adminEmail);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-stone-200/70 dark:border-stone-800 bg-[#FCF8F2]/90 dark:bg-[#181512]/90 backdrop-blur-md px-4 sm:px-6">
      {/* Left: Mobile hamburger + Module identification */}
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800 focus:outline-hidden"
            aria-label="Abrir menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        <div className="hidden sm:flex items-center gap-2 text-xs text-stone-500 font-medium">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
          <span>Console de Governança & Administração</span>
        </div>
      </div>

      {/* Right: Theme Toggle, User Profile Badge & Logout */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <ThemeHeaderButton />

        {/* Profile Pill & Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2.5 rounded-xl border border-stone-200/80 dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 py-1.5 pl-2 pr-3 text-xs font-semibold text-stone-800 dark:text-stone-200 hover:border-orange-400 shadow-2xs transition-all cursor-pointer"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-600 text-[11px] font-black text-white shadow-xs">
              {initials}
            </span>
            <span className="hidden md:inline-block max-w-[180px] truncate">
              {adminEmail}
            </span>
            <svg
              className={`w-3.5 h-3.5 text-stone-400 transition-transform ${profileDropdownOpen ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-2 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="border-b border-stone-100 dark:border-stone-800 p-2.5">
                <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">{adminEmail}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700 px-2 py-0.5 text-[10px] font-extrabold uppercase">
                    {adminRole === "SUPER_ADMIN" ? "👑 Super Admin" : adminRole === "ADMIN" ? "🛡️ Admin Operacional" : "🎧 Suporte & Leitura"}
                  </span>
                </div>
              </div>

              <div className="p-1 space-y-1">
                <div className="px-2.5 py-2 text-[11px] text-stone-500 dark:text-stone-400">
                  Sessão ativa sob conformidade LGPD & logs de auditoria imutáveis.
                </div>
              </div>

              <div className="border-t border-stone-100 dark:border-stone-800 p-1">
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Encerrar Sessão
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Dedicated Logout Button */}
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-1.5 rounded-xl border border-stone-200/90 dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 px-3 py-1.5 text-xs font-bold text-stone-700 dark:text-stone-300 hover:border-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 shadow-2xs transition-all cursor-pointer"
        >
          <svg className="w-4 h-4 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    </header>
  );
}
