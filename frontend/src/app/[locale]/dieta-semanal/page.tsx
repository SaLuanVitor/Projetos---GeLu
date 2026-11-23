"use client";

import { AppShell } from "@/components/layout/AppShell";
import { ActionButton } from "@/components/ui/ActionButton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Modal } from "@/components/ui/Modal";
import { PaperCard } from "@/components/ui/PaperCard";
import { useToast } from "@/components/ui/Toast";
import { FoodVisionScannerModal } from "@/components/meals/FoodVisionScannerModal";
import { Link, useRouter } from "@/i18n/navigation";
import { getValidSession, handleInvalidSession } from "@/services/auth";
import {
  addDietMeal,
  copyWeeklyDiet,
  deleteDietMeal,
  getOrCreateWeeklyDiet,
  updateDietMeal,
} from "@/services/diet";
import { detectMealCategory, findConflictingMeal } from "@/services/diet-conflicts";
import { listRecipes } from "@/services/recipes";
import { useFamilyContext } from "@/contexts/FamilyContext";
import { subscribeToFamilyEvents } from "@/hooks/useFamilySocket";
import type {
  DietMealResponse,
  RecipeResponse,
  WeeklyDietResponse,
} from "@/types/api";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

const DAYS = [
  { id: "SEG", namePt: "Segunda-feira", short: "Seg" },
  { id: "TER", namePt: "Terça-feira", short: "Ter" },
  { id: "QUA", namePt: "Quarta-feira", short: "Qua" },
  { id: "QUI", namePt: "Quinta-feira", short: "Qui" },
  { id: "SEX", namePt: "Sexta-feira", short: "Sex" },
  { id: "SAB", namePt: "Sábado", short: "Sáb" },
  { id: "DOM", namePt: "Domingo", short: "Dom" },
];

const MEAL_PRESETS = [
  { name: "Café da Manhã", time: "08:00", icon: "☕" },
  { name: "Almoço", time: "12:30", icon: "🍲" },
  { name: "Lanche da Tarde", time: "16:30", icon: "🍎" },
  { name: "Jantar", time: "20:00", icon: "🥗" },
  { name: "Ceia / Snack", time: "22:00", icon: "🌙" },
];

function getMealIcon(name: string) {
  const low = name.toLowerCase();
  if (low.includes("café") || low.includes("cafe")) return "☕";
  if (low.includes("almoço") || low.includes("almoco")) return "🍲";
  if (low.includes("lanche")) return "🍎";
  if (low.includes("jantar") || low.includes("janta")) return "🥗";
  if (low.includes("ceia") || low.includes("snack")) return "🌙";
  return "🍽️";
}

function getMondayOfDate(d: Date): string {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // 0 = Mon, 6 = Sun
  date.setDate(date.getDate() - day);
  return date.toISOString().split("T")[0];
}

