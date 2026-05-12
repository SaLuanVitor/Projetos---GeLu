"use client";

import { AppShell } from "@/components/layout/AppShell";
import { ActionLink } from "@/components/ui/ActionButton";
import { PaperCard } from "@/components/ui/PaperCard";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { getValidSession, handleInvalidSession } from "@/services/auth";
import { getLocalizedApiError } from "@/services/localized-error";
import { getProfile } from "@/services/profile";
import type { StoredSession } from "@/services/session";
import type { ProfileResponse } from "@/types/api";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

export default function DashboardPage() {
  const router = useRouter();
  const t = useTranslations("Dashboard");
  const errors = useTranslations("CommonErrors");
  const meals = useMemo(
    () => t.raw("meals") as Array<{ name: string; tag: string; calories: string }>,
    [t]
  );
  const suggestions = useMemo(() => t.raw("suggestions") as string[], [t]);
  const [session, setSession] = useState<StoredSession | null>(null);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [error, setError] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    let active = true;

    getValidSession().then((storedSession) => {
      if (!active) {
        return;
      }

      setSession(storedSession);
      if (!storedSession) {
        setLoadingProfile(false);
        return;
      }

      getProfile(storedSession.accessToken)
        .then(setProfile)
        .catch((requestError) => {
          if (handleInvalidSession(requestError, () => router.replace("/login"))) {
            return;
          }

          setError(getLocalizedApiError(requestError, errors, t("loadError")));
        })
        .finally(() => setLoadingProfile(false));
    });

    return () => {
      active = false;
    };
  }, [errors, router, t]);

  const totalMealCalories = useMemo(
    () => meals.reduce((total, meal) => total + Number(meal.calories.replace(/\D/g, "")), 0),
    [meals]
  );
  const calorieGoal = profile?.dailyCalorieGoal ?? 1900;
  const calorieBalance = calorieGoal - totalMealCalories;
  const displayName = profile?.name ?? session?.user.name ?? t("fallbackName");

  return (
    <AppShell>
      <main className="mx-auto max-w-6xl px-5 py-8">
        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch">
          <PaperCard className="bg-recipe-lines bg-[length:100%_32px] p-7" tape="orange">
            <p className="text-sm font-bold uppercase tracking-wide text-secondary">
              {t("eyebrow")}
            </p>
            <h1 className="mt-3 font-display text-5xl font-extrabold leading-tight text-primary md:text-6xl">
              {t("greeting", { name: displayName })}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-on-surface-variant">
              {t("description")}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ActionLink href="/perfil" variant="secondary">
                {t("updateProfile")}
              </ActionLink>
              <ActionLink href="/perfil/evolucao" variant="outline">
                {t("viewEvolution")}
              </ActionLink>
            </div>
          </PaperCard>

          <PaperCard className="rotate-[1deg] bg-surface-container-lowest" tape="green">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-tertiary">
                  {t("aiEyebrow")}
                </p>
                <h2 className="mt-2 font-display text-3xl font-bold text-secondary">
                  {t("aiTitle")}
                </h2>
              </div>
              <span className="rounded-full border-2 border-outline bg-secondary-fixed px-3 py-2 text-sm font-bold text-on-secondary-fixed">
                {t("aiBadge")}
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-on-surface-variant">{t("aiDescription")}</p>
            <ActionLink className="mt-5" href="/sugestoes-ia" variant="outline">
              {t("openSuggestions")}
            </ActionLink>
          </PaperCard>
        </section>

        <div className="mt-6 space-y-3">
          {loadingProfile ? <StatusMessage>{t("loading")}</StatusMessage> : null}
          {error ? <StatusMessage variant="warning">{error}</StatusMessage> : null}
        </div>

        <section className="mt-6 grid gap-5 lg:grid-cols-12">
          <PaperCard className="lg:col-span-5" tape="orange">
            <h2 className="font-display text-3xl font-bold text-tertiary">{t("dailyMeals")}</h2>
            <div className="mt-5 space-y-3">
              {meals.map((meal) => (
                <div
                  className="flex items-center justify-between gap-4 rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-4 py-3"
                  key={meal.name}
                >
                  <div>
                    <p className="font-bold text-on-surface">{meal.name}</p>
                    <p className="text-xs font-semibold uppercase tracking-wide text-secondary">
                      {meal.tag}
                    </p>
                  </div>
                  <span className="rounded-full bg-primary-fixed px-3 py-1 text-xs font-bold text-on-primary-fixed">
                    {meal.calories}
                  </span>
                </div>
              ))}
            </div>
          </PaperCard>

          <PaperCard className="lg:col-span-3" tape="green">
            <h2 className="font-display text-3xl font-bold text-tertiary">{t("training")}</h2>
            <div className="mt-5 rounded-xl border-2 border-dashed border-secondary bg-secondary-fixed/50 p-4">
              <p className="font-display text-2xl font-bold text-secondary">{t("trainingName")}</p>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                {t("trainingDescription")}
              </p>
            </div>
            <p className="mt-4 text-sm font-bold text-tertiary">{t("trainingEstimate")}</p>
          </PaperCard>

          <PaperCard className="text-center lg:col-span-4" tape="brown">
            <h2 className="font-display text-3xl font-bold text-tertiary">{t("calorieBalance")}</h2>
            <div className="mx-auto mt-5 flex h-40 w-40 items-center justify-center rounded-full border-[14px] border-primary-fixed bg-surface-container-lowest">
              <div>
                <p className="font-display text-4xl font-extrabold text-primary">
                  {calorieBalance}
                </p>
                <p className="text-xs font-bold uppercase tracking-wide text-tertiary">kcal</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-on-surface-variant">
              {t("goalBased", { goal: calorieGoal })}
            </p>
          </PaperCard>

          <PaperCard className="lg:col-span-4" tape="green">
            <h2 className="font-display text-3xl font-bold text-tertiary">{t("weightGoal")}</h2>
            <div className="mt-5 grid grid-cols-2 gap-4 text-center">
              <div className="rounded-lg border-2 border-outline-variant bg-surface-container-lowest p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-secondary">
                  {t("current")}
                </p>
                <p className="mt-2 font-display text-3xl font-extrabold text-primary">
                  {profile?.currentWeight ? `${profile.currentWeight} kg` : "--"}
                </p>
              </div>
              <div className="rounded-lg border-2 border-outline-variant bg-surface-container-lowest p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-secondary">
                  {t("goal")}
                </p>
                <p className="mt-2 font-display text-2xl font-extrabold text-tertiary">
                  {profile?.goal ?? t("define")}
                </p>
              </div>
            </div>
          </PaperCard>

          <PaperCard className="lg:col-span-4" tape="orange">
            <h2 className="font-display text-3xl font-bold text-tertiary">{t("pendingInvites")}</h2>
            <p className="mt-4 rounded-lg border-2 border-dashed border-outline-variant bg-surface-container-lowest p-4 text-sm leading-6 text-on-surface-variant">
              {t("pendingInvitesDescription")}
            </p>
            <ActionLink className="mt-5" href="/familia" variant="outline">
              {t("viewFamily")}
            </ActionLink>
          </PaperCard>

          <PaperCard className="lg:col-span-4" tape="brown">
            <h2 className="font-display text-3xl font-bold text-tertiary">
              {t("smartSuggestions")}
            </h2>
            <ul className="mt-5 space-y-3">
              {suggestions.map((suggestion) => (
                <li
                  className="rounded-lg border-2 border-outline-variant bg-surface-container-lowest p-3 text-sm font-semibold text-on-surface-variant"
                  key={suggestion}
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          </PaperCard>
        </section>
      </main>
    </AppShell>
  );
}
