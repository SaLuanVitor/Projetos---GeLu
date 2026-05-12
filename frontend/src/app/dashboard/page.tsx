"use client";

import { AppShell } from "@/components/layout/AppShell";
import { ActionLink } from "@/components/ui/ActionButton";
import { PaperCard } from "@/components/ui/PaperCard";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { handleInvalidSession } from "@/services/auth";
import { getProfile } from "@/services/profile";
import { loadSession, type StoredSession } from "@/services/session";
import type { ProfileResponse } from "@/types/api";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const meals = [
  { name: "Cafe com tapioca", tag: "manha", calories: "320 kcal" },
  { name: "Bowl mediterraneo", tag: "almoco", calories: "540 kcal" },
  { name: "Frutas com iogurte", tag: "lanche", calories: "210 kcal" },
  { name: "Sopa de abobora", tag: "jantar", calories: "390 kcal" }
];

const suggestions = [
  "Trocar o lanche por uma opcao com mais proteina.",
  "Separar legumes ja lavados para agilizar o jantar.",
  "Registrar o peso da semana para atualizar sua evolucao."
];

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<StoredSession | null>(null);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [error, setError] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    const storedSession = loadSession();
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

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Nao foi possivel carregar seus dados."
        );
      })
      .finally(() => setLoadingProfile(false));
  }, [router]);

  const totalMealCalories = useMemo(
    () => meals.reduce((total, meal) => total + Number(meal.calories.replace(/\D/g, "")), 0),
    []
  );
  const calorieGoal = profile?.dailyCalorieGoal ?? 1900;
  const calorieBalance = calorieGoal - totalMealCalories;
  const displayName = profile?.name ?? session?.user.name ?? "cozinheiro da casa";

  return (
    <AppShell>
      <main className="mx-auto max-w-6xl px-5 py-8">
        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch">
          <PaperCard className="bg-recipe-lines bg-[length:100%_32px] p-7" tape="orange">
            <p className="text-sm font-bold uppercase tracking-wide text-secondary">
              Inicio da parte interna
            </p>
            <h1 className="mt-3 font-display text-5xl font-extrabold leading-tight text-primary md:text-6xl">
              Bom ver voce por aqui, {displayName}.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-on-surface-variant">
              Seu caderno do dia reune refeicoes, treino, peso e proximas ideias para manter a
              rotina da casa organizada.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ActionLink href="/perfil" variant="secondary">
                Atualizar perfil
              </ActionLink>
              <ActionLink href="/perfil/evolucao" variant="outline">
                Ver evolucao
              </ActionLink>
            </div>
          </PaperCard>

          <PaperCard className="rotate-[1deg] bg-surface-container-lowest" tape="green">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-tertiary">
                  Sugestao IA personalizada
                </p>
                <h2 className="mt-2 font-display text-3xl font-bold text-secondary">
                  Jantar leve com preparo rapido
                </h2>
              </div>
              <span className="rounded-full border-2 border-outline bg-secondary-fixed px-3 py-2 text-sm font-bold text-on-secondary-fixed">
                IA
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-on-surface-variant">
              Uma sopa cremosa com proteina magra combina com o saldo calorico de hoje e ajuda a
              fechar a noite sem pesar a rotina.
            </p>
            <ActionLink className="mt-5" href="/sugestoes-ia" variant="outline">
              Abrir sugestoes
            </ActionLink>
          </PaperCard>
        </section>

        <div className="mt-6 space-y-3">
          {loadingProfile ? (
            <StatusMessage>Carregando dados do seu caderno...</StatusMessage>
          ) : null}
          {error ? <StatusMessage variant="warning">{error}</StatusMessage> : null}
        </div>

        <section className="mt-6 grid gap-5 lg:grid-cols-12">
          <PaperCard className="lg:col-span-5" tape="orange">
            <h2 className="font-display text-3xl font-bold text-tertiary">Refeicoes do dia</h2>
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
            <h2 className="font-display text-3xl font-bold text-tertiary">Treino do dia</h2>
            <div className="mt-5 rounded-xl border-2 border-dashed border-secondary bg-secondary-fixed/50 p-4">
              <p className="font-display text-2xl font-bold text-secondary">Caminhada ativa</p>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                35 minutos planejados para movimentar a tarde.
              </p>
            </div>
            <p className="mt-4 text-sm font-bold text-tertiary">Estimativa: 180 kcal</p>
          </PaperCard>

          <PaperCard className="text-center lg:col-span-4" tape="brown">
            <h2 className="font-display text-3xl font-bold text-tertiary">Saldo calorico</h2>
            <div className="mx-auto mt-5 flex h-40 w-40 items-center justify-center rounded-full border-[14px] border-primary-fixed bg-surface-container-lowest">
              <div>
                <p className="font-display text-4xl font-extrabold text-primary">
                  {calorieBalance}
                </p>
                <p className="text-xs font-bold uppercase tracking-wide text-tertiary">kcal</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-on-surface-variant">
              Baseado em uma meta de {calorieGoal} kcal e refeicoes mockadas do dia.
            </p>
          </PaperCard>

          <PaperCard className="lg:col-span-4" tape="green">
            <h2 className="font-display text-3xl font-bold text-tertiary">Peso & meta</h2>
            <div className="mt-5 grid grid-cols-2 gap-4 text-center">
              <div className="rounded-lg border-2 border-outline-variant bg-surface-container-lowest p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-secondary">Atual</p>
                <p className="mt-2 font-display text-3xl font-extrabold text-primary">
                  {profile?.currentWeight ? `${profile.currentWeight} kg` : "--"}
                </p>
              </div>
              <div className="rounded-lg border-2 border-outline-variant bg-surface-container-lowest p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-secondary">Objetivo</p>
                <p className="mt-2 font-display text-2xl font-extrabold text-tertiary">
                  {profile?.goal ?? "Definir"}
                </p>
              </div>
            </div>
          </PaperCard>

          <PaperCard className="lg:col-span-4" tape="orange">
            <h2 className="font-display text-3xl font-bold text-tertiary">Convites pendentes</h2>
            <p className="mt-4 rounded-lg border-2 border-dashed border-outline-variant bg-surface-container-lowest p-4 text-sm leading-6 text-on-surface-variant">
              Nenhum convite familiar pendente por enquanto. O modulo de familia sera ativado em
              sprint futura.
            </p>
            <ActionLink className="mt-5" href="/familia" variant="outline">
              Ver familia
            </ActionLink>
          </PaperCard>

          <PaperCard className="lg:col-span-4" tape="brown">
            <h2 className="font-display text-3xl font-bold text-tertiary">
              Sugestoes inteligentes
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
