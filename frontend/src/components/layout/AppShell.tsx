"use client";

import { getValidSession } from "@/services/auth";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

const INTERNAL_HOME_PATH = "/dashboard";

const navItems = [
  { href: INTERNAL_HOME_PATH, labelKey: "home" },
  { href: "/receitas", labelKey: "recipes" },
  { href: "/dieta-semanal", labelKey: "weeklyDiet" },
  { href: "/familia", labelKey: "family" },
  { href: "/perfil/evolucao", labelKey: "evolution" },
  { href: "/sugestoes-ia", labelKey: "ai" },
  { href: "/ajuda", labelKey: "help" },
  { href: "/perfil", labelKey: "profile" }
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("Shell");
  const brand = useTranslations("Brand");
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
      <header className="sticky top-0 z-30 border-b-2 border-outline bg-surface/95 shadow-paper backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <Link className="inline-flex items-end gap-3" href={INTERNAL_HOME_PATH}>
            <span className="flex h-11 w-11 rotate-[-3deg] items-center justify-center rounded-lg border-2 border-tertiary bg-primary-fixed font-display text-xl font-extrabold text-primary shadow-label">
              GL
            </span>
            <span>
              <span className="block font-display text-3xl font-extrabold leading-none text-primary">
                GeLu - Menu
              </span>
              <span className="block text-xs font-bold uppercase tracking-wide text-tertiary">
                {brand("tagline")}
              </span>
            </span>
          </Link>

          <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:justify-end lg:overflow-visible lg:pb-0">
            {navItems.map((item, index) => {
              const active = isActiveRoute(pathname, item.href);
              return (
                <Link
                  className={`shrink-0 rounded-lg border-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-transform hover:rotate-1 ${
                    active
                      ? "rotate-[-1deg] border-tertiary bg-primary-container text-on-primary-container shadow-label"
                      : "border-transparent text-on-surface-variant hover:border-outline hover:bg-surface-container-low"
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
        </div>
      </header>
      {children}
      <footer className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-8 text-sm text-on-surface-variant sm:flex-row sm:items-center sm:justify-between">
        <strong className="font-display text-xl text-primary">GeLu - Menu</strong>
        <span>{t("footer")}</span>
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
