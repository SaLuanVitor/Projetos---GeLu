"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";

export function LocaleSwitcher({ className = "" }: { className?: string }) {
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("LocaleSwitcher");

  return (
    <label
      className={`inline-flex items-center gap-2 text-sm font-bold text-tertiary ${className}`}
    >
      <span>{t("label")}</span>
      <select
        className="rounded-lg border-2 border-outline bg-surface-container-low px-2 py-1 text-sm font-bold text-tertiary outline-none focus:border-primary"
        value={locale}
        onChange={(event) => router.replace(pathname, { locale: event.target.value as AppLocale })}
      >
        {routing.locales.map((item) => (
          <option key={item} value={item}>
            {t(item)}
          </option>
        ))}
      </select>
    </label>
  );
}
