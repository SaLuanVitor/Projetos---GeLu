import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ActionLink } from "@/components/ui/ActionButton";

export function PublicShell({
  actionHref,
  actionLabel,
  children
}: {
  actionHref?: string;
  actionLabel?: string;
  children: ReactNode;
}) {
  const brand = useTranslations("Brand");
  const shell = useTranslations("Shell");

  return (
    <div className="paper-canvas min-h-screen bg-surface text-on-surface">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-6">
        <Link className="inline-flex items-end gap-3" href="/">
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

        <div className="flex shrink-0 items-center gap-2">
          <ActionLink href="/" variant="outline">
            {shell("home")}
          </ActionLink>
          {actionHref && actionLabel ? (
            <ActionLink className="hidden sm:inline-flex" href={actionHref}>
              {actionLabel}
            </ActionLink>
          ) : null}
        </div>
      </header>
      {children}
    </div>
  );
}
