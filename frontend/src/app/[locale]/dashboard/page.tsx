"use client";

import { AppShell } from "@/components/layout/AppShell";
import { ActionLink } from "@/components/ui/ActionButton";
import { NotebookPageHeader } from "@/components/ui/Notebook";
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
      <main className="mx-auto max-w-7xl px-5 py-10">
        <NotebookPageHeader
          subtitle={t("description")}
          title={t("greeting", { name: displayName })}
        />

        <div className="mt-6 space-y-3">
          {loadingProfile ? <StatusMessage>{t("loading")}</StatusMessage> : null}
          {error ? <StatusMessage variant="warning">{error}</StatusMessage> : null}
        </div>

        <section className="mt-10 grid gap-6 lg:grid-cols-12">
          <PaperCard className="grid gap-6 p-6 lg:col-span-8 md:grid-cols-[230px_1fr]" tape="green">
            <div className="overflow-hidden rounded-lg border-2 border-outline bg-surface-container-low p-2">
              <div className="flex aspect-square items-center justify-center rounded-md bg-[radial-gradient(circle_at_center,#e86d2d_0_20%,#ffdcc6_21%_38%,#79573f_39%_42%,#f8f3e7_43%)]" />
            </div>
            <div className="self-center">
              <p className="text-sm font-bold text-primary">{t("aiEyebrow")}</p>
              <h2 className="mt-3 font-display text-4xl font-extrabold leading-tight text-on-surface">
                {t("aiTitle")}
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-on-surface-variant">
                {t("aiDescription")}
              </p>
              <ActionLink className="mt-5" href="/sugestoes-ia">
                {t("openSuggestions")}
              </ActionLink>
            </div>
          </PaperCard>

          <PaperCard className="text-center lg:col-span-4" tape="orange">
            <h2 className="font-display text-3xl font-bold text-on-surface">
              {t("calorieBalance")}
            </h2>
            <div className="calorie-ring mx-auto mt-7 flex h-44 w-44 items-center justify-center rounded-full">
              <div>
                <p className="font-display text-4xl font-extrabold text-on-surface">
                  {calorieBalance}
                </p>
                <p className="text-sm font-bold text-tertiary">kcal</p>
              </div>
            </div>
            <div className="mt-7 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-surface-container p-3 text-sm font-bold">
                {t("goal")}
                <span className="block text-lg">{calorieGoal}</span>
              </div>
              <div className="rounded-lg bg-surface-container p-3 text-sm font-bold">
                {t("current")}
                <span className="block text-lg">{totalMealCalories}</span>
              </div>
            </div>
          </PaperCard>

          <PaperCard className="lg:col-span-6" tape="none">
            <h2 className="font-display text-3xl font-bold text-on-surface">{t("dailyMeals")}</h2>
            <div className="mt-5 space-y-3">
              {meals.map((meal, index) => (
                <div
                  className="flex items-center justify-between gap-4 border-b-2 border-outline py-2"
                  key={meal.name}
                >
                  <div className="flex items-center gap-3">
                    <span className="h-5 w-5 rounded-full border-2 border-outline">
                      {index === 0 ? "✓" : ""}
                    </span>
                    <p className="font-bold text-on-surface">{meal.name}</p>
                  </div>
                  <span className="text-sm font-bold text-tertiary">
                    {index === 1 ? meal.tag : meal.calories}
                  </span>
                </div>
              ))}
            </div>
          </PaperCard>

          <PaperCard className="lg:col-span-6" tape="none">
            <h2 className="font-display text-3xl font-bold text-on-surface">{t("training")}</h2>
            <div className="mt-5 rounded-xl border-2 border-dashed border-secondary bg-secondary-fixed/40 p-5">
              <p className="font-display text-2xl font-bold text-secondary">{t("trainingName")}</p>
              <p className="mt-3 font-display text-5xl font-extrabold text-secondary">45 min</p>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                {t("trainingDescription")}
              </p>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4 text-center">
              <div className="rounded-lg bg-surface-container p-3 text-sm font-bold">75%</div>
              <div className="rounded-lg bg-surface-container p-3 text-sm font-bold">
                {t("trainingEstimate")}
              </div>
            </div>
          </PaperCard>

          <PaperCard className="rotate-[-1deg] lg:col-span-4" tape="none">
            <h2 className="text-center font-display text-3xl font-bold text-on-surface">
              {t("weightGoal")}
            </h2>
            <div className="mt-5 grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-sm font-bold text-tertiary">{t("current")}</p>
                <p className="mt-2 font-display text-3xl font-extrabold text-primary">
                  {profile?.currentWeight ? `${profile.currentWeight} kg` : "--"}
                </p>
              </div>
              <div>
                <p className="text-sm font-bold text-tertiary">{t("goal")}</p>
                <p className="mt-2 font-display text-2xl font-extrabold text-tertiary">
                  {profile?.goal ?? t("define")}
                </p>
              </div>
            </div>
            <ActionLink className="mt-5 w-full" href="/perfil/evolucao" variant="outline">
              {t("viewEvolution")}
            </ActionLink>
          </PaperCard>

          <PaperCard className="lg:col-span-8" tape="none">
            <h2 className="font-display text-3xl font-bold text-on-surface">
              {t("pendingInvites")}
            </h2>
            <p className="mt-4 text-base leading-7 text-on-surface-variant">
              {t("pendingInvitesDescription")}
            </p>
            <ActionLink className="mt-5" href="/familia" variant="outline">
              {t("viewFamily")}
            </ActionLink>
          </PaperCard>

          <PaperCard className="lg:col-span-12" tape="green">
            <h2 className="font-display text-3xl font-bold text-on-surface">
              {t("smartSuggestions")}
            </h2>
            <ul className="mt-5 grid gap-3 md:grid-cols-3">
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