export default function WeeklyDietPage() {
  const router = useRouter();
  const toast = useToast();
  const { activeFamily, isPersonal } = useFamilyContext();

  const [recipes, setRecipes] = useState<RecipeResponse[]>([]);
  const [diet, setDiet] = useState<WeeklyDietResponse | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [foodVisionOpen, setFoodVisionOpen] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState<string>(() =>
    getMondayOfDate(new Date())
  );

  const todayIndex = (new Date().getDay() + 6) % 7;
  const [selectedDay, setSelectedDay] = useState(DAYS[todayIndex].id);
  const [loading, setLoading] = useState(true);

  // Modal de Refeição
  const [mealModalOpen, setMealModalOpen] = useState(false);
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [formMealName, setFormMealName] = useState("Almoço");
  const [formMealTime, setFormMealTime] = useState("12:30");
  const [formWeekDay, setFormWeekDay] = useState(DAYS[todayIndex].id);
  const [formRecipeId, setFormRecipeId] = useState<string>("");
  const [formServings, setFormServings] = useState<number>(1);
  const [formPersonUserIds, setFormPersonUserIds] = useState<string[]>([]);
  const [formNotes, setFormNotes] = useState("");
  const [savingMeal, setSavingMeal] = useState(false);
  const [conflictResolution, setConflictResolution] = useState<"REPLACE" | "KEEP_BOTH">("REPLACE");

  // Conflito de refeição no mesmo dia/momento
  const conflictingMeal = useMemo(() => {
    return findConflictingMeal(
      diet?.meals,
      formWeekDay,
      formMealName,
      formMealTime,
      editingMealId
    );
  }, [diet?.meals, formWeekDay, formMealName, formMealTime, editingMealId]);

  // Modal de Exclusão
  const [mealToDelete, setMealToDelete] = useState<DietMealResponse | null>(null);
  const [deletingMeal, setDeletingMeal] = useState(false);

  // Modal de Copiar Cardápio
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [targetWeekInput, setTargetWeekInput] = useState("");
  const [copying, setCopying] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const session = await getValidSession();
      if (!session) {
        router.replace("/login");
        return;
      }
      setSessionToken(session.accessToken);

      // 1. Carregar Dieta da Semana para família ativa ou contexto pessoal
      const familyIdToUse = isPersonal ? undefined : activeFamily?.id;
      const dietData = await getOrCreateWeeklyDiet(
        session.accessToken,
        familyIdToUse,
        currentWeekStart,
        isPersonal
      );
      setDiet(dietData);

      // 2. Carregar Receitas para seleção
      const userRecipes = await listRecipes(session.accessToken);
      setRecipes(userRecipes);
    } catch (err) {
      if (handleInvalidSession(err, () => router.replace("/login"))) return;
      toast.error("Erro ao carregar cardápio semanal.");
    } finally {
      setLoading(false);
    }
  }, [activeFamily?.id, currentWeekStart, isPersonal, router, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Atualizações em tempo real para a família ativa
  useEffect(() => {
    if (isPersonal || !activeFamily?.id) return;
    const unsubscribe = subscribeToFamilyEvents((event) => {
      if (
        event.familyId === activeFamily.id &&
        (event.type === "MEAL_ADDED" ||
          event.type === "MEAL_UPDATED" ||
          event.type === "MEAL_DELETED")
      ) {
        loadData();
      }
    });
    return unsubscribe;
  }, [activeFamily?.id, isPersonal, loadData]);

  // Navegação de Semanas
  const handlePrevWeek = () => {
    const d = new Date(currentWeekStart + "T00:00:00");
    d.setDate(d.getDate() - 7);
    setCurrentWeekStart(getMondayOfDate(d));
  };

  const handleNextWeek = () => {
    const d = new Date(currentWeekStart + "T00:00:00");
    d.setDate(d.getDate() + 7);
    setCurrentWeekStart(getMondayOfDate(d));
  };

  const handleCurrentWeek = () => {
    setCurrentWeekStart(getMondayOfDate(new Date()));
  };

  // Estados de Busca e Filtros
  const [mealSearchQuery, setMealSearchQuery] = useState("");
  const [mealCategoryFilter, setMealCategoryFilter] = useState("ALL");

  // Refeições do dia selecionado
  const dayMeals = useMemo(() => {
    if (!diet || !diet.meals) return [];
    return diet.meals.filter((m) => m.weekDay === selectedDay);
  }, [diet, selectedDay]);

  // Refeições filtradas por busca e categoria
  const filteredDayMeals = useMemo(() => {
    return dayMeals.filter((m) => {
      // Filtro de categoria de refeição
      if (mealCategoryFilter !== "ALL") {
        const icon = getMealIcon(m.mealName);
        if (mealCategoryFilter === "CAFE" && icon !== "☕") return false;
        if (mealCategoryFilter === "ALMOCO" && icon !== "🍲") return false;
        if (mealCategoryFilter === "LANCHE" && icon !== "🍎") return false;
        if (mealCategoryFilter === "JANTAR" && icon !== "🥗") return false;
        if (
          mealCategoryFilter === "OUTROS" &&
          (icon === "☕" || icon === "🍲" || icon === "🍎" || icon === "🥗")
        )
          return false;
      }

      // Filtro de texto de busca
      if (!mealSearchQuery.trim()) return true;
      const q = mealSearchQuery.toLowerCase();
      const matchName = m.mealName.toLowerCase().includes(q);
      const matchNotes = (m.notes || "").toLowerCase().includes(q);
      const matchRecipe = m.recipes.some((r) =>
        r.recipeName.toLowerCase().includes(q)
      );
      const matchPerson = m.people.some((p) =>
        p.userName.toLowerCase().includes(q)
      );
      return matchName || matchNotes || matchRecipe || matchPerson;
    });
  }, [dayMeals, mealCategoryFilter, mealSearchQuery]);

  // Calorias totais do dia selecionado
  const dayTotalCalories = useMemo(() => {
    return dayMeals.reduce((sum, m) => sum + (m.totalEstimatedCalories || 0), 0);
  }, [dayMeals]);

  // Calorias por dia da semana para exibir nas abas
  const caloriesByDay = useMemo(() => {
    const res: Record<string, number> = {};
    if (!diet || !diet.meals) return res;
    for (const m of diet.meals) {
      res[m.weekDay] = (res[m.weekDay] || 0) + (m.totalEstimatedCalories || 0);
    }
    return res;
  }, [diet]);

  // Abrir Modal de Nova Refeição
  const handleOpenNewMeal = (preset?: { name: string; time: string }) => {
    setEditingMealId(null);
    setFormWeekDay(selectedDay);
    setFormMealName(preset ? preset.name : "Almoço");
    setFormMealTime(preset ? preset.time : "12:30");
    setFormRecipeId("");
    setFormServings(1);
    setFormPersonUserIds(
      isPersonal ? [] : (activeFamily?.members.map((m) => m.userId) || [])
    );
    setFormNotes("");
    setConflictResolution("REPLACE");
    setMealModalOpen(true);
  };

  // Abrir Modal de Editar Refeição
  const handleOpenEditMeal = (meal: DietMealResponse) => {
    setEditingMealId(meal.id);
    setFormWeekDay(meal.weekDay);
    setFormMealName(meal.mealName);
    setFormMealTime(meal.mealTime || "12:00");
    setFormRecipeId(meal.recipes.length > 0 ? meal.recipes[0].recipeId : "");
    setFormServings(meal.recipes.length > 0 ? meal.recipes[0].servings : 1);
    setFormPersonUserIds(meal.people.map((p) => p.userId));
    setFormNotes(meal.notes || "");
    setMealModalOpen(true);
  };

  // Salvar Refeição
  const handleSaveMeal = async (e: FormEvent) => {
    e.preventDefault();
    if (!diet) return;

    try {
      setSavingMeal(true);
      const session = await getValidSession();
      if (!session) return;

      const payload = {
        weekDay: formWeekDay,
        mealName: formMealName.trim(),
        mealTime: formMealTime,
        notes: formNotes.trim(),
        recipeId: formRecipeId ? formRecipeId : undefined,
        servings: formServings,
        personUserIds: formPersonUserIds,
      };

      if (editingMealId) {
        await updateDietMeal(session.accessToken, editingMealId, payload);
        toast.success("Refeição atualizada com sucesso!");
      } else if (conflictingMeal && conflictResolution === "REPLACE") {
        await updateDietMeal(session.accessToken, conflictingMeal.id, payload);
        toast.success(`Refeição anterior substituída por "${payload.mealName}"! 🔄`);
      } else {
        await addDietMeal(session.accessToken, diet.id, payload);
        toast.success("Refeição adicionada ao cardápio!");
      }

      setMealModalOpen(false);
      await loadData();
    } catch {
      toast.error("Erro ao salvar refeição.");
    } finally {
      setSavingMeal(false);
    }
  };

  // Confirmar Exclusão de Refeição
  const confirmDeleteMeal = async () => {
    if (!mealToDelete) return;
    try {
      setDeletingMeal(true);
      const session = await getValidSession();
      if (!session) return;

      await deleteDietMeal(session.accessToken, mealToDelete.id);
      toast.success("Refeição removida do cardápio!");
      setMealToDelete(null);
      await loadData();
    } catch {
      toast.error("Não foi possível excluir a refeição.");
    } finally {
      setDeletingMeal(false);
    }
  };

  // Copiar Cardápio para a próxima semana
  const handleCopyDiet = async (e: FormEvent) => {
    e.preventDefault();
    if (!diet || !targetWeekInput) return;

    try {
      setCopying(true);
      const session = await getValidSession();
      if (!session) return;

      const monday = getMondayOfDate(new Date(targetWeekInput + "T00:00:00"));
      await copyWeeklyDiet(session.accessToken, diet.id, monday);
      toast.success("Cardápio semanal copiado com sucesso!");
      setCopyModalOpen(false);
      setCurrentWeekStart(monday);
    } catch {
      toast.error("Erro ao copiar cardápio para a semana selecionada.");
    } finally {
      setCopying(false);
    }
  };

  return (
    <AppShell>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Cabeçalho do Cardápio Semanal */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200/80 dark:border-stone-800 pb-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-950/60 px-3 py-1 text-xs font-bold text-amber-900 dark:text-amber-200">
                {isPersonal ? "👤 Espaço Pessoal" : `🏠 ${activeFamily?.name || "Família"}`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-3xl">🍲</span>
              <h1 className="font-display text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
                {isPersonal ? "Meu Cardápio Pessoal" : `Cardápio: ${activeFamily?.name || "Família"}`}
              </h1>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-xl">
              {isPersonal
                ? "Planeje suas refeições individuais, acompanhe calorias e organize suas receitas favoritas."
                : "Planeje as refeições da sua família, vincule suas receitas favoritas com cálculo de calorias e divida quem vai comer em cada dia."}
            </p>
          </div>

          {/* Navegador de Semanas */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handlePrevWeek}
              className="rounded-xl border border-stone-300 dark:border-stone-700 bg-white/95 dark:bg-[#25201c] px-3 py-1.5 text-xs font-bold text-stone-700 dark:text-stone-200 shadow-sm hover:bg-stone-50 dark:hover:bg-stone-800 transition-all cursor-pointer"
            >
              ◀ Anterior
            </button>
            <button
              type="button"
              onClick={handleCurrentWeek}
              className="rounded-xl border border-amber-600 bg-amber-500/10 dark:bg-amber-500/20 px-3 py-1.5 text-xs font-extrabold text-amber-900 dark:text-amber-300 shadow-sm hover:bg-amber-500/20 transition-all cursor-pointer"
            >
              Esta Semana
            </button>
            <button
              type="button"
              onClick={handleNextWeek}
              className="rounded-xl border border-stone-300 dark:border-stone-700 bg-white/95 dark:bg-[#25201c] px-3 py-1.5 text-xs font-bold text-stone-700 dark:text-stone-200 shadow-sm hover:bg-stone-50 dark:hover:bg-stone-800 transition-all cursor-pointer"
            >
              Próxima ▶
            </button>
            <button
              type="button"
              onClick={() => {
                const nextWeek = new Date(currentWeekStart + "T00:00:00");
                nextWeek.setDate(nextWeek.getDate() + 7);
                setTargetWeekInput(getMondayOfDate(nextWeek));
                setCopyModalOpen(true);
              }}
              className="rounded-xl border border-stone-300 dark:border-stone-700 bg-white/95 dark:bg-[#25201c] px-3 py-1.5 text-xs font-bold text-stone-700 dark:text-stone-200 shadow-sm hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-800 dark:hover:text-amber-300 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>📋</span> Copiar Semana
            </button>
          </div>
        </div>

        {/* Informação da Semana Ativa */}
        {diet && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/80 dark:bg-[#25201c]/80 p-4 border border-stone-200/80 dark:border-stone-800 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-xl">📅</span>
              <div>
                <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">{diet.title}</h2>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  {new Date(diet.weekStart + "T00:00:00").toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                  })}{" "}
                  até{" "}
                  {new Date(diet.weekEnd + "T00:00:00").toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-bold">
              <div className="text-right">
                <span className="text-stone-400 block text-[10px] uppercase">Refeições na Semana</span>
                <span className="text-stone-800 dark:text-stone-200">{diet.meals.length} planejadas</span>
              </div>
              <div className="h-6 w-px bg-stone-300 dark:bg-stone-700" />
              <div className="text-right">
                <span className="text-stone-400 block text-[10px] uppercase">Calorias Estimadas</span>
                <span className="text-amber-700 dark:text-amber-400 font-extrabold">
                  {diet.meals.reduce((sum, m) => sum + (m.totalEstimatedCalories || 0), 0)} kcal
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Abas dos Dias da Semana */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-8">
          {DAYS.map((day) => {
            const isSelected = selectedDay === day.id;
            const cals = caloriesByDay[day.id] || 0;
            return (
              <button
                key={day.id}
                type="button"
                onClick={() => setSelectedDay(day.id)}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                  isSelected
                    ? "border-amber-600 dark:border-amber-500 bg-amber-500/15 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 shadow-md ring-1 ring-amber-500/30 -translate-y-0.5"
                    : "border-stone-200/90 dark:border-stone-800 bg-white/80 dark:bg-[#25201c] text-stone-700 dark:text-stone-300 hover:border-stone-300 dark:hover:border-stone-700 hover:bg-white dark:hover:bg-[#2b2520]"
                }`}
              >
                <span className="text-xs font-extrabold tracking-wide uppercase">{day.short}</span>
                <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400">{day.namePt.split("-")[0]}</span>
                <span
                  className={`mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    cals > 0
                      ? "bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-900"
                      : "text-stone-400 dark:text-stone-500"
                  }`}
                >
                  {cals > 0 ? `${cals} kcal` : "0 kcal"}
                </span>
              </button>
            );
          })}
        </div>

        {/* Painel do Dia Selecionado */}
        <PaperCard className="p-6 sm:p-8" tape="green">
          {/* Cabeçalho do Dia */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 dark:border-stone-800 pb-5 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🍽️</span>
                <h3 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
                  {DAYS.find((d) => d.id === selectedDay)?.namePt}
                </h3>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Total do dia: <strong className="text-amber-800 dark:text-amber-400">{dayTotalCalories} kcal</strong> •{" "}
                {dayMeals.length} refeições programadas
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setFoodVisionOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <span>📷</span>
                <span>Escanear com IA</span>
              </button>

              <ActionButton
                type="button"
                onClick={() => handleOpenNewMeal()}
                className="self-start sm:self-auto shadow-md"
              >
                + Adicionar Refeição
              </ActionButton>
            </div>
          </div>

          {/* Atalhos Rápidos para Refeições Clássicas */}
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider mr-1">
              Atalhos rápidos:
            </span>
            {MEAL_PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => handleOpenNewMeal(p)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white/90 dark:bg-[#25201c] px-3 py-1 text-xs font-bold text-stone-700 dark:text-stone-200 shadow-2xs hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:border-amber-300 dark:hover:border-amber-800 hover:text-amber-900 dark:hover:text-amber-300 transition-all cursor-pointer"
              >
                <span>{p.icon}</span>
                <span>{p.name}</span>
              </button>
            ))}
          </div>

          {/* Barra de Pesquisa e Filtros de Refeição */}
          <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white/80 dark:bg-stone-900/60 p-3 rounded-2xl border border-stone-200/90 dark:border-stone-800 shadow-2xs backdrop-blur-xs">
            {/* Campo de Pesquisa */}
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm">
                🔍
              </span>
              <input
                type="text"
                placeholder="Pesquisar refeição, receita, notas ou pessoa..."
                value={mealSearchQuery}
                onChange={(e) => setMealSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs font-medium rounded-xl border border-stone-200 dark:border-stone-700 bg-white/95 dark:bg-stone-800 text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 transition-all"
              />
              {mealSearchQuery && (
                <button
                  type="button"
                  onClick={() => setMealSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-0.5 cursor-pointer"
                  title="Limpar pesquisa"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filtro de Tipo de Refeição */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {[
                { id: "ALL", label: "Todas", icon: "✨" },
                { id: "CAFE", label: "Café", icon: "☕" },
                { id: "ALMOCO", label: "Almoço", icon: "🍲" },
                { id: "LANCHE", label: "Lanches", icon: "🍎" },
                { id: "JANTAR", label: "Jantar", icon: "🥗" },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setMealCategoryFilter(f.id)}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    mealCategoryFilter === f.id
                      ? "bg-amber-600 text-white shadow-xs scale-102"
                      : "bg-white/80 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700"
                  }`}
                >
                  <span>{f.icon}</span>
                  <span>{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Lista de Refeições do Dia */}
          {loading ? (
            <p className="text-xs text-stone-500 py-8 text-center">Carregando cardápio...</p>
          ) : dayMeals.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-stone-300 dark:border-stone-700 bg-white/50 dark:bg-stone-900/40 p-10 text-center">
              <span className="text-4xl block mb-2">🍽️</span>
              <h4 className="font-display text-lg font-bold text-stone-800 dark:text-stone-200">
                Nenhuma refeição planejada para {DAYS.find((d) => d.id === selectedDay)?.namePt}
              </h4>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-sm mx-auto">
                Adicione o almoço, jantar ou lanches deste dia para organizar o cardápio e saber as calorias.
              </p>
              <div className="mt-5">
                <ActionButton type="button" onClick={() => handleOpenNewMeal()}>
                  + Criar Primeira Refeição
                </ActionButton>
              </div>
            </div>
          ) : filteredDayMeals.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-stone-300 dark:border-stone-700 bg-white/40 dark:bg-stone-900/30 p-8 text-center">
              <span className="text-3xl block mb-2">🔍</span>
              <h4 className="text-sm font-bold text-stone-700 dark:text-stone-300">
                Nenhuma refeição encontrada para esta busca ou filtro
              </h4>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Tente buscar outro termo ou limpe os filtros para ver todas as refeições do dia.
              </p>
              <button
                type="button"
                onClick={() => {
                  setMealSearchQuery("");
                  setMealCategoryFilter("ALL");
                }}
                className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
              >
                Limpar filtros de busca
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDayMeals.map((meal) => {
                const icon = getMealIcon(meal.mealName);
                const hasRecipe = meal.recipes.length > 0;
                const recipeItem = hasRecipe ? meal.recipes[0] : null;

                return (
                  <div
                    key={meal.id}
                    className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border-2 border-stone-300/80 dark:border-stone-700 bg-white/95 dark:bg-[#25201c] p-5 shadow-xs transition-all duration-300 hover:shadow-md hover:border-amber-500/70 hover:-translate-y-0.5 animate-in fade-in slide-in-from-bottom-2"
                  >
                    {/* Selinho washi tape sutil decorativo */}
                    <span
                      aria-hidden="true"
                      className="absolute -top-1.5 left-8 h-2.5 w-14 -rotate-1 rounded-xs bg-amber-400/40 dark:bg-amber-600/30 shadow-2xs pointer-events-none group-hover:rotate-0 transition-transform"
                    />

                    <div className="flex items-start gap-4 min-w-0">
                      {/* Ícone da Refeição */}
                      <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200/70 dark:from-amber-950/70 dark:to-stone-800 text-3xl border border-amber-300/60 dark:border-amber-800/60 shadow-2xs group-hover:scale-105 group-hover:rotate-1 transition-transform">
                        {icon}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold tracking-wide uppercase px-2.5 py-0.5 rounded-lg bg-amber-100/80 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 border border-amber-300/60 dark:border-amber-800/50">
                            🕒 {meal.mealTime || "Horário livre"}
                          </span>
                          <h4 className="text-base font-extrabold text-stone-900 dark:text-stone-100 group-hover:text-amber-900 dark:group-hover:text-amber-300 transition-colors">
                            {meal.mealName}
                          </h4>
                        </div>

                        {/* Receita Vinculada */}
                        {recipeItem ? (
                          <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                            <Link
                              href={`/receitas/${recipeItem.recipeId}`}
                              className="inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-800 dark:text-amber-300 hover:text-amber-950 dark:hover:text-amber-100 underline decoration-amber-400 decoration-dotted underline-offset-4 bg-amber-500/10 dark:bg-amber-950/40 px-2.5 py-1 rounded-xl border border-amber-500/20 dark:border-amber-800/40"
                            >
                              <span>📖</span> {recipeItem.recipeName}
                            </Link>
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800">
                              <span>🔥</span> {recipeItem.totalCalories} kcal
                              <span className="text-emerald-600/70 dark:text-emerald-400/70 font-medium">
                                ({recipeItem.servings}{" "}
                                {recipeItem.servings === 1 ? "porção" : "porções"})
                              </span>
                            </span>
                          </div>
                        ) : null}

                        {/* Observações */}
                        {meal.notes && (
                          <p className="mt-2 text-xs text-stone-600 dark:text-stone-300 italic bg-stone-50 dark:bg-[#1c1815] px-3 py-1.5 rounded-xl border border-stone-200/60 dark:border-stone-800">
                            &ldquo;{meal.notes}&rdquo;
                          </p>
                        )}

                        {/* Pessoas Associadas (apenas se não estiver no modo pessoal) */}
                        {!isPersonal && meal.people && meal.people.length > 0 && (
                          <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-extrabold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
                              Para:
                            </span>
                            {meal.people.map((p) => (
                              <span
                                key={p.userId}
                                className="inline-flex items-center gap-1 rounded-full bg-stone-100 dark:bg-stone-800 px-2.5 py-0.5 text-xs font-bold text-stone-700 dark:text-stone-200 border border-stone-300/80 dark:border-stone-700"
                              >
                                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-200 dark:bg-amber-800 text-[10px] text-amber-950 dark:text-amber-100 font-extrabold">
                                  {p.userName.charAt(0).toUpperCase()}
                                </span>
                                <span>{p.userName}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEditMeal(meal)}
                        className="inline-flex items-center gap-1 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-1.5 text-xs font-bold text-stone-700 dark:text-stone-200 shadow-2xs hover:bg-amber-50 hover:border-amber-300 dark:hover:bg-amber-950/30 hover:text-amber-900 dark:hover:text-amber-200 transition-all cursor-pointer"
                      >
                        <span>✏️</span> Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => setMealToDelete(meal)}
                        className="inline-flex items-center gap-1 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/80 dark:bg-red-950/40 px-3 py-1.5 text-xs font-bold text-red-600 dark:text-red-400 shadow-2xs hover:bg-red-100 dark:hover:bg-red-900/60 transition-all cursor-pointer"
                      >
                        <span>🗑️</span> Excluir
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </PaperCard>

        {/* MODAL: Adicionar / Editar Refeição */}
        <Modal
          isOpen={mealModalOpen}
          onClose={() => setMealModalOpen(false)}
          title={editingMealId ? "Editar Refeição" : "Adicionar Refeição"}
          subtitle="Planeje o prato, vincule uma receita e defina quem vai comer."
          maxWidth="md"
        >
          <form onSubmit={handleSaveMeal} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 block mb-1">
                  Dia da Semana
                </label>
                <select
                  value={formWeekDay}
                  onChange={(e) => setFormWeekDay(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white/95 dark:bg-[#28221d] px-3 py-2 text-sm font-semibold text-stone-900 dark:text-stone-100 shadow-sm focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  {DAYS.map((d) => (
                    <option key={d.id} value={d.id} className="dark:bg-[#28221d] dark:text-stone-100">
                      {d.namePt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 block mb-1">
                  Horário
                </label>
                <input
                  type="time"
                  value={formMealTime}
                  onChange={(e) => setFormMealTime(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white/95 dark:bg-[#28221d] px-3 py-2 text-sm font-semibold text-stone-900 dark:text-stone-100 shadow-sm focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 block mb-1">
                Nome da Refeição
              </label>
              <input
                type="text"
                value={formMealName}
                onChange={(e) => setFormMealName(e.target.value)}
                placeholder="Ex: Almoço, Jantar com Geovana, Lanche da Tarde..."
                required
                className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white/95 dark:bg-[#28221d] px-3.5 py-2.5 text-sm font-semibold text-stone-900 dark:text-stone-100 shadow-sm placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            {/* Aviso e Resolução de Conflitos de Refeição */}
            {conflictingMeal && !editingMealId && (
              <div className="rounded-2xl border-2 border-amber-400/90 dark:border-amber-600/70 bg-amber-50/95 dark:bg-amber-950/40 p-4 shadow-xs">
                <div className="flex items-start gap-3">
                  <span className="text-xl shrink-0">⚠️</span>
                  <div className="flex-1 text-xs">
                    <h5 className="font-bold text-amber-950 dark:text-amber-200">
                      Conflito no Cardápio: Já existe um {detectMealCategory(conflictingMeal.mealName, conflictingMeal.mealTime)} em {DAYS.find((d) => d.id === formWeekDay)?.namePt || formWeekDay}!
                    </h5>
                    <p className="mt-1 text-amber-900 dark:text-amber-300">
                      Refeição cadastrada: <strong>&ldquo;{conflictingMeal.mealName}&rdquo;</strong> {conflictingMeal.mealTime ? `às ${conflictingMeal.mealTime}` : ""}.
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
            )}

            {/* Vínculo com Receita Cadastrada */}
            <div className="rounded-2xl border border-amber-200/80 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 p-4">
              <label className="text-xs font-bold uppercase tracking-wider text-amber-950 dark:text-amber-200 block mb-1">
                Vincular Receita do Livro de Receitas (Opcional)
              </label>
              <select
                value={formRecipeId}
                onChange={(e) => setFormRecipeId(e.target.value)}
                className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#28221d] px-3 py-2 text-sm font-semibold text-stone-900 dark:text-stone-100 shadow-sm focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="" className="dark:bg-[#28221d] dark:text-stone-100">
                  Sem receita vinculada (refeição livre)
                </option>
                {recipes.map((r) => (
                  <option key={r.id} value={r.id} className="dark:bg-[#28221d] dark:text-stone-100">
                    {r.name} {r.estimatedCalories ? `(${r.estimatedCalories} kcal/porção)` : ""}
                  </option>
                ))}
              </select>

              {formRecipeId && (
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div>
                    <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
                      Número de Porções:
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="20"
                      value={formServings}
                      onChange={(e) => setFormServings(parseFloat(e.target.value) || 1)}
                      className="w-24 mt-1 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#28221d] px-3 py-1.5 text-sm font-bold text-stone-900 dark:text-stone-100 shadow-sm focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>

                  {(() => {
                    const sel = recipes.find((r) => r.id === formRecipeId);
                    if (!sel || !sel.estimatedCalories) return null;
                    const totalCals = Math.round(Number(sel.estimatedCalories) * formServings);
                    return (
                      <div className="text-right">
                        <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 block uppercase">
                          Calorias Totais
                        </span>
                        <span className="text-lg font-extrabold text-amber-900 dark:text-amber-300">
                          {totalCals} kcal
                        </span>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Quem vai comer essa refeição? */}
            {!isPersonal && activeFamily && activeFamily.members && activeFamily.members.length > 0 && (
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 block mb-1.5">
                  Quem vai comer essa refeição?
                </label>
                <div className="flex flex-wrap gap-2">
                  {activeFamily.members.map((member) => {
                    const isSelected = formPersonUserIds.includes(member.userId);
                    return (
                      <button
                        key={member.userId}
                        type="button"
                        onClick={() => {
                          setFormPersonUserIds((prev) =>
                            isSelected
                              ? prev.filter((id) => id !== member.userId)
                              : [...prev, member.userId]
                          );
                        }}
                        className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? "border-amber-600 bg-amber-500/15 text-amber-900 dark:text-amber-300 shadow-sm ring-1 ring-amber-500/30"
                            : "border-stone-300 dark:border-stone-700 bg-white/90 dark:bg-[#28221d] text-stone-600 dark:text-stone-300 hover:border-stone-400"
                        }`}
                      >
                        <span>{isSelected ? "✅" : "👤"}</span>
                        <span>{member.userName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 block mb-1">
                Observações / Detalhes do Preparo
              </label>
              <textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                rows={2}
                placeholder="Ex: Deixar o frango marinando de manhã, sem pimenta..."
                className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white/95 dark:bg-[#28221d] p-3 text-xs font-medium text-stone-900 dark:text-stone-100 shadow-sm placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-200/60 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setMealModalOpen(false)}
                className="rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-4 py-2 text-xs font-bold text-stone-700 dark:text-stone-200 shadow-2xs hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <ActionButton type="submit" disabled={savingMeal}>
                {savingMeal ? "Salvando..." : "Salvar Refeição"}
              </ActionButton>
            </div>
          </form>
        </Modal>

        {/* MODAL: Excluir Refeição com Confirmação */}
        <ConfirmDialog
          isOpen={!!mealToDelete}
          onClose={() => setMealToDelete(null)}
          onConfirm={confirmDeleteMeal}
          title={`Excluir refeição "${mealToDelete?.mealName}"?`}
          description={
            <span>
              Tem certeza que deseja remover esta refeição do cardápio semanal?
              Esta ação não pode ser desfeita.
            </span>
          }
          confirmLabel="Excluir Refeição"
          loading={deletingMeal}
          variant="danger"
        />

        {/* MODAL: Copiar Cardápio para Outra Semana */}
        <Modal
          isOpen={copyModalOpen}
          onClose={() => setCopyModalOpen(false)}
          title="Copiar Cardápio Semanal"
          subtitle="Replique todo o planejamento desta semana para outra semana com um clique."
          maxWidth="sm"
        >
          <form onSubmit={handleCopyDiet} className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 block mb-1">
                Data de Início da Semana Destino
              </label>
              <input
                type="date"
                value={targetWeekInput}
                onChange={(e) => setTargetWeekInput(e.target.value)}
                required
                className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white/95 dark:bg-[#28221d] px-3 py-2 text-sm font-semibold text-stone-900 dark:text-stone-100 shadow-sm focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
              <p className="mt-1 text-[11px] text-stone-500 dark:text-stone-400">
                Selecione qualquer dia da semana desejada (será ajustado para a segunda-feira).
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-200/60 dark:border-stone-800">
              <ActionButton
                type="button"
                variant="outline"
                onClick={() => setCopyModalOpen(false)}
              >
                Cancelar
              </ActionButton>
              <ActionButton type="submit" disabled={copying}>
                {copying ? "Copiando..." : "Copiar Cardápio"}
              </ActionButton>
            </div>
          </form>
        </Modal>

        {/* Modal de Escanear Prato com IA (Food Vision) */}
        {foodVisionOpen && sessionToken && (
          <FoodVisionScannerModal
            isOpen={foodVisionOpen}
            onClose={() => setFoodVisionOpen(false)}
            accessToken={sessionToken}
            onMealSaved={loadData}
          />
        )}
      </main>
    </AppShell>
  );
}
