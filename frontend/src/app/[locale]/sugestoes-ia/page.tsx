"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PaperCard } from "@/components/ui/PaperCard";
import { ActionButton } from "@/components/ui/ActionButton";
import { NotebookPageHeader } from "@/components/ui/Notebook";
import { TextInput, SelectField } from "@/components/ui/FormField";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { generateMealSuggestion } from "@/services/ai";
import { getValidSession } from "@/services/auth";
import { listFamilies } from "@/services/families";
import { addDietMeal, getOrCreateWeeklyDiet, updateDietMeal } from "@/services/diet";
import { createRecipe } from "@/services/recipes";
import {
  detectMealCategory,
  findConflictingMeal,
  getPlanningWeekOptions,
} from "@/services/diet-conflicts";
import { useFamilyContext } from "@/contexts/FamilyContext";
import type { MealSuggestionResponse, RecipeResponse, WeeklyDietResponse } from "@/types/api";

const STORAGE_KEY = "gelu_active_ai_suggestion";

const MEAL_TYPES = [
  { label: "☀️ Café da Manhã", value: "Café da Manhã" },
  { label: "🍽️ Almoço Completo", value: "Almoço" },
  { label: "🥪 Lanche da Tarde", value: "Lanche da Tarde" },
  { label: "🌙 Jantar Leve", value: "Jantar" },
];

const GOALS = [
  { label: "⚖️ Equilíbrio & Saúde Geral", value: "Equilíbrio & Saúde" },
  { label: "🔥 Emagrecimento / Déficit Calórico", value: "Emagrecer" },
  { label: "💪 Hipertrofia / Ganho de Massa", value: "Ganhar massa" },
  { label: "⚡ Preparo Rápido (até 15 min)", value: "Preparo Rápido" },
];

const DAY_OPTIONS = [
  { label: "Segunda-feira", value: "SEG" },
  { label: "Terça-feira", value: "TER" },
  { label: "Quarta-feira", value: "QUA" },
  { label: "Quinta-feira", value: "QUI" },
  { label: "Sexta-feira", value: "SEX" },
  { label: "Sábado", value: "SAB" },
  { label: "Domingo", value: "DOM" },
];

const MEAL_TIME_OPTIONS = [
  { label: "☀️ Café da Manhã (08:00)", value: "Café da Manhã" },
  { label: "🍽️ Almoço (12:30)", value: "Almoço" },
  { label: "🥪 Lanche da Tarde (16:30)", value: "Lanche da Tarde" },
  { label: "🥗 Jantar (20:00)", value: "Jantar" },
  { label: "🌙 Ceia / Snack (22:00)", value: "Ceia / Snack" },
];

const MEAL_TIMES: Record<string, string> = {
  "Café da Manhã": "08:00",
  "Almoço": "12:30",
  "Lanche da Tarde": "16:30",
  "Jantar": "20:00",
  "Ceia / Snack": "22:00",
};

function getTodayDayId(): string {
  const dayIndex = new Date().getDay(); // 0 is Sunday
  const map = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];
  return map[dayIndex] || "SEG";
}

