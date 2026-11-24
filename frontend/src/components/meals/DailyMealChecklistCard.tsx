"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PaperCard } from "@/components/ui/PaperCard";
import { ActionButton } from "@/components/ui/ActionButton";
import { useToast } from "@/components/ui/Toast";
import { getDailyMealChecklist, quickCheckinMeal } from "@/services/meals";
import { MealLogModal } from "@/components/meals/MealLogModal";
import type { DailyMealChecklistItemResponse } from "@/types/api";

interface DailyMealChecklistCardProps {
  accessToken: string;
  familyId?: string;
  onMealsUpdated?: () => void;
  className?: string;
}

const MEAL_ICONS: Record<string, string> = {
  BREAKFAST: "☕",
  MORNING_SNACK: "🍏",
  LUNCH: "🍲",
  AFTERNOON_SNACK: "🥪",
  DINNER: "🥗",
  SUPPER: "🌙",
  SNACK: "🥨",
};

export function DailyMealChecklistCard({
  accessToken,
  familyId,
  onMealsUpdated,
  className = "",
}: DailyMealChecklistCardProps) {
  const { showToast } = useToast();
  const [checklist, setChecklist] = useState<DailyMealChecklistItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeChecklistItem, setActiveChecklistItem] = useState<DailyMealChecklistItemResponse | null>(null);

  const loadChecklist = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const todayDate = new Date().toISOString().split("T")[0];
      const data = await getDailyMealChecklist(accessToken, todayDate, familyId);
      setChecklist(data);
    } catch (err: unknown) {
      console.error("Erro ao carregar checklist diário:", err);
    } finally {
      setLoading(false);
    }
  }, [accessToken, familyId]);

  useEffect(() => {
    loadChecklist();
  }, [loadChecklist]);

  // Ação 1 Clique: Confirmar que comeu o planejado
  const handleQuickCheckin = async (item: DailyMealChecklistItemResponse) => {
    try {
      setActionLoadingId(item.dietMealId);
      const todayDate = new Date().toISOString().split("T")[0];
      await quickCheckinMeal(accessToken, {
        dietMealId: item.dietMealId,
        date: todayDate,
        status: "PLANNED_CONSUMED",
      });

      showToast(
        `✓ Refeição Confirmada: ${item.mealName} (~${Math.round(item.plannedCalories || 0)} kcal)`,
        "success"
      );

      // Recarrega checklist e notifica dashboard
      await loadChecklist();
      onMealsUpdated?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao confirmar refeição.";
      showToast(`Falha ao registrar: ${msg}`, "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Ação 1 Clique: Pular refeição
  const handleSkipMeal = async (item: DailyMealChecklistItemResponse) => {
    try {
      setActionLoadingId(item.dietMealId);
      const todayDate = new Date().toISOString().split("T")[0];
      await quickCheckinMeal(accessToken, {
        dietMealId: item.dietMealId,
        date: todayDate,
        status: "SKIPPED",
        skipReason: "Não consumido / Jejum",
      });

      showToast(`Refeição ${item.mealName} marcada como pulada.`, "info");

      await loadChecklist();
      onMealsUpdated?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao atualizar.";
      showToast(`Falha ao registrar: ${msg}`, "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Abrir modal para refeição diferente
  const handleCustomMeal = (item: DailyMealChecklistItemResponse) => {
    setActiveChecklistItem(item);
    setIsModalOpen(true);
  };

  // Abrir modal para refeição extra (não planejada)
  const handleAddExtraMeal = () => {
    setActiveChecklistItem(null);
    setIsModalOpen(true);
  };

  const completedCount = checklist.filter((item) => item.status !== "PENDING").length;
  const progressPercent = checklist.length > 0 ? Math.round((completedCount / checklist.length) * 100) : 0;

  return (
    <PaperCard className={`p-6 ${className}`} tape="green">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-stone-200/80 dark:border-stone-800 pb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Checklist Alimentar Inteligente
            </span>
            <span className="text-xs text-stone-500 font-semibold">• Hoje</span>
          </div>
          <h2 className="mt-1 font-display text-2xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <span>🍽️</span> O que você comeu hoje?
          </h2>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
            {completedCount} de {checklist.length} refeições registradas ({progressPercent}% do plano)
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddExtraMeal}
          className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary dark:text-primary-light font-bold text-xs px-3 py-1.5 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <span>＋</span> Registrar Refeição Extra
        </button>
      </div>

      {/* Barra de Progresso */}
      {checklist.length > 0 && (
        <div className="mt-3 mb-4 h-2 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800 border border-stone-200/60 dark:border-stone-700/60">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {/* Lista do Checklist */}
      {loading ? (
        <div className="py-8 text-center text-xs text-stone-500 animate-pulse">
          Carregando checklist de refeições de hoje...
        </div>
      ) : checklist.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-stone-300 dark:border-stone-800 bg-white/40 dark:bg-[#211c18]/40 p-6 text-center">
          <span className="text-3xl block mb-2">🥗</span>
          <p className="text-xs text-stone-600 dark:text-stone-400 font-medium">
            Nenhuma refeição planejada na Dieta Semanal para hoje.
          </p>
          <div className="mt-3 flex justify-center gap-2">
            <button
              type="button"
              onClick={handleAddExtraMeal}
              className="inline-flex items-center gap-1 text-xs font-bold text-primary underline cursor-pointer"
            >
              ＋ Registrar refeição livre agora
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {checklist.map((item) => {
            const isLoading = actionLoadingId === item.dietMealId;
            const icon = MEAL_ICONS[item.mealName.toUpperCase()] || "🍽️";

            return (
              <div
                key={item.dietMealId}
                className={`rounded-xl border p-3.5 transition-all ${
                  item.status === "PLANNED_CONSUMED"
                    ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/50 dark:bg-emerald-950/20"
                    : item.status === "CUSTOM_CONSUMED"
                    ? "border-blue-200 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-950/20"
                    : item.status === "SKIPPED"
                    ? "border-stone-200 bg-stone-100/50 dark:border-stone-800 dark:bg-stone-900/30 opacity-70"
                    : "border-stone-200 dark:border-stone-700/80 bg-white dark:bg-[#25201c] shadow-2xs hover:border-primary/40"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Informações da Refeição */}
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/60 text-base font-bold text-amber-900 dark:text-amber-200">
                      {icon}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                          {item.mealName}
                        </p>
                        {item.mealTime && (
                          <span className="text-[11px] font-semibold text-stone-500 bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded">
                            {item.mealTime.substring(0, 5)}
                          </span>
                        )}
                        {item.plannedCalories && (
                          <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            ~{Math.round(item.plannedCalories)} kcal planejadas
                          </span>
                        )}
                      </div>

                      {/* Receitas planejadas */}
                      {item.plannedRecipes && item.plannedRecipes.length > 0 && (
                        <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 line-clamp-1">
                          <span className="font-semibold text-stone-700 dark:text-stone-300">Planejado:</span>{" "}
                          {item.plannedRecipes.join(" • ")}
                        </p>
                      )}

                      {/* Informações de consumo personalizado */}
                      {item.status === "CUSTOM_CONSUMED" && item.customDishName && (
                        <p className="text-xs text-blue-700 dark:text-blue-300 font-medium mt-1">
                          🥣 Consumiu: {item.customDishName} ({Math.round(item.consumedCalories || 0)} kcal)
                        </p>
                      )}

                      {/* Motivo de pular */}
                      {item.status === "SKIPPED" && (
                        <p className="text-xs text-stone-500 dark:text-stone-400 italic mt-0.5">
                          Refeição pulada: {item.skipReason || "Não consumida"}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Ações / Status */}
                  <div className="flex items-center gap-2 self-end md:self-auto shrink-0 flex-wrap">
                    {item.status === "PENDING" ? (
                      <>
                        {/* 1-Clique: Comi o planejado */}
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => handleQuickCheckin(item)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 shadow-2xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                          <span>✓</span> Comi o planejado
                        </button>

                        {/* Comi diferente */}
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => handleCustomMeal(item)}
                          className="inline-flex items-center gap-1 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:border-primary font-semibold text-xs px-2.5 py-1.5 transition-colors cursor-pointer"
                        >
                          <span>✏️</span> Comi diferente
                        </button>

                        {/* Pulei */}
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => handleSkipMeal(item)}
                          className="inline-flex items-center text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 text-xs px-2 py-1.5 transition-colors cursor-pointer"
                        >
                          Pular
                        </button>
                      </>
                    ) : item.status === "PLANNED_CONSUMED" ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg">
                          ✓ Consumido ({Math.round(item.consumedCalories || item.plannedCalories || 0)} kcal)
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCustomMeal(item)}
                          className="text-[11px] text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 underline cursor-pointer"
                        >
                          Editar
                        </button>
                      </div>
                    ) : item.status === "CUSTOM_CONSUMED" ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg">
                          🥗 Substituição (+{Math.round(item.consumedCalories || 0)} kcal)
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCustomMeal(item)}
                          className="text-[11px] text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 underline cursor-pointer"
                        >
                          Alterar
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-stone-500 bg-stone-200/80 dark:bg-stone-800 px-2.5 py-1 rounded-lg">
                          ✕ Pulada
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuickCheckin(item)}
                          className="text-[11px] text-primary hover:underline cursor-pointer"
                        >
                          Comi afinal
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Unificado de Registro (Texto/Voz com IA ou Foto) */}
      {isModalOpen && (
        <MealLogModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setActiveChecklistItem(null);
          }}
          accessToken={accessToken}
          dietMealId={activeChecklistItem?.dietMealId}
          defaultMealType={activeChecklistItem?.mealName}
          defaultDishName={activeChecklistItem?.plannedRecipes?.join(", ")}
          onMealSaved={() => {
            setIsModalOpen(false);
            setActiveChecklistItem(null);
            loadChecklist();
            onMealsUpdated?.();
          }}
        />
      )}
    </PaperCard>
  );
}
