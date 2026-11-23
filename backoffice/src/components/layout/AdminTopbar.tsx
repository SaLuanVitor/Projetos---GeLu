"use client";

import React, { useState, useRef, useEffect } from "react";
import { ThemeHeaderButton } from "@/components/theme/ThemeHeaderButton";
import type { AdminRole } from "@/types/api";

interface AdminTopbarProps {
  adminEmail?: string;
  adminRole?: AdminRole | null;
  onLogout: () => void;
  onToggleMobileMenu?: () => void;
  onSearch?: (term: string) => void;
}

export function AdminTopbar({
  adminEmail = "admin@gelu.com",
  adminRole,
  onLogout,
  onToggleMobileMenu,
  onSearch,
}: AdminTopbarProps) {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  // Global Ctrl + K shortcut to focus search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Derive user initials (e.g., "LV" from luanvitors or email)
  const getInitials = (email: string) => {
    const namePart = email.split("@")[0].replace(/[^a-zA-Z]/g, "");
    if (namePart.length >= 2) {
      return namePart.substring(0, 2).toUpperCase();
    }
    return "AD";
  };

  const initials = getInitials(adminEmail);

  return (
    <header className="sticky top-0 z-30 flex h-18 w-full items-center justify-between border-b border-stone-200/70 dark:border-stone-800 bg-[#FCF8F2]/90 dark:bg-[#181512]/90 backdrop-blur-md px-4 sm:px-6">
      {/* Left: Mobile hamburger + Global Search Input */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
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

        <div className="relative w-full">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (onSearch) onSearch(e.target.value);
            }}
            placeholder="Buscar no sistema... (Ctrl + K)"
            className="w-full rounded-2xl border border-stone-200/90 dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 py-2 pl-10 pr-16 text-xs text-stone-800 dark:text-stone-200 placeholder-stone-400 focus:border-orange-500 focus:bg-white dark:focus:bg-stone-900 focus:outline-hidden shadow-2xs transition-all"
          />
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden sm:flex items-center pr-3">
            <kbd className="rounded-md border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 text-[10px] font-semibold text-stone-500">
              Ctrl + K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right: Theme Toggle, User Profile Badge & Logout */}
      <div className="flex items-center gap-2.5 sm:gap-3 ml-4">
        <ThemeHeaderButton />

        {/* Profile Pill & Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2.5 rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 py-1.5 pl-2 pr-3 text-xs font-semibold text-stone-800 dark:text-stone-200 hover:border-orange-400 shadow-2xs transition-all cursor-pointer"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-[11px] font-black text-white shadow-xs">
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

        {/* Dedicated Logout Button matching Mockup */}
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-1.5 rounded-2xl border border-stone-200/90 dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 px-3.5 py-2 text-xs font-bold text-stone-700 dark:text-stone-300 hover:border-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 shadow-2xs transition-all cursor-pointer"
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
