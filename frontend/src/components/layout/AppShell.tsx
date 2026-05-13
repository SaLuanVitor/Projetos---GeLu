"use client";

import { getValidSession } from "@/services/auth";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { PageDecor, type PageDecorVariant } from "@/components/layout/PageDecor";

const INTERNAL_HOME_PATH = "/dashboard";

const navItems = [
  { href: INTERNAL_HOME_PATH, labelKey: "home" },
  { href: "/receitas", labelKey: "recipes" },
  { href: "/dieta-semanal", labelKey: "weeklyDiet" },
  { href: "/familia", labelKey: "family" },
  { href: "/perfil/evolucao", labelKey: "evolution" },
  { href: "/sugestoes-ia", labelKey: "ai" }
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("Shell");
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    getValidSession().then((session) => {
      if (!session) {
        router.replace("/login");
        return;
      }

      setSessionChecked(true);
    });
  }, [router]);

  if (!sessionChecked) {
    return <div className="paper-canvas min-h-screen bg-surface text-on-surface" />;
  }

  return (
    <div className="paper-canvas min-h-screen bg-surface text-on-surface">
      <PageDecor variant={getDecorVariant(pathname)} />
      <header className="sticky top-0 z-30 border-b border-surface-variant bg-surface/96 backdrop-blur">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-5 py-4 lg:grid-cols-[240px_1fr_160px] lg:items-center">
          <Link
            className="font-display text-3xl font-extrabold leading-none text-primary"
            href={INTERNAL_HOME_PATH}
          >
            GeLu - Menu
          </Link>

          <nav className="flex gap-3 overflow-x-auto pb-1 lg:justify-center lg:overflow-visible lg:pb-0">
            {navItems.map((item, index) => {
              const active = isActiveRoute(pathname, item.href);
              return (
                <Link
                  className={`shrink-0 rounded-lg border-2 px-4 py-2 text-sm font-bold transition-transform hover:rotate-1 ${
                    active
                      ? "rotate-[-1deg] border-tertiary bg-primary-container text-on-primary shadow-label"
                      : "border-transparent text-on-surface hover:border-outline hover:bg-surface-container-low"
                  }`}
                  href={item.href}
                  key={item.href}
                  style={{
                    transform: active
                      ? undefined
                      : `rotate(${index % 2 === 0 ? "-0.5deg" : "0.5deg"})`
                  }}
                >
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3 lg:justify-end">
            <Link
              aria-label={t("help")}
              className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-primary bg-surface text-base font-extrabold text-primary transition-transform hover:rotate-6"
              href="/ajuda"
            >
              ?
            </Link>
            <Link
              aria-label={t("profile")}
              className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-base font-extrabold transition-transform hover:rotate-6 ${
                isActiveRoute(pathname, "/perfil")
                  ? "border-tertiary bg-primary-container text-on-primary"
                  : "border-primary bg-surface text-primary"
              }`}
              href="/perfil"
            >
              o
            </Link>
          </div>
        </div>
      </header>
      {children}
      <footer className="mt-14 border-t border-dashed border-outline-variant px-5 py-10 text-center text-sm text-on-surface-variant">
        <strong className="font-display text-2xl text-primary">GeLu - Menu</strong>
        <p className="mt-5">{t("copyright")}</p>
        <div className="mt-5 flex justify-center gap-7 underline decoration-dotted underline-offset-4">
          <Link href="/ajuda">{t("privacy")}</Link>
          <Link href="/ajuda">{t("terms")}</Link>
          <Link href="/ajuda">{t("support")}</Link>
        </div>
      </footer>
    </div>
  );
}

function isActiveRoute(pathname: string, href: string) {
  if (href === INTERNAL_HOME_PATH || href === "/perfil") {
    return pathname === href;
  }

  return pathname.startsWith(href);
}

function getDecorVariant(pathname: string): PageDecorVariant {
  if (pathname === "/dashboard") {
    return "dashboard";
  }

  if (pathname === "/receitas") {
    return "recipes";
  }

  if (pathname === "/receitas/nova" || pathname.endsWith("/editar")) {
    return "recipe-form";
  }

  if (pathname.startsWith("/receitas/")) {
    return "recipe-detail";
  }

  if (pathname === "/perfil/evolucao") {
    return "evolution";
  }

  if (pathname === "/perfil") {
    return "profile";
  }

  return "default";
}
