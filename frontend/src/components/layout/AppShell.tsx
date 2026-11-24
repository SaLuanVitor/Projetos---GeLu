"use client";

import { getValidSession } from "@/services/auth";
import { loadSession } from "@/services/session";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { ThemeHeaderButton } from "@/components/theme/ThemeHeaderButton";
import { Tooltip } from "@/components/ui/Tooltip";
import { PageDecor, type PageDecorVariant } from "@/components/layout/PageDecor";
import { CoupleNotePopupListener } from "@/components/couplenotes/CoupleNotePopupListener";
import { FamilyContextSwitcher } from "@/components/layout/FamilyContextSwitcher";
import { useFamilyContext } from "@/contexts/FamilyContext";
import { useFamilySocket } from "@/hooks/useFamilySocket";
import {
  Home,
  CalendarDays,
  UtensilsCrossed,
  BookOpen,
  HeartHandshake,
  Users,
  TrendingUp,
  Sparkles,
  HelpCircle,
  User,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";

const INTERNAL_HOME_PATH = "/dashboard";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { href: INTERNAL_HOME_PATH, label: "Início", icon: Home },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/dieta-semanal", label: "Dieta", icon: UtensilsCrossed },
  { href: "/receitas", label: "Receitas", icon: BookOpen },
  { href: "/espaco", label: "Nosso Espaço", icon: HeartHandshake },
  { href: "/familia", label: "Família", icon: Users },
  { href: "/perfil/evolucao", label: "Evolução", icon: TrendingUp },
  { href: "/sugestoes-ia", label: "Chef IA", icon: Sparkles },
];

const allNavItems: NavItem[] = [
  { href: INTERNAL_HOME_PATH, label: "Início", icon: Home },
  { href: "/agenda", label: "Agenda do Casal", icon: CalendarDays },
  { href: "/dieta-semanal", label: "Cardápio & Dieta", icon: UtensilsCrossed },
  { href: "/receitas", label: "Livro de Receitas", icon: BookOpen },
  { href: "/espaco", label: "Nosso Espaço", icon: HeartHandshake },
  { href: "/familia", label: "Família & Convites", icon: Users },
  { href: "/perfil/evolucao", label: "Evolução & Peso", icon: TrendingUp },
  { href: "/sugestoes-ia", label: "Chef IA Sugestões", icon: Sparkles },
  { href: "/suporte", label: "Central de Ajuda", icon: HelpCircle },
  { href: "/perfil", label: "Meu Perfil", icon: User },
];

