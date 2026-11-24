"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PaperCard } from "@/components/ui/PaperCard";
import { useToast } from "@/components/ui/Toast";
import { MealLogModal } from "@/components/meals/MealLogModal";
import { getMealIcon } from "@/components/meals/mealIcons";
import { Camera, Trash2, Loader2, UtensilsCrossed } from "lucide-react";
import { getDailyMealSummary, deleteMealLog } from "@/services/meals";
import type { DailyMealSummaryResponse, MealLogResponse } from "@/types/api";

interface DailyMealDiaryCardProps {
  accessToken: string;
  onMealsUpdated?: () => void;
  className?: string;
}



const MEAL_NAMES: Record<string, string> = {
  BREAKFAST: "Café da Manhã",
  MORNING_SNACK: "Lanche da Manhã",
  LUNCH: "Almoço",
  AFTERNOON_SNACK: "Lanche da Tarde",
  DINNER: "Jantar",
  SUPPER: "Ceia",
  SNACK: "Lanche Livre",
};

export function DailyMealDiaryCard({
  accessToken,
  onMealsUpdated,
  className = "",
}: DailyMealDiaryCardProps) {
  const { showToast } = useToast();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [summary, setSummary] = useState<DailyMealSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const todayDate = new Date().toISOString().split("T")[0];
      const data = await getDailyMealSummary(accessToken, todayDate);
      setSummary(data);
    } catch {
      // Falha silenciosa ou mantém anterior
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const handleDeleteMeal = async (mealId: string) => {
    if (!confirm("Tem certeza que deseja remover este registro de refeição?")) return;
    try {
      setDeletingId(mealId);
      await deleteMealLog(accessToken, mealId);
      showToast("Refeição removida com sucesso.", "success");
      await loadSummary();
      onMealsUpdated?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao remover refeição.";
      showToast(msg, "error");
    } finally {
      setDeletingId(null);
    }
  };

  const handleMealSaved = () => {
    loadSummary();
    onMealsUpdated?.();
  };

  const meals = summary?.meals || [];
  const totalCalories = summary?.totalCalories || 0;
  const totalProteins = summary?.totalProteins || 0;
  const totalCarbs = summary?.totalCarbohydrates || 0;
  const totalFats = summary?.totalFats || 0;

  return (
    <>
      <PaperCard className={`p-6 ${className}`} tape="orange">
        {/* Header com Título e Botão de Escanear */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-stone-200/80 dark:border-stone-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                Food Vision IA
              </span>
              <span className="text-xs text-stone-500 font-semibold">• Diário em Tempo Real</span>
            </div>
            <h2 className="mt-1 font-display text-2xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Camera className="w-5 h-5 text-amber-800 dark:text-amber-300 stroke-[2]" /> <span>Diário de Pratos & Refeições</span>
            </h2>
            <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
              {meals.length} {meals.length === 1 ? "refeição registrada" : "refeições registradas"} hoje ({Math.round(totalCalories)} kcal consumidas)
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 text-xs font-black shadow-xs transition-all cursor-pointer self-start sm:self-auto shrink-0"
          >
            <Camera className="w-4 h-4" />
            <span>Fotografar Prato</span>
          </button>
        </div>

        {/* Barra de Macros Agregados do Dia */}
        {meals.length > 0 && (
          <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
            <div className="rounded-xl bg-orange-50/80 dark:bg-orange-950/30 p-2 border border-orange-200/60 dark:border-orange-900/40">
              <span className="text-[10px] text-orange-700 dark:text-orange-300 block font-bold uppercase">Calorias</span>
              <span className="font-black text-orange-900 dark:text-orange-200 block text-sm mt-0.5">
                {Math.round(totalCalories)} <span className="text-[10px] font-normal">kcal</span>
              </span>
            </div>
            <div className="rounded-xl bg-sky-50/80 dark:bg-sky-950/30 p-2 border border-sky-200/60 dark:border-sky-900/40">
              <span className="text-[10px] text-sky-700 dark:text-sky-300 block font-bold uppercase">Proteínas</span>
              <span className="font-black text-sky-900 dark:text-sky-200 block text-sm mt-0.5">
                {Math.round(totalProteins)}g
              </span>
            </div>
            <div className="rounded-xl bg-amber-50/80 dark:bg-amber-950/30 p-2 border border-amber-200/60 dark:border-amber-900/40">
              <span className="text-[10px] text-amber-700 dark:text-amber-300 block font-bold uppercase">Carbos</span>
              <span className="font-black text-amber-900 dark:text-amber-200 block text-sm mt-0.5">
                {Math.round(totalCarbs)}g
              </span>
            </div>
            <div className="rounded-xl bg-rose-50/80 dark:bg-rose-950/30 p-2 border border-rose-200/60 dark:border-rose-900/40">
              <span className="text-[10px] text-rose-700 dark:text-rose-300 block font-bold uppercase">Gorduras</span>
              <span className="font-black text-rose-900 dark:text-rose-200 block text-sm mt-0.5">
                {Math.round(totalFats)}g
              </span>
            </div>
          </div>
        )}

        {/* Lista de Refeições ou Estado Vazio */}
        <div className="mt-4">
          {loading && meals.length === 0 ? (
            <div className="py-8 text-center text-xs text-stone-400">
              Carregando diário de refeições...
            </div>
          ) : meals.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-stone-300 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/30 p-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 mx-auto mb-2.5">
                <Camera className="w-6 h-6 stroke-[1.75]" />
              </div>
              <h4 className="font-display font-bold text-sm text-stone-800 dark:text-stone-200">
                Nenhum prato fotografado hoje
              </h4>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-sm mx-auto">
                Tire uma foto do que você está comendo agora. A IA estima automaticamente os alimentos e calcula seus macros no diário!
              </p>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Escanear Primeiro Prato</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {meals.map((meal: MealLogResponse) => {
                const MealIcon = getMealIcon(meal.mealType);
                const typeName = MEAL_NAMES[meal.mealType] || meal.mealType;
                const timeStr = meal.consumedAt
                  ? new Date(meal.consumedAt).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "";

                // URL da foto ou placeholder
                const photoSrc = meal.photoUrl
                  ? meal.photoUrl.startsWith("http")
                    ? meal.photoUrl
                    : `${process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || "http://localhost:8080"}${meal.photoUrl}`
                  : null;

                return (
                  <div
                    key={meal.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3 shadow-2xs hover:border-orange-300/70 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {photoSrc ? (
                        <div className="h-14 w-14 rounded-xl overflow-hidden border border-stone-200 dark:border-stone-800 shrink-0 bg-stone-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photoSrc}
                            alt={meal.dishName}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-amber-100/80 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 shrink-0">
                          <MealIcon className="w-6 h-6 stroke-[1.75]" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                            {typeName}
                          </span>
                          {timeStr && (
                            <span className="text-[10px] text-stone-400 font-mono">
                              {timeStr}
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-stone-900 dark:text-stone-100 text-sm truncate">
                          {meal.dishName}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-500 font-medium">
                          <span title="Calorias totais estimadas consumidas nesta refeição" className="font-bold text-orange-600 dark:text-orange-400 cursor-help">
                            {Math.round(meal.totalCalories)} kcal
                          </span>
                          <span>•</span>
                          <span title="Proteínas (P): macronutriente para saciedade e síntese muscular" className="cursor-help">P: {Math.round(meal.proteins)}g</span>
                          <span>•</span>
                          <span title="Carboidratos (C): fonte principal de energia imediata do corpo" className="cursor-help">C: {Math.round(meal.carbohydrates)}g</span>
                          <span>•</span>
                          <span title="Gorduras saudáveis / Lipídios (G): essenciais para absorção vitamínica e hormônios" className="cursor-help">G: {Math.round(meal.fats)}g</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteMeal(meal.id)}
                      disabled={deletingId === meal.id}
                      className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all cursor-pointer text-xs shrink-0"
                      title="Excluir refeição"
                    >
                      {deletingId === meal.id ? <Loader2 className="w-4 h-4 animate-spin text-stone-400" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </PaperCard>

      {/* Modal Unificado de Registro (Texto ou Foto com IA) */}
      {isScannerOpen && (
        <MealLogModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          accessToken={accessToken}
          onMealSaved={handleMealSaved}
        />
      )}
    </>
  );
}
