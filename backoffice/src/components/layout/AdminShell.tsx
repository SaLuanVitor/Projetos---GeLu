"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeHeaderButton } from "@/components/theme/ThemeHeaderButton";
import { ActionButton } from "@/components/ui/ActionButton";
import { getCurrentUser } from "@/services/auth";
import { clearSession } from "@/services/session";
import { useEffect, useState } from "react";

interface AdminShellProps {
  children: ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const router = useRouter();
  const [adminEmail, setAdminEmail] = useState<string>("");

  useEffect(() => {
    getCurrentUser().then((u) => {
      if (u) setAdminEmail(u.email);
    }).catch(() => {});
  }, []);

  const handleLogout = () => {
    clearSession();
    router.push("/login");
  };

  return (
    <div className="paper-canvas min-h-screen bg-surface text-on-surface">
      <header className="sticky top-0 z-30 border-b border-surface-variant bg-surface/96 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🛡️</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-xl font-black text-primary">
                  GeLu Backoffice
                </span>
                <span className="rounded-full bg-amber-500/15 border border-amber-500/40 px-2 py-0.5 text-[10px] font-extrabold uppercase text-amber-700 dark:text-amber-300">
                  Super Admin
                </span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Governança, Métricas, Suporte e Configuração Global
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeHeaderButton />
            {adminEmail && (
              <span className="hidden sm:inline-block text-xs font-semibold text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700">
                👤 {adminEmail}
              </span>
            )}
            <ActionButton
              onClick={handleLogout}
              variant="outline"
            >
              Sair
            </ActionButton>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        {children}
      </main>

      <footer className="mt-14 border-t border-dashed border-stone-200 dark:border-stone-800 px-5 py-6 text-center text-xs text-stone-500">
        <p>🛡️ <strong>GeLu Plataforma</strong> — Console de Governança & Administração do Sistema</p>
        <p className="mt-1 text-[11px] text-stone-400">Acesso restrito e auditado • Painel exclusivo para contas Super Admin</p>
      </footer>
    </div>
  );
}
