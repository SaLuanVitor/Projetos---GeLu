"use client";

import { AppShell } from "@/components/layout/AppShell";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
import { ActionButton, ActionLink } from "@/components/ui/ActionButton";
import { SelectField, TextInput } from "@/components/ui/FormField";
import { NotebookPageHeader } from "@/components/ui/Notebook";
import { PaperCard } from "@/components/ui/PaperCard";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { getValidSession, handleInvalidSession, logoutUser } from "@/services/auth";
import { getLocalizedApiError } from "@/services/localized-error";
import { createWeightRecord, getProfile, updateProfile } from "@/services/profile";
import { clearSession, type StoredSession } from "@/services/session";
import type { ProfileResponse } from "@/types/api";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { FormEvent, useCallback, useEffect, useState } from "react";

const OTHER_VALUE = "__other__";
const SEX_VALUES = ["FEMININO", "MASCULINO"];
const GOAL_VALUES = ["Emagrecer", "Manter peso", "Ganhar massa", "Melhorar saude"];

export default function ProfilePage() {
  const router = useRouter();
  const t = useTranslations("Profile");
  const errors = useTranslations("CommonErrors");
  const [session, setSession] = useState<StoredSession | null>(null);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [biologicalSex, setBiologicalSex] = useState("");
  const [goal, setGoal] = useState("");
  const [basalCalories, setBasalCalories] = useState("");
  const [dailyCalorieGoal, setDailyCalorieGoal] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [recordedAt, setRecordedAt] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const sexOptions = [
    { label: t("options.notInformed"), value: "" },
    ...SEX_VALUES.map((value) => ({ label: t(`options.sex.${value}`), value })),
    { label: t("options.other"), value: OTHER_VALUE }
  ];
  const goalOptions = [
    { label: t("options.notInformed"), value: "" },
    ...GOAL_VALUES.map((value) => ({
      label: t(`options.goals.${goalKey(value)}`),
      value
    })),
    { label: t("options.other"), value: OTHER_VALUE }
  ];

  const loadProfile = useCallback(
    async (accessToken: string) => {
      setLoading(true);
      setError("");

      try {
        const loadedProfile = await getProfile(accessToken);
        setProfile(loadedProfile);
        setName(loadedProfile.name);
        setBirthDate(loadedProfile.birthDate ?? "");
        setHeightCm(toInputValue(loadedProfile.heightCm));
        setBiologicalSex(loadedProfile.biologicalSex ?? "");
        setGoal(loadedProfile.goal ?? "");
        setBasalCalories(toInputValue(loadedProfile.basalCalories));
        setDailyCalorieGoal(toInputValue(loadedProfile.dailyCalorieGoal));
      } catch (requestError) {
        if (handleInvalidSession(requestError, () => router.replace("/login"))) {
          return;
        }

        setError(getLocalizedApiError(requestError, errors, t("loadError")));
      } finally {
        setLoading(false);
      }
    },
    [errors, router, t]
  );

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

      void loadProfile(storedSession.accessToken);
    });

    return () => {
      active = false;
    };
  }, [loadProfile]);

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const currentSession = await getValidSession();
    setSession(currentSession);
    if (!currentSession) {
      return;
    }

    setStatus("");
    setError("");

    try {
      const updatedProfile = await updateProfile(currentSession.accessToken, {
        name,
        birthDate: birthDate || null,
        heightCm: toNumberOrNull(heightCm),
        biologicalSex: textOrNull(biologicalSex),
        goal: textOrNull(goal),
        basalCalories: toNumberOrNull(basalCalories),
        dailyCalorieGoal: toNumberOrNull(dailyCalorieGoal)
      });
      setProfile(updatedProfile);
      setStatus(t("saved"));
    } catch (requestError) {
      if (handleInvalidSession(requestError, () => router.replace("/login"))) {
        return;
      }

      setError(getLocalizedApiError(requestError, errors, t("saveError")));
    }
  }

  async function handleWeightSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const currentSession = await getValidSession();
    setSession(currentSession);
    if (!currentSession) {
      return;
    }

    setStatus("");
    setError("");

    try {
      await createWeightRecord(currentSession.accessToken, {
        weightKg: Number(weightKg),
        recordedAt: recordedAt ? `${recordedAt}:00` : null
      });
      setWeightKg("");
      setRecordedAt("");
      await loadProfile(currentSession.accessToken);
      setStatus(t("weightSaved"));
    } catch (requestError) {
      if (handleInvalidSession(requestError, () => router.replace("/login"))) {
        return;
      }

      setError(getLocalizedApiError(requestError, errors, t("weightError")));
    }
  }

  async function handleLogoutConfirm() {
    const refreshToken = session?.refreshToken;
    if (refreshToken) {
      try {
        await logoutUser({ refreshToken });
      } catch {
        // Local logout must proceed even when the remote token is already invalid or offline.
      }
    }

    clearSession();
    router.push("/");
  }

  useEffect(() => {
    if (!showLogoutConfirm) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowLogoutConfirm(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showLogoutConfirm]);

  if (!session) {
    return (
      <AppShell>
        <main className="mx-auto max-w-xl px-5 py-10">
          <PaperCard ink tape="orange">
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
      <main className="mx-auto max-w-6xl px-5 py-10">
        <NotebookPageHeader
          action={
            <div className="flex flex-wrap items-center gap-3">
              <LocaleSwitcher />
              <ActionLink href="/perfil/evolucao" variant="outline">
                {t("viewEvolution")}
              </ActionLink>
              <ActionButton
                onClick={() => setShowLogoutConfirm(true)}
                type="button"
                variant="outline"
              >
                {t("logout")}
              </ActionButton>
            </div>
          }
          eyebrow={t("eyebrow")}
          title={t("title")}
        />

        <div className="mt-6 space-y-3">
          {loading ? <StatusMessage>{t("loading")}</StatusMessage> : null}
          {status ? <StatusMessage variant="success">{status}</StatusMessage> : null}
          {error ? <StatusMessage variant="error">{error}</StatusMessage> : null}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <PaperCard ink tape="green">
            <form onSubmit={handleProfileSubmit}>
              <h2 className="font-display text-3xl font-bold text-tertiary">{t("personalData")}</h2>
              <p className="mt-2 text-sm text-on-surface-variant">{t("personalDescription")}</p>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <TextInput
                  label={t("name")}
                  maxLength={150}
                  required
                  value={name}
                  onValueChange={setName}
                />
                <TextInput
                  disabled
                  label={t("email")}
                  value={profile?.email ?? session.user.email}
                  onValueChange={() => undefined}
                />
                <TextInput
                  label={t("birthDate")}
                  type="date"
                  value={birthDate}
                  onValueChange={setBirthDate}
                />
                <TextInput
                  label={t("height")}
                  min="1"
                  step="0.01"
                  type="number"
                  value={heightCm}
                  onValueChange={setHeightCm}
                />
                <SelectField
                  label={t("sex")}
                  options={sexOptions}
                  value={selectValue(biologicalSex, SEX_VALUES)}
                  onValueChange={setBiologicalSex}
                />
                <SelectField
                  label={t("goal")}
                  options={goalOptions}
                  value={selectValue(goal, GOAL_VALUES)}
                  onValueChange={setGoal}
                />
                {selectValue(biologicalSex, SEX_VALUES) === OTHER_VALUE ? (
                  <TextInput
                    label={t("customSex")}
                    maxLength={20}
                    value={biologicalSex === OTHER_VALUE ? "" : biologicalSex}
                    onValueChange={(value) => setBiologicalSex(value || OTHER_VALUE)}
                  />
                ) : null}
                {selectValue(goal, GOAL_VALUES) === OTHER_VALUE ? (
                  <TextInput
                    label={t("customGoal")}
                    maxLength={80}
                    value={goal === OTHER_VALUE ? "" : goal}
                    onValueChange={(value) => setGoal(value || OTHER_VALUE)}
                  />
                ) : null}
                <TextInput
                  label={t("basalCalories")}
                  min="1"
                  step="0.01"
                  type="number"
                  value={basalCalories}
                  onValueChange={setBasalCalories}
                />
                <TextInput
                  label={t("dailyCalorieGoal")}
                  min="1"
                  step="0.01"
                  type="number"
                  value={dailyCalorieGoal}
                  onValueChange={setDailyCalorieGoal}
                />
              </div>
              <ActionButton className="mt-6" type="submit">
                {t("save")}
              </ActionButton>
            </form>
          </PaperCard>

          <aside className="space-y-6">
            <PaperCard className="paper-lines-block" tape="orange">
              <p className="text-sm font-bold text-tertiary">{t("currentWeight")}</p>
              <p className="mt-3 font-display text-4xl font-extrabold text-primary">
                {profile?.currentWeight ? `${profile.currentWeight} kg` : t("notInformed")}
              </p>
            </PaperCard>

            <PaperCard ink tape="brown">
              <form onSubmit={handleWeightSubmit}>
                <h2 className="font-display text-3xl font-bold text-tertiary">
                  {t("registerWeight")}
                </h2>
                <div className="mt-6 space-y-5">
                  <TextInput
                    label={t("weight")}
                    min="1"
                    required
                    step="0.01"
                    type="number"
                    value={weightKg}
                    onValueChange={setWeightKg}
                  />
                  <TextInput
                    label={t("recordedAt")}
                    type="datetime-local"
                    value={recordedAt}
                    onValueChange={setRecordedAt}
                  />
                </div>
                <ActionButton className="mt-6 w-full" type="submit" variant="secondary">
                  {t("registerWeight")}
                </ActionButton>
              </form>
            </PaperCard>
          </aside>
        </div>
      </main>
      {showLogoutConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/35 px-5 py-8">
          <div
            aria-labelledby="logout-confirm-title"
            aria-modal="true"
            className="notebook-card w-full max-w-md bg-surface p-6 shadow-paper"
            role="dialog"
          >
            <h2 className="font-display text-3xl font-bold text-primary" id="logout-confirm-title">
              {t("logoutTitle")}
            </h2>
            <p className="mt-3 text-sm leading-6 text-on-surface-variant">{t("logoutText")}</p>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <ActionButton
                onClick={() => setShowLogoutConfirm(false)}
                type="button"
                variant="outline"
              >
                {t("cancel")}
              </ActionButton>
              <ActionButton onClick={handleLogoutConfirm} type="button">
                {t("logoutConfirm")}
              </ActionButton>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}

function toNumberOrNull(value: string) {
  return value ? Number(value) : null;
}

function toInputValue(value: number | null) {
  return value == null ? "" : String(value);
}

function textOrNull(value: string) {
  return value && value !== OTHER_VALUE ? value : null;
}

function selectValue(value: string, options: string[]) {
  if (!value) {
    return "";
  }

  return options.includes(value) ? value : OTHER_VALUE;
}

function goalKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s/g, "_");
}
