"use client";

import { AppShell } from "@/components/layout/AppShell";
import { ActionLink } from "@/components/ui/ActionButton";
import { PaperCard } from "@/components/ui/PaperCard";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { getValidSession, handleInvalidSession } from "@/services/auth";
import { listWeightHistory } from "@/services/profile";
import type { StoredSession } from "@/services/session";
import type { WeightHistoryItem } from "@/types/api";
import { useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

export default function WeightEvolutionPage() {
  const router = useRouter();
  const t = useTranslations("Evolution");
  const locale = useLocale();
  const [session, setSession] = useState<StoredSession | null>(null);
  const [history, setHistory] = useState<WeightHistoryItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    getValidSession().then((storedSession) => {
      if (!active) {
        return;
      }

      setSession(storedSession);
      if (!storedSession) {
        setLoading(false);
        return;
      }

      listWeightHistory(storedSession.accessToken)
        .then(setHistory)
        .catch((requestError) => {
          if (handleInvalidSession(requestError, () => router.replace("/login"))) {
            return;
          }

          setError(requestError instanceof Error ? requestError.message : t("error"));
        })
        .finally(() => setLoading(false));
    });

    return () => {
      active = false;
    };
  }, [router, t]);

  const reminder = useMemo(() => {
    if (history.length === 0) {
      return t("initialReminder");
    }

    const latest = new Date(history[0].recordedAt);
    const daysSinceLatest = Math.floor((Date.now() - latest.getTime()) / 86_400_000);
    if (daysSinceLatest >= 30) {
      return t("monthlyReminder");
    }

    return "";
  }, [history, t]);
  const current = history[0];
  const previous = history[1];
  const delta = current && previous ? Number(current.weightKg) - Number(previous.weightKg) : null;

  if (!session) {
    return (
      <AppShell>
        <main className="mx-auto max-w-xl px-5 py-10">
          <PaperCard tape="green">
            <h1 className="font-display text-4xl font-bold text-primary">{t("guestTitle")}</h1>
            <p className="mt-3 text-sm leading-6 text-on-surface-variant">
              {t("guestDescription")}
            </p>
            <ActionLink className="mt-5" href="/login">
              {t("login")}
            </ActionLink>
          </PaperCard>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="mx-auto max-w-6xl px-5 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-secondary">
              {t("eyebrow")}
            </p>
            <h1 className="mt-2 font-display text-5xl font-extrabold text-primary">{t("title")}</h1>
          </div>
          <ActionLink href="/perfil" variant="secondary">
            {t("registerWeight")}
          </ActionLink>
        </div>

        <div className="mt-6 space-y-3">
          {reminder ? <StatusMessage variant="warning">{reminder}</StatusMessage> : null}
          {loading ? <StatusMessage>{t("loading")}</StatusMessage> : null}
          {error ? <StatusMessage variant="error">{error}</StatusMessage> : null}
        </div>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <PaperCard tape="orange">
            <p className="text-xs font-bold uppercase tracking-wide text-tertiary">
              {t("current")}
            </p>
            <p className="mt-3 font-display text-4xl font-extrabold text-primary">
              {current ? `${current.weightKg} kg` : "--"}
            </p>
          </PaperCard>
          <PaperCard tape="green">
            <p className="text-xs font-bold uppercase tracking-wide text-tertiary">
              {t("previous")}
            </p>
            <p className="mt-3 font-display text-4xl font-extrabold text-secondary">
              {previous ? `${previous.weightKg} kg` : "--"}
            </p>
          </PaperCard>
          <PaperCard tape="brown">
            <p className="text-xs font-bold uppercase tracking-wide text-tertiary">
              {t("variation")}
            </p>
            <p className="mt-3 font-display text-4xl font-extrabold text-tertiary">
              {delta == null ? "--" : `${delta > 0 ? "+" : ""}${delta.toFixed(2)} kg`}
            </p>
          </PaperCard>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <PaperCard tape="green">
            <h2 className="font-display text-3xl font-bold text-tertiary">{t("chart")}</h2>
            <div className="mt-6 flex h-64 items-end gap-3 border-b-2 border-l-2 border-outline p-4">
              {history
                .slice(0, 8)
                .reverse()
                .map((item) => (
                  <div className="flex flex-1 flex-col items-center gap-2" key={item.id}>
                    <div
                      className="w-full rounded-t-lg border-2 border-tertiary bg-secondary-fixed"
                      style={{
                        height: `${Math.max(24, Math.min(190, Number(item.weightKg) * 2))}px`
                      }}
                      title={`${item.weightKg} kg`}
                    />
                    <span className="text-xs font-bold text-tertiary">
                      {new Date(item.recordedAt).toLocaleDateString(locale, {
                        day: "2-digit",
                        month: "2-digit"
                      })}
                    </span>
                  </div>
                ))}
              {history.length === 0 ? (
                <p className="self-center text-sm text-on-surface-variant">{t("emptyChart")}</p>
              ) : null}
            </div>
          </PaperCard>

          <PaperCard tape="orange">
            <h2 className="font-display text-3xl font-bold text-tertiary">{t("records")}</h2>
            <div className="mt-5 space-y-3">
              {history.length > 0 ? (
                history.map((item) => (
                  <div
                    className="rounded-lg border-2 border-outline-variant bg-surface-container-lowest p-3"
                    key={item.id}
                  >
                    <p className="font-display text-2xl font-bold text-primary">
                      {item.weightKg} kg
                    </p>
                    <p className="mt-1 text-xs text-on-surface-variant">
                      {t("recordedIn", { date: new Date(item.recordedAt).toLocaleString(locale) })}
                    </p>
                  </div>
                ))
              ) : (
                <p className="rounded-lg border-2 border-dashed border-outline-variant p-4 text-sm text-on-surface-variant">
                  {t("emptyRecords")}
                </p>
              )}
            </div>
          </PaperCard>
        </section>
      </main>
    </AppShell>
  );
}