const mobileBottomTabs: NavItem[] = [
  { href: "/dashboard", label: "Início", icon: Home },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/dieta-semanal", label: "Dieta", icon: UtensilsCrossed },
  { href: "/espaco", label: "Espaço", icon: HeartHandshake },
  { href: "/perfil", label: "Perfil", icon: User },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sessionChecked, setSessionChecked] = useState(() => {
    if (typeof window !== "undefined") {
      return !!loadSession();
    }
    return false;
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { activeFamily } = useFamilyContext();

  // Ativa WebSocket em tempo real para o ID da família ativa
  useFamilySocket(activeFamily?.id);

  useEffect(() => {
    getValidSession().then((session) => {
      if (!session) {
        router.replace("/login");
        return;
      }

      setSessionChecked(true);
    });
  }, [router]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (!sessionChecked) {
    return <div className="paper-canvas min-h-screen bg-surface text-on-surface" />;
  }

  return (
    <div className="paper-canvas min-h-screen bg-surface text-on-surface pb-20 lg:pb-0">
      <PageDecor variant={getDecorVariant(pathname)} />

      {/* Top Header */}
      <header className="sticky top-0 z-50 border-b-2 border-stone-200/90 dark:border-stone-800 bg-[#fef9ed] dark:bg-[#1c1612] shadow-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {/* Linha Superior: Marca, Seletor de Contexto e Ações */}
          <div className="relative z-30 flex items-center justify-between gap-4 py-3">
            {/* Logo GeLu + Context Switcher */}
            <div className="flex items-center gap-3 shrink-0">
              <Link className="inline-flex items-end gap-2.5 group" href={INTERNAL_HOME_PATH}>
                <span className="flex h-10 w-10 rotate-[-3deg] items-center justify-center rounded-xl border-2 border-tertiary bg-primary-fixed font-display text-lg font-black text-primary shadow-label group-hover:rotate-0 transition-transform">
                  GL
                </span>
                <span className="flex flex-col">
                  <span className="font-display text-2xl font-black leading-none text-primary tracking-tight">
                    GeLu
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-tertiary/90">
                    Menu Afetivo
                  </span>
                </span>
              </Link>

              <div className="h-6 w-px bg-stone-300 dark:bg-stone-700 hidden sm:block" />

              <FamilyContextSwitcher />
            </div>

            {/* Ações do Topo */}
            <div className="flex items-center gap-2 shrink-0">
              <ThemeHeaderButton />

              <Tooltip text="Central de Ajuda & Dúvidas" position="bottom">
                <Link
                  aria-label="Ajuda"
                  className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-primary bg-surface dark:bg-stone-800 text-primary transition-transform hover:rotate-6 shadow-sm"
                  href="/suporte"
                >
                  <HelpCircle className="w-4 h-4" />
                </Link>
              </Tooltip>

              <Tooltip text="Meu Perfil & Configurações" position="bottom">
                <Link
                  aria-label="Perfil"
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-extrabold transition-transform hover:rotate-6 shadow-sm ${
                    isActiveRoute(pathname, "/perfil")
                      ? "border-tertiary bg-primary text-white"
                      : "border-primary bg-surface dark:bg-stone-800 text-primary"
                  }`}
                  href="/perfil"
                >
                  <User className="w-4 h-4" />
                </Link>
              </Tooltip>

              {/* Botão de Menu para Telas Menores */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl border-2 border-outline/50 bg-[#fffdfa] dark:bg-stone-800 text-stone-800 dark:text-stone-100 font-bold hover:border-primary transition-all cursor-pointer shadow-xs"
                aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu completo"}
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Linha Inferior: Abas de Navegação Estilo Caderno (Desktop & Tablet) */}
          <nav className="relative z-10 hidden lg:flex items-center justify-center gap-2 py-2.5 border-t border-stone-200/60 dark:border-stone-800/80 flex-wrap">
            {navItems.map((item) => {
              const active = isActiveRoute(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group inline-flex items-center gap-1.5 rounded-xl border-2 px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-wide transition-colors duration-150 cursor-pointer ${
                    active
                      ? "border-tertiary bg-primary text-white shadow-sm"
                      : "border-stone-300 dark:border-stone-700/80 bg-[#fffdfa] dark:bg-[#25201c] text-stone-800 dark:text-stone-200 shadow-2xs hover:border-tertiary hover:bg-amber-500/15 hover:text-primary"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 group-hover:scale-110 transition-transform stroke-[2]" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Gaveta de Menu Completo no Mobile/Tablet */}
          {mobileMenuOpen && (
            <div className="lg:hidden py-3 border-t-2 border-stone-200 dark:border-stone-800 grid grid-cols-2 gap-2 animate-in slide-in-from-top-2 duration-150">
              {allNavItems.map((item) => {
                const active = isActiveRoute(pathname, item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 rounded-xl border-2 p-2.5 text-xs font-bold transition-all ${
                      active
                        ? "border-tertiary bg-primary text-white shadow-sm"
                        : "border-stone-200 dark:border-stone-700 bg-[#fffdfa] dark:bg-[#25201c] text-stone-800 dark:text-stone-200 hover:border-primary"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0 stroke-[1.75]" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </header>

      {/* Conteúdo Principal */}
      {children}

      {/* Bottom Bar Mobile (Estilo Protótipo) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t-2 border-surface-variant bg-surface/96 backdrop-blur px-2 py-1.5 flex justify-around shadow-2xl">
        {mobileBottomTabs.map((tab) => {
          const active = isActiveRoute(pathname, tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center px-3 py-1 rounded-xl transition-all ${
                active
                  ? "text-primary font-bold bg-primary/10 scale-105"
                  : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5 stroke-[1.75]" />
              <span className="text-[10px] tracking-tight">{tab.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Desktop */}
      <footer className="mt-14 border-t border-dashed border-outline-variant px-5 py-10 text-center text-sm text-on-surface-variant">
        <strong className="font-display text-2xl text-primary">GeLu - Menu</strong>
        <p className="mt-2 text-xs text-stone-500">Caderno familiar de refeições, rotina e bem-estar compartilhado.</p>
        <div className="mt-4 flex justify-center gap-6 text-xs underline decoration-dotted underline-offset-4">
          <Link href="/ajuda">Privacidade & Termos</Link>
          <Link href="/suporte" className="inline-flex items-center gap-1.5 hover:text-primary transition-colors">
            <HelpCircle className="w-3.5 h-3.5 stroke-[1.75]" />
            <span>Central de Ajuda & Dúvidas</span>
          </Link>
        </div>
      </footer>

      <CoupleNotePopupListener />
    </div>
  );
}

function isActiveRoute(pathname: string, target: string) {
  if (target === INTERNAL_HOME_PATH) {
    return pathname === "/" || pathname === INTERNAL_HOME_PATH;
  }
  return pathname.startsWith(target);
}

function getDecorVariant(pathname: string): PageDecorVariant {
  if (pathname === "/receitas/nova") return "recipe-form";
  if (pathname.startsWith("/receitas/")) return "recipe-detail";
  if (pathname.startsWith("/receitas")) return "recipes";
  if (pathname.startsWith("/perfil/evolucao")) return "evolution";
  if (pathname.startsWith("/perfil")) return "profile";
  if (pathname.startsWith("/dashboard")) return "dashboard";
  return "default";
}
