"use client";

import { AppShell } from "@/components/layout/AppShell";
import { ActionButton, ActionLink } from "@/components/ui/ActionButton";
import { TextInput } from "@/components/ui/FormField";
import { PaperCard } from "@/components/ui/PaperCard";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { createWeightRecord, getProfile, updateProfile } from "@/services/profile";
import { loadSession, type StoredSession } from "@/services/session";
import type { ProfileResponse } from "@/types/api";
import { FormEvent, useEffect, useState } from "react";

export default function ProfilePage() {
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

  useEffect(() => {
    const storedSession = loadSession();
    setSession(storedSession);
    if (!storedSession) {
      setLoading(false);
      return;
    }

    void loadProfile(storedSession.accessToken);
  }, []);

  async function loadProfile(accessToken: string) {
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
      setError(requestError instanceof Error ? requestError.message : "Falha ao carregar perfil.");
    } finally {
      setLoading(false);
    }
  }

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) {
      return;
    }

    setStatus("");
    setError("");

    try {
      const updatedProfile = await updateProfile(session.accessToken, {
        name,
        birthDate: birthDate || null,
        heightCm: toNumberOrNull(heightCm),
        biologicalSex: biologicalSex || null,
        goal: goal || null,
        basalCalories: toNumberOrNull(basalCalories),
        dailyCalorieGoal: toNumberOrNull(dailyCalorieGoal)
      });
      setProfile(updatedProfile);
      setStatus("Perfil atualizado com sucesso.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Falha ao atualizar perfil.");
    }
  }

  async function handleWeightSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) {
      return;
    }

    setStatus("");
    setError("");

    try {
      await createWeightRecord(session.accessToken, {
        weightKg: Number(weightKg),
        recordedAt: recordedAt ? `${recordedAt}:00` : null
      });
      setWeightKg("");
      setRecordedAt("");
      await loadProfile(session.accessToken);
      setStatus("Peso registrado com sucesso.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Falha ao registrar peso.");
    }
  }

  if (!session) {
    return (
      <AppShell>
        <main className="mx-auto max-w-xl px-5 py-10">
          <PaperCard tape="orange">
            <h1 className="font-display text-4xl font-bold text-primary">Perfil</h1>
            <p className="mt-3 text-sm leading-6 text-on-surface-variant">
              Entre para editar seu perfil e registrar seu peso.
            </p>
            <ActionLink className="mt-5" href="/login">
              Entrar
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
              Minha pagina do caderno
            </p>
            <h1 className="mt-2 font-display text-5xl font-extrabold text-primary">
              Perfil e peso
            </h1>
          </div>
          <ActionLink href="/perfil/evolucao" variant="outline">
            Ver evolucao
          </ActionLink>
        </div>

        <div className="mt-6 space-y-3">
          {loading ? <StatusMessage>Carregando perfil...</StatusMessage> : null}
          {status ? <StatusMessage variant="success">{status}</StatusMessage> : null}
          {error ? <StatusMessage variant="error">{error}</StatusMessage> : null}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <PaperCard tape="green">
            <form onSubmit={handleProfileSubmit}>
              <h2 className="font-display text-3xl font-bold text-tertiary">Dados pessoais</h2>
              <p className="mt-2 text-sm text-on-surface-variant">
                Dados corporais e metas ficam no seu perfil. O e-mail nao e editavel nesta sprint.
              </p>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <TextInput
                  label="Nome"
                  maxLength={150}
                  required
                  value={name}
                  onValueChange={setName}
                />
                <TextInput
                  disabled
                  label="E-mail"
                  value={profile?.email ?? session.user.email}
                  onValueChange={() => undefined}
                />
                <TextInput
                  label="Nascimento"
                  type="date"
                  value={birthDate}
                  onValueChange={setBirthDate}
                />
                <TextInput
                  label="Altura (cm)"
                  min="1"
                  step="0.01"
                  type="number"
                  value={heightCm}
                  onValueChange={setHeightCm}
                />
                <TextInput
                  label="Sexo biologico"
                  maxLength={20}
                  value={biologicalSex}
                  onValueChange={setBiologicalSex}
                />
                <TextInput label="Objetivo" maxLength={80} value={goal} onValueChange={setGoal} />
                <TextInput
                  label="Calorias basais"
                  min="1"
                  step="0.01"
                  type="number"
                  value={basalCalories}
                  onValueChange={setBasalCalories}
                />
                <TextInput
                  label="Meta calorica diaria"
                  min="1"
                  step="0.01"
                  type="number"
                  value={dailyCalorieGoal}
                  onValueChange={setDailyCalorieGoal}
                />
              </div>
              <ActionButton className="mt-6" type="submit">
                Salvar perfil
              </ActionButton>
            </form>
          </PaperCard>

          <aside className="space-y-6">
            <PaperCard tape="orange" className="bg-recipe-lines bg-[length:100%_32px]">
              <p className="text-xs font-bold uppercase tracking-wide text-tertiary">Peso atual</p>
              <p className="mt-3 font-display text-4xl font-extrabold text-primary">
                {profile?.currentWeight ? `${profile.currentWeight} kg` : "Nao informado"}
              </p>
            </PaperCard>

            <PaperCard tape="brown">
              <form onSubmit={handleWeightSubmit}>
                <h2 className="font-display text-3xl font-bold text-tertiary">Registrar peso</h2>
                <div className="mt-6 space-y-5">
                  <TextInput
                    label="Peso (kg)"
                    min="1"
                    required
                    step="0.01"
                    type="number"
                    value={weightKg}
                    onValueChange={setWeightKg}
                  />
                  <TextInput
                    label="Data e hora"
                    type="datetime-local"
                    value={recordedAt}
                    onValueChange={setRecordedAt}
                  />
                </div>
                <ActionButton className="mt-6 w-full" type="submit" variant="secondary">
                  Registrar peso
                </ActionButton>
              </form>
            </PaperCard>
          </aside>
        </div>
      </main>
    </AppShell>
  );
}

function toNumberOrNull(value: string) {
  return value ? Number(value) : null;
}

function toInputValue(value: number | null) {
  return value == null ? "" : String(value);
}
