"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { createWeightRecord, getProfile, updateProfile } from "@/services/profile";
import { loadSession, type StoredSession } from "@/services/session";
import type { ProfileResponse } from "@/types/api";

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
      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <section className="mx-auto max-w-xl rounded-lg border border-slate-200 bg-white p-6">
          <h1 className="text-2xl font-semibold text-ink">Perfil</h1>
          <p className="mt-3 text-sm text-slate-600">Entre para editar seu perfil.</p>
          <Link
            className="mt-5 inline-flex rounded-md bg-leaf-700 px-4 py-2 text-sm font-semibold text-white"
            href="/login"
          >
            Entrar
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <section className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link className="text-sm font-semibold text-leaf-700" href="/">
              Gelu - Menu
            </Link>
            <h1 className="mt-2 text-3xl font-semibold text-ink">Perfil e peso</h1>
          </div>
          <Link
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
            href="/perfil/evolucao"
          >
            Ver evolucao
          </Link>
        </div>

        {loading ? <p className="mt-6 text-sm text-slate-600">Carregando perfil...</p> : null}
        {status ? (
          <p className="mt-6 rounded-md bg-leaf-50 p-3 text-sm text-leaf-700">{status}</p>
        ) : null}
        {error ? (
          <p className="mt-6 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>
        ) : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <form
            className="rounded-lg border border-slate-200 bg-white p-6"
            onSubmit={handleProfileSubmit}
          >
            <h2 className="text-lg font-semibold text-ink">Dados pessoais</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <TextInput label="Nome" maxLength={150} required value={name} onChange={setName} />
              <TextInput
                label="E-mail"
                disabled
                value={profile?.email ?? session.user.email}
                onChange={() => undefined}
              />
              <TextInput label="Nascimento" type="date" value={birthDate} onChange={setBirthDate} />
              <TextInput
                label="Altura (cm)"
                min="1"
                step="0.01"
                type="number"
                value={heightCm}
                onChange={setHeightCm}
              />
              <TextInput
                label="Sexo biologico"
                maxLength={20}
                value={biologicalSex}
                onChange={setBiologicalSex}
              />
              <TextInput label="Objetivo" maxLength={80} value={goal} onChange={setGoal} />
              <TextInput
                label="Calorias basais"
                min="1"
                step="0.01"
                type="number"
                value={basalCalories}
                onChange={setBasalCalories}
              />
              <TextInput
                label="Meta calorica diaria"
                min="1"
                step="0.01"
                type="number"
                value={dailyCalorieGoal}
                onChange={setDailyCalorieGoal}
              />
            </div>
            <button
              className="mt-6 rounded-md bg-leaf-700 px-4 py-2 text-sm font-semibold text-white"
              type="submit"
            >
              Salvar perfil
            </button>
          </form>

          <aside className="space-y-6">
            <form
              className="rounded-lg border border-slate-200 bg-white p-6"
              onSubmit={handleWeightSubmit}
            >
              <h2 className="text-lg font-semibold text-ink">Registrar peso</h2>
              <p className="mt-2 text-sm text-slate-600">
                Peso atual:{" "}
                {profile?.currentWeight ? `${profile.currentWeight} kg` : "nao informado"}
              </p>
              <TextInput
                label="Peso (kg)"
                min="1"
                required
                step="0.01"
                type="number"
                value={weightKg}
                onChange={setWeightKg}
              />
              <TextInput
                label="Data e hora"
                type="datetime-local"
                value={recordedAt}
                onChange={setRecordedAt}
              />
              <button
                className="mt-5 w-full rounded-md bg-leaf-700 px-4 py-2 text-sm font-semibold text-white"
                type="submit"
              >
                Registrar peso
              </button>
            </form>
          </aside>
        </div>
      </section>
    </main>
  );
}

function TextInput({
  label,
  onChange,
  value,
  ...props
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input
        className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-leaf-600 disabled:bg-slate-100"
        onChange={(event) => onChange(event.target.value)}
        value={value}
        {...props}
      />
    </label>
  );
}

function toNumberOrNull(value: string) {
  return value ? Number(value) : null;
}

function toInputValue(value: number | null) {
  return value == null ? "" : String(value);
}