export default function AiSuggestionsPage() {
  const toast = useToast();
  const { activeFamily } = useFamilyContext();

  const [mealType, setMealType] = useState("Almoço");
  const [goal, setGoal] = useState("Equilíbrio & Saúde");
  const [targetCalories, setTargetCalories] = useState("450");
  const [preferences, setPreferences] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<MealSuggestionResponse | null>(null);
  const [createdAt, setCreatedAt] = useState<Date | null>(null);

  // Receita salva no aceite
  const [savedRecipe, setSavedRecipe] = useState<RecipeResponse | null>(null);

  // Modais de Ação
  const [acceptModalOpen, setAcceptModalOpen] = useState(false);
  const [confirmRejectOpen, setConfirmRejectOpen] = useState(false);

  // Opções de Semanas de Planejamento (Semana Atual, Próxima, etc.)
  const weekOptions = useMemo(() => getPlanningWeekOptions(4), []);
  const [targetWeek, setTargetWeek] = useState(weekOptions[0]?.id || "");
  const [targetWeekDiet, setTargetWeekDiet] = useState<WeeklyDietResponse | null>(null);
  const [loadingWeekDiet, setLoadingWeekDiet] = useState(false);

  // Parâmetros do Modal de Agendamento no Cardápio
  const [targetDay, setTargetDay] = useState(getTodayDayId());
  const [targetMeal, setTargetMeal] = useState("Almoço");
  const [conflictResolution, setConflictResolution] = useState<"REPLACE" | "KEEP_BOTH">("REPLACE");
  const [savingAction, setSavingAction] = useState(false);

  // Carregar sugestão salva no LocalStorage ao montar
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.suggestion) {
          setSuggestion(parsed.suggestion);
          if (parsed.params) {
            if (parsed.params.mealType) setMealType(parsed.params.mealType);
            if (parsed.params.goal) setGoal(parsed.params.goal);
            if (parsed.params.targetCalories) setTargetCalories(parsed.params.targetCalories);
            if (parsed.params.preferences) setPreferences(parsed.params.preferences);
          }
          if (parsed.createdAt) {
            setCreatedAt(new Date(parsed.createdAt));
          }
        }
      }
    } catch (e) {
      console.warn("Falha ao recuperar sugestão IA do localStorage", e);
    }
  }, []);

  // Sincronizar targetMeal com mealType
  useEffect(() => {
    if (mealType) {
      setTargetMeal(mealType);
    }
  }, [mealType]);

  const targetMealTime = useMemo(() => {
    return MEAL_TIMES[targetMeal] || "12:30";
  }, [targetMeal]);

  // Carregar a dieta da semana selecionada para verificar conflitos em tempo real
  const loadTargetWeekDiet = useCallback(
    async (weekMonday: string) => {
      try {
        setLoadingWeekDiet(true);
        const session = await getValidSession();
        if (!session) return;

        let familyId = activeFamily?.id;
        if (!familyId) {
          const families = await listFamilies(session.accessToken);
          if (families && families.length > 0) {
            familyId = families[0].id;
          }
        }

        if (familyId) {
          const d = await getOrCreateWeeklyDiet(session.accessToken, familyId, weekMonday);
          setTargetWeekDiet(d);
        }
      } catch (e) {
        console.warn("Erro ao carregar cardápio da semana selecionada", e);
      } finally {
        setLoadingWeekDiet(false);
      }
    },
    [activeFamily?.id]
  );

  useEffect(() => {
    if (acceptModalOpen && targetWeek) {
      loadTargetWeekDiet(targetWeek);
    }
  }, [acceptModalOpen, targetWeek, loadTargetWeekDiet]);

  // Checagem de conflito dinâmico na semana e dia selecionados
  const targetWeekConflict = useMemo(() => {
    return findConflictingMeal(
      targetWeekDiet?.meals,
      targetDay,
      targetMeal,
      targetMealTime
    );
  }, [targetWeekDiet?.meals, targetDay, targetMeal, targetMealTime]);

  const formattedCreatedTime = useMemo(() => {
    if (!createdAt) return null;
    try {
      return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(createdAt);
    } catch {
      return null;
    }
  }, [createdAt]);

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      const res = await generateMealSuggestion({
        mealType,
        goal,
        targetCalories: parseInt(targetCalories, 10) || 450,
        preferences: preferences.trim() || undefined,
      });

      const now = new Date();
      setSuggestion(res);
      setCreatedAt(now);
      setSavedRecipe(null); // Resetar receita salva para a nova sugestão

      if (typeof window !== "undefined") {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            suggestion: res,
            params: {
              mealType,
              goal,
              targetCalories,
              preferences,
            },
            createdAt: now.toISOString(),
          })
        );
      }

      toast.success("Sugestão gastronômica elaborada pela IA! 🥗");
    } catch {
      toast.error("Não foi possível gerar a sugestão no momento.");
    } finally {
      setLoading(false);
    }
  };

  const handleRejectSuggestion = () => {
    setSuggestion(null);
    setCreatedAt(null);
    setSavedRecipe(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
    setConfirmRejectOpen(false);
    toast.info("Sugestão gastronômica descartada.");
  };

  /**
   * Passo 1 do Aceite:
   * Salva primeiro como Receita no Livro de Receitas da casa!
   * Obtém o ID da receita salva e abre o modal de agendamento na Dieta Semanal.
   */
  const handleStartAcceptSuggestion = async () => {
    if (!suggestion) return;
    try {
      setSavingAction(true);
      const session = await getValidSession();
      if (!session) {
        toast.error("Faça login para aceitar a sugestão.");
        return;
      }

      // Se já temos a receita criada para esta sugestão, podemos reutilizar
      let recipe = savedRecipe;
      if (!recipe) {
        recipe = await createRecipe(session.accessToken, {
          name: suggestion.title,
          description: `${suggestion.explanation}\n\nDica do Chef: ${suggestion.chefTip}`,
          category: suggestion.category || "Saudavel",
          prepTimeMinutes: suggestion.prepTimeMinutes || 20,
          estimatedCalories: suggestion.estimatedCalories || 450,
          servings: 2,
          videoUrl: null,
          carbohydrates: parseFloat(suggestion.carbsGrams) || null,
          proteins: parseFloat(suggestion.proteinGrams) || null,
          fats: parseFloat(suggestion.fatGrams) || null,
          ingredients: suggestion.ingredients.map((ing) => ({
            name: ing,
            quantity: null,
            unit: null,
          })),
          steps: [
            {
              instruction: `Modo de preparo com os ingredientes recomendados: ${suggestion.ingredients.join(
                ", "
              )}. Dica especial do chef: ${suggestion.chefTip}`,
            },
          ],
        });
        setSavedRecipe(recipe);
        toast.success(`Receita "${recipe.name}" salva no Livro de Receitas! 🎉`);
      }

      // Abrir modal para escolha da semana e tratamento de conflitos
      setConflictResolution("REPLACE");
      setAcceptModalOpen(true);
    } catch {
      toast.error("Não foi possível salvar a receita no momento.");
    } finally {
      setSavingAction(false);
    }
  };

  /**
   * Finaliza apenas guardando no Livro de Receitas (sem adicionar à dieta)
   */
  const handleKeepOnlyInRecipeBook = () => {
    setSuggestion(null);
    setCreatedAt(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
    setAcceptModalOpen(false);
    toast.success(
      `Receita "${savedRecipe?.name || suggestion?.title}" guardada com sucesso! Você pode consultá-la em Receitas.`
    );
  };

  /**
   * Passo 2 do Aceite:
   * Adiciona ao Cardápio Semanal na semana e dia escolhidos, vinculando a receita salva!
   */
  const handleConfirmAddToDiet = async () => {
    if (!suggestion || !savedRecipe) return;
    try {
      setSavingAction(true);
      const session = await getValidSession();
      if (!session) {
        toast.error("Faça login para adicionar ao cardápio.");
        return;
      }

      let familyId = activeFamily?.id;
      if (!familyId) {
        const families = await listFamilies(session.accessToken);
        if (families && families.length > 0) {
          familyId = families[0].id;
        }
      }

      if (!familyId) {
        toast.error("Cadastre uma família para salvar na dieta semanal.");
        return;
      }

      // Garantir que a dieta da semana escolhida está disponível
      let diet = targetWeekDiet;
      if (!diet || diet.weekStart !== targetWeek) {
        diet = await getOrCreateWeeklyDiet(session.accessToken, familyId, targetWeek);
      }

      if (!diet) {
        toast.error("Nenhuma dieta semanal encontrada para esta semana.");
        return;
      }

      const payload = {
        weekDay: targetDay,
        mealName: savedRecipe.name,
        mealTime: targetMealTime,
        recipeId: savedRecipe.id, // VÍNCULO CORRETO COM A RECEITA SALVA
        servings: 2,
        notes: `Sugestão IA (${suggestion.estimatedCalories} kcal • ${suggestion.category}) • Dica: ${suggestion.chefTip}`,
      };

      if (targetWeekConflict && conflictResolution === "REPLACE") {
        await updateDietMeal(session.accessToken, targetWeekConflict.id, payload);
        toast.success(
          `Refeição anterior substituída por "${savedRecipe.name}" no Cardápio! 🔄`
        );
      } else {
        await addDietMeal(session.accessToken, diet.id, payload);
        toast.success(
          `Prato "${savedRecipe.name}" adicionado ao Cardápio Semanal com a receita vinculada! 🍽️`
        );
      }

      // Conclui e limpa a sugestão ativa pois foi aceita
      setSuggestion(null);
      setCreatedAt(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEY);
      }
      setAcceptModalOpen(false);
    } catch {
      toast.error("Erro ao adicionar à dieta semanal.");
    } finally {
      setSavingAction(false);
    }
  };

  return (
    <AppShell>
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <NotebookPageHeader
          title="✨ Assistente Nutricional IA"
          subtitle="Sugestões sob medida para balancear calorias, rotina e o paladar do casal."
        />

        <div className="mt-8 grid gap-8 lg:grid-cols-12">
          {/* Formulário de Configuração */}
          <div className="lg:col-span-5">
            <PaperCard className="p-6" tape="orange">
              <h3 className="font-display text-xl font-bold text-stone-900 dark:text-stone-100 mb-4 flex items-center gap-2">
                <span>🎯</span> O que deseja hoje?
              </h3>

              <form onSubmit={handleGenerate} className="space-y-4">
                <SelectField
                  label="Tipo de Refeição"
                  value={mealType}
                  onValueChange={setMealType}
                  options={MEAL_TYPES}
                />

                <SelectField
                  label="Objetivo Nutricional"
                  value={goal}
                  onValueChange={setGoal}
                  options={GOALS}
                />

                <TextInput
                  label="Meta de Calorias (kcal)"
                  type="number"
                  min="150"
                  max="1500"
                  value={targetCalories}
                  onValueChange={setTargetCalories}
                  required
                />

                <TextInput
                  label="Ingredientes ou Preferências (Opcional)"
                  value={preferences}
                  onValueChange={setPreferences}
                  placeholder="Ex: sem lactose, tem frango e brócolis..."
                />

                <div className="pt-2">
                  <ActionButton
                    type="submit"
                    className="w-full justify-center shadow-md cursor-pointer"
                    disabled={loading}
                  >
                    {loading
                      ? "✨ Criando Receita..."
                      : suggestion
                        ? "🔄 Gerar Nova Sugestão"
                        : "✨ Gerar Sugestão Inteligente"}
                  </ActionButton>
                </div>
              </form>
            </PaperCard>
          </div>

          {/* Resultado da Sugestão */}
          <div className="lg:col-span-7">
            {suggestion ? (
              <PaperCard className="p-6 sm:p-8 relative" tape="green">
                {/* Banner de status ativo/persistido */}
                <div className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-300/80 dark:border-amber-800/80 bg-amber-50/90 dark:bg-amber-950/40 px-3.5 py-2 text-xs">
                  <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
                    <span>Sugestão ativa • Salva até sua decisão</span>
                  </div>
                  {formattedCreatedTime && (
                    <span className="text-amber-700 dark:text-amber-300 text-[11px] font-medium">
                      Gerada em {formattedCreatedTime}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/80 dark:border-stone-800 pb-4 mb-4">
                  <span className="rounded-full bg-amber-100 dark:bg-amber-950/60 px-3 py-1 text-xs font-bold text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
                    {suggestion.category} • ~{suggestion.prepTimeMinutes} min
                  </span>

                  <span className="font-black text-xl text-amber-700 dark:text-amber-400">
                    {suggestion.estimatedCalories} kcal
                  </span>
                </div>

                <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 leading-tight">
                  {suggestion.title}
                </h3>

                <p className="mt-3 text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                  {suggestion.explanation}
                </p>

                {/* Macro Nutrientes */}
                <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl border border-stone-200/80 dark:border-stone-800 bg-stone-50 dark:bg-[#25201c] p-2.5">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                      Proteínas
                    </span>
                    <span className="text-sm font-extrabold text-stone-800 dark:text-stone-200 mt-0.5 block">
                      {suggestion.proteinGrams}
                    </span>
                  </div>

                  <div className="rounded-xl border border-stone-200/80 dark:border-stone-800 bg-stone-50 dark:bg-[#25201c] p-2.5">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                      Carboidratos
                    </span>
                    <span className="text-sm font-extrabold text-stone-800 dark:text-stone-200 mt-0.5 block">
                      {suggestion.carbsGrams}
                    </span>
                  </div>

                  <div className="rounded-xl border border-stone-200/80 dark:border-stone-800 bg-stone-50 dark:bg-[#25201c] p-2.5">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                      Gorduras
                    </span>
                    <span className="text-sm font-extrabold text-stone-800 dark:text-stone-200 mt-0.5 block">
                      {suggestion.fatGrams}
                    </span>
                  </div>
                </div>

                {/* Ingredientes */}
                <div className="mt-5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-2">
                    Ingredientes Recomendados:
                  </h4>
                  <ul className="space-y-1.5 text-xs text-stone-600 dark:text-stone-300">
                    {suggestion.ingredients.map((ing, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                        <span>{ing}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Dica do Chef */}
                <div className="mt-5 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-950/20 p-4">
                  <span className="text-xs font-bold text-amber-950 dark:text-amber-200 block mb-1">
                    👩‍🍳 Dica de Ouro do Chef:
                  </span>
                  <p className="text-xs text-amber-900 dark:text-amber-300 leading-relaxed">
                    {suggestion.chefTip}
                  </p>
                </div>

                {/* Barra de Ações: Aceitar, Recusar ou Gerar Outra */}
                <div className="mt-8 pt-5 border-t border-stone-200/80 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {/* Botão Recusar / Descartar */}
                    <button
                      type="button"
                      onClick={() => setConfirmRejectOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-red-300 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50 px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                    >
                      <span>✕</span> Recusar
                    </button>

                    {/* Botão Gerar Outra */}
                    <button
                      type="button"
                      onClick={() => handleGenerate()}
                      disabled={loading}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#28221d] text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 px-3.5 py-2.5 text-xs font-semibold transition-all cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      <span>🔄</span> {loading ? "Gerando..." : "Gerar Outra"}
                    </button>
                  </div>

                  {/* Botão Aceitar Sugestão */}
                  <button
                    type="button"
                    onClick={handleStartAcceptSuggestion}
                    disabled={savingAction}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50"
                  >
                    <span>✓</span> {savingAction ? "Salvando Receita..." : "Aceitar Sugestão"}
                  </button>
                </div>
              </PaperCard>
            ) : (
              <div className="h-full min-h-[360px] flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-stone-300 dark:border-stone-800 p-8 text-center bg-white/40 dark:bg-[#211c18]/40">
                <span className="text-5xl block mb-3">🥗</span>
                <h4 className="font-display text-xl font-bold text-stone-800 dark:text-stone-200">
                  Pronto para criar uma refeição mágica?
                </h4>
                <p className="mt-1.5 text-xs text-stone-500 dark:text-stone-400 max-w-sm">
                  Escolha o tipo de prato e objetivo ao lado e clique em &quot;Gerar Sugestão Inteligente&quot; para balancear o seu dia.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal de Aceite: Agendamento no Cardápio Semanal com Detecção de Conflitos */}
        {suggestion && (
          <Modal
            isOpen={acceptModalOpen}
            onClose={() => setAcceptModalOpen(false)}
            maxWidth="md"
          >
            <div className="text-left space-y-5">
              {/* Header com confirmação de receita salva */}
              <div className="flex items-center gap-3 border-b border-stone-200/80 dark:border-stone-800 pb-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-xl border border-emerald-300 dark:border-emerald-800">
                  📖
                </span>
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                    <span>✓</span> Salva no Livro de Receitas
                  </div>
                  <h3 className="font-display text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100 leading-tight">
                    Deseja adicionar ao Cardápio Semanal agora?
                  </h3>
                </div>
              </div>

              {/* Card de prévia da receita */}
              <div className="rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-stone-50 dark:bg-[#26201b] p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-sm text-stone-900 dark:text-stone-100">
                    {savedRecipe?.name || suggestion.title}
                  </span>
                  <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                    {savedRecipe?.estimatedCalories || suggestion.estimatedCalories} kcal
                  </span>
                </div>
                <p className="mt-1 text-xs text-stone-600 dark:text-stone-300 line-clamp-2">
                  {suggestion.explanation}
                </p>
              </div>

              <div className="space-y-4">
                {/* 1. Escolha da Semana */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 block mb-1">
                    1. Escolha a Semana
                  </label>
                  <select
                    value={targetWeek}
                    onChange={(e) => setTargetWeek(e.target.value)}
                    className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white/95 dark:bg-[#28221d] px-3.5 py-2.5 text-sm font-semibold text-stone-900 dark:text-stone-100 shadow-sm focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  >
                    {weekOptions.map((w) => (
                      <option key={w.id} value={w.id} className="dark:bg-[#28221d] dark:text-stone-100">
                        {w.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* 2. Dia da Semana */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 block mb-1">
                      2. Dia da Semana
                    </label>
                    <select
                      value={targetDay}
                      onChange={(e) => setTargetDay(e.target.value)}
                      className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white/95 dark:bg-[#28221d] px-3 py-2 text-sm font-semibold text-stone-900 dark:text-stone-100 shadow-sm focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    >
                      {DAY_OPTIONS.map((d) => (
                        <option key={d.value} value={d.value} className="dark:bg-[#28221d] dark:text-stone-100">
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 3. Momento da Refeição */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 block mb-1">
                      3. Momento da Refeição
                    </label>
                    <select
                      value={targetMeal}
                      onChange={(e) => setTargetMeal(e.target.value)}
                      className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white/95 dark:bg-[#28221d] px-3 py-2 text-sm font-semibold text-stone-900 dark:text-stone-100 shadow-sm focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    >
                      {MEAL_TIME_OPTIONS.map((m) => (
                        <option key={m.value} value={m.value} className="dark:bg-[#28221d] dark:text-stone-100">
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 4. Verificação de Conflitos em Tempo Real */}
                {loadingWeekDiet ? (
                  <div className="text-xs text-stone-400 italic py-1">
                    Verificando disponibilidade na semana...
                  </div>
                ) : targetWeekConflict ? (
                  <div className="rounded-2xl border-2 border-amber-400/90 dark:border-amber-600/70 bg-amber-50/95 dark:bg-amber-950/40 p-4 shadow-xs">
                    <div className="flex items-start gap-3">
                      <span className="text-xl shrink-0">⚠️</span>
                      <div className="flex-1 text-xs">
                        <h5 className="font-bold text-amber-950 dark:text-amber-200">
                          Conflito no Cardápio: Já existe um {detectMealCategory(targetWeekConflict.mealName, targetWeekConflict.mealTime)} nesta semana em {DAY_OPTIONS.find((d) => d.value === targetDay)?.label || targetDay}!
                        </h5>
                        <p className="mt-1 text-amber-900 dark:text-amber-300">
                          Refeição cadastrada: <strong>&ldquo;{targetWeekConflict.mealName}&rdquo;</strong> {targetWeekConflict.mealTime ? `às ${targetWeekConflict.mealTime}` : ""}.
                        </p>
                        <p className="mt-1 text-[11px] text-amber-800 dark:text-amber-400">
                          Como deseja proceder?
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setConflictResolution("REPLACE")}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                              conflictResolution === "REPLACE"
                                ? "bg-amber-600 text-white shadow-xs"
                                : "bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-300 dark:border-stone-700 hover:bg-stone-50"
                            }`}
                          >
                            🔄 Substituir refeição existente
                          </button>
                          <button
                            type="button"
                            onClick={() => setConflictResolution("KEEP_BOTH")}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                              conflictResolution === "KEEP_BOTH"
                                ? "bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 shadow-xs"
                                : "bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-300 dark:border-stone-700 hover:bg-stone-50"
                            }`}
                          >
                            ➕ Manter ambas (prato extra/acompanhamento)
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-emerald-300/80 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/30 px-3.5 py-2.5 text-xs flex items-center gap-2 text-emerald-900 dark:text-emerald-200">
                    <span>✅</span>
                    <span className="font-semibold">
                      Horário livre! Nenhum outro {targetMeal} planejado para {DAY_OPTIONS.find((d) => d.value === targetDay)?.label || targetDay} nesta semana.
                    </span>
                  </div>
                )}
              </div>

              {/* Botões de Ação do Modal */}
              <div className="mt-7 pt-4 border-t border-stone-200/80 dark:border-stone-800 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between sm:items-center">
                <button
                  type="button"
                  onClick={handleKeepOnlyInRecipeBook}
                  disabled={savingAction}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all cursor-pointer"
                >
                  📖 Apenas Guardar no Livro de Receitas
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAcceptModalOpen(false)}
                    disabled={savingAction}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 transition-all cursor-pointer"
                  >
                    Voltar
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmAddToDiet}
                    disabled={savingAction}
                    className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    {savingAction ? "Salvando..." : "✓ Confirmar no Cardápio Semanal"}
                  </button>
                </div>
              </div>
            </div>
          </Modal>
        )}

        {/* Confirmação de Recusa no padrão do sistema */}
        <ConfirmDialog
          isOpen={confirmRejectOpen}
          onClose={() => setConfirmRejectOpen(false)}
          onConfirm={handleRejectSuggestion}
          title="Recusar Sugestão de Refeição?"
          description={
            <span>
              Tem certeza de que deseja recusar a sugestão{" "}
              <strong>&ldquo;{suggestion?.title}&rdquo;</strong>? O prato será descartado da tela
              e você poderá gerar novas opções quando quiser.
            </span>
          }
          confirmLabel="Sim, recusar"
          cancelLabel="Manter sugestão"
          variant="danger"
        />
      </main>
    </AppShell>
  );
}
