"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { listWeightHistory } from "@/services/profile";
import { loadSession, type StoredSession } from "@/services/session";
import type { WeightHistoryItem } from "@/types/api";

export default function WeightEvolutionPage() {
  const [session, setSession] = useState<StoredSession | null>(null);
  const [history, setHistory] = useState<WeightHistoryItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedSession = loadSession();
    setSession(storedSession);
    if (!storedSession) {
      setLoading(false);
      return;
    }

    listWeightHistory(storedSession.accessToken)
      .then(setHistory)
      .catch((requestError) =>
        setError(
          requestError instanceof Error ? requestError.message : "Falha ao carregar historico."
        )
      )
      .finally(() => setLoading(false));
  }, []);

  const reminder = useMemo(() => getReminder(history), [history]);

  if (!session) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <section className="mx-auto max-w-xl rounded-lg border border-slate-200 bg-white p-6">
          <h1 className="text-2xl font-semibold text-ink">Evolucao de peso</h1>
          <p className="mt-3 text-sm text-slate-600">Entre para visualizar seu historico.</p>
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
      <section className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link className="text-sm font-semibold text-leaf-700" href="/perfil">
              Perfil
            </Link>
            <h1 className="mt-2 text-3xl font-semibold text-ink">Evolucao de peso</h1>
          </div>
          <Link
            className="rounded-md bg-leaf-700 px-4 py-2 text-sm font-semibold text-white"
            href="/perfil"
          >
            Registrar peso
          </Link>
        </div>

        {reminder ? (
          <p className="mt-6 rounded-md bg-amber-50 p-3 text-sm text-amber-800">{reminder}</p>
        ) : null}
        {loading ? <p className="mt-6 text-sm text-slate-600">Carregando historico...</p> : null}
        {error ? (
          <p className="mt-6 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>
        ) : null}

        <div className="mt-6 rounded-lg border border-slate-200 bg-white">
          {history.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {history.map((item) => (
                <div className="flex items-center justify-between gap-4 p-4" key={item.id}>
                  <div>
                    <p className="text-sm font-semibold text-ink">{item.weightKg} kg</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Registrado em {new Date(item.recordedAt).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="p-6 text-sm text-slate-600">Nenhum peso registrado ainda.</p>
          )}
        </div>
      </section>
    </main>
  );
}

function getReminder(history: WeightHistoryItem[]) {
  if (history.length === 0) {
    return "Registre seu peso inicial para acompanhar sua evolucao mensal.";
  }

  const latest = new Date(history[0].recordedAt);
  const daysSinceLatest = Math.floor((Date.now() - latest.getTime()) / 86_400_000);
  if (daysSinceLatest >= 30) {
    return "Ja se passaram 30 dias ou mais desde o ultimo registro. Atualize seu peso.";
  }

  return "";
}
