"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PaperCard } from "@/components/ui/PaperCard";
import { getHabitsInsights } from "@/services/meals";
import type { HabitInsightsResponse } from "@/types/api";

interface HabitsInsightsCardProps {
  accessToken: string;
  familyId?: string;
  className?: string;
}

export function HabitsInsightsCard({
  accessToken,
  familyId,
  className = "",
}: HabitsInsightsCardProps) {
  const [insights, setInsights] = useState<HabitInsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const loadInsights = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const data = await getHabitsInsights(accessToken, familyId);
      setInsights(data);
    } catch (err: unknown) {
      console.error("Erro ao carregar insights de hábitos:", err);
    } finally {
      setLoading(false);
    }
  }, [accessToken, familyId]);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  if (loading) {
    return (
      <PaperCard className={`p-6 ${className}`} tape="none">
        <div className="py-6 text-center text-xs text-stone-500 animate-pulse">
          Carregando aprendizado de hábitos alimentares...
        </div>
      </PaperCard>
    );
  }

  if (!insights) return null;

  const adherencePercent = Math.round(insights.adherenceRate || 0);

  return (
    <PaperCard className={`p-6 ${className}`} tape="none">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between border-b border-stone-200/80 dark:border-stone-800 pb-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Memória & Hábitos do Casal
            </span>
          </div>
          <h3 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2 mt-0.5">
            <span>🧠</span> Aprendizado da Sua Rotina
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            O agente Orion observa seus registros e aprende quais refeições funcionam melhor
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Barra de Adesão ao Plano */}
        <div className="rounded-xl border border-stone-200 dark:border-stone-700/80 bg-white dark:bg-[#25201c] p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
                Adesão à Dieta (Últimos 30 dias)
              </span>
              <p className="text-[11px] text-stone-500">
                Percentual de refeições planejadas consumidas ou adaptadas com registro
              </p>
            </div>
            <span className="font-display text-2xl font-bold text-primary">
              {adherencePercent}%
            </span>
          </div>

          <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800 border border-stone-200/60 dark:border-stone-700/60">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${
                adherencePercent >= 80
                  ? "bg-emerald-500"
                  : adherencePercent >= 50
                  ? "bg-amber-500"
                  : "bg-rose-500"
              }`}
              style={{ width: `${Math.min(100, adherencePercent)}%` }}
            />
          </div>

          {/* Breakdown Pills */}
          <div className="mt-3 flex items-center gap-2 flex-wrap text-xs">
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 text-emerald-800 dark:text-emerald-300 font-semibold">
              ✓ {insights.plannedConsumedCount} planejadas cumpridas
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 px-2 py-0.5 text-blue-800 dark:text-blue-300 font-semibold">
              🥣 {insights.customConsumedCount} substituições
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 px-2 py-0.5 text-stone-600 dark:text-stone-400 font-medium">
              ✕ {insights.skippedCount} puladas
            </span>
          </div>
        </div>

        {/* Pratos Mais Frequentes (Staples) */}
        {insights.stapleMeals && insights.stapleMeals.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-2 flex items-center gap-1.5">
              <span>⭐</span> Pratos Mais Consumidos na Sua Rotina:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {insights.stapleMeals.map((staple, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-stone-200 dark:border-stone-700/70 bg-stone-50 dark:bg-[#1f1b17] p-2.5 flex flex-col justify-between"
                >
                  <p className="font-bold text-xs text-stone-900 dark:text-stone-100 line-clamp-1">
                    {staple.dishName}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 mt-1.5 pt-1 border-t border-stone-200/50 dark:border-stone-800">
                    <span>{staple.timesLogged}x registrado</span>
                    {staple.averageCalories && (
                      <span className="font-semibold text-primary">
                        ~{Math.round(staple.averageCalories)} kcal
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dica do Nutri IA (Orion) */}
        {insights.aiCoachingTip && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 dark:bg-primary/10 p-3.5 flex items-start gap-3">
            <span className="text-xl">💡</span>
            <div>
              <p className="text-xs font-bold text-primary dark:text-primary-light mb-0.5">
                Dica Inteligente do Nutri IA
              </p>
              <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                {insights.aiCoachingTip}
              </p>
            </div>
          </div>
        )}
      </div>
    </PaperCard>
  );
}
