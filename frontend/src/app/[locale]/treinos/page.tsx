"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { NotebookPageHeader } from "@/components/ui/Notebook";
import { PaperCard } from "@/components/ui/PaperCard";
import { ActionButton } from "@/components/ui/ActionButton";
import { Modal } from "@/components/ui/Modal";
import { TextInput, SelectField } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/Toast";
import { InfoHint } from "@/components/ui/Tooltip";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { useRouter } from "@/i18n/navigation";
import { getValidSession } from "@/services/auth";
import {
  listWorkouts,
  createWorkout,
  updateWorkout,
  deleteWorkout,
  getTodayWorkoutRoutine,
  completeRoutineWorkout,
  listWorkoutLogs,
  logWorkout,
} from "@/services/workouts";
import { estimateWorkoutCalories } from "@/services/ai";
import type {
  WorkoutResponse,
  WorkoutRequest,
  TodayWorkoutRoutineResponse,
  WorkoutLogResponse,
  WorkoutExercise,
} from "@/types/api";
import {
  Dumbbell,
  Footprints,
  Dog,
  Zap,
  Bike,
  HeartHandshake,
  Flame,
  Check,
  Plus,
  Search,
  Heart,
  CalendarDays,
  Clock,
  Sparkles,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  UtensilsCrossed,
  Timer,
  Activity,
  CheckCircle2,
  ListPlus,
  X,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";

interface CategoryMeta {
  id: string;
  label: string;
  icon: LucideIcon;
  defaultCalories: number;
}

const CATEGORIES: CategoryMeta[] = [
  { id: "MUSCULACAO", label: "Musculação", icon: Dumbbell, defaultCalories: 450 },
  { id: "CORRIDA", label: "Corrida / Esteira", icon: Footprints, defaultCalories: 650 },
  { id: "CAMINHADA", label: "Caminhada", icon: Dog, defaultCalories: 280 },
  { id: "FUNCIONAL", label: "Funcional / HIIT", icon: Zap, defaultCalories: 500 },
  { id: "CICLISMO", label: "Ciclismo / Bike", icon: Bike, defaultCalories: 480 },
  { id: "YOGA", label: "Yoga / Alongamento", icon: HeartHandshake, defaultCalories: 200 },
  { id: "OUTRO", label: "Outro Esporte", icon: Activity, defaultCalories: 400 },
];

const DAYS_OF_WEEK = [
  { key: "SEG", label: "Seg", full: "Segunda-feira" },
  { key: "TER", label: "Ter", full: "Terça-feira" },
  { key: "QUA", label: "Qua", full: "Quarta-feira" },
  { key: "QUI", label: "Qui", full: "Quinta-feira" },
  { key: "SEX", label: "Sex", full: "Sexta-feira" },
  { key: "SAB", label: "Sáb", full: "Sábado" },
  { key: "DOM", label: "Dom", full: "Domingo" },
];

const INTENSITIES = [
  { id: "LEVE", label: "Leve", factor: 0.85, color: "bg-emerald-500", desc: "Ritmo tranquilo e sem cansaço extremo" },
  { id: "MODERADO", label: "Moderado", factor: 1.0, color: "bg-amber-500", desc: "Ritmo constante e padrão" },
  { id: "INTENSO", label: "Intenso", factor: 1.25, color: "bg-orange-500", desc: "Ritmo acelerado com suor e fôlego alto" },
  { id: "MUITO_INTENSO", label: "Muito Intenso", factor: 1.45, color: "bg-rose-500", desc: "Esforço máximo e intervalos curtos" },
];

export default function WorkoutsPage() {
  const router = useRouter();
  const toast = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [workouts, setWorkouts] = useState<WorkoutResponse[]>([]);
  const [routine, setRoutine] = useState<TodayWorkoutRoutineResponse | null>(null);
  const [recentLogs, setRecentLogs] = useState<WorkoutLogResponse[]>([]);

  // Filtros
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  // Modal de Criação / Edição
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<WorkoutResponse | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("MUSCULACAO");
  const [intensity, setIntensity] = useState("MODERADO");
  const [defaultDuration, setDefaultDuration] = useState("60");
  const [caloriesPerHour, setCaloriesPerHour] = useState("450");
  const [notes, setNotes] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [saving, setSaving] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [expandedExercises, setExpandedExercises] = useState<Record<string, boolean>>({});

  // Carregar dados
  const loadData = useCallback(async () => {
    try {
      const session = await getValidSession();
      if (!session) {
        router.replace("/login");
        return;
      }
      setToken(session.accessToken);

      const [workoutsData, routineData, logsData] = await Promise.all([
        listWorkouts(session.accessToken).catch(() => []),
        getTodayWorkoutRoutine(session.accessToken).catch(() => null),
        listWorkoutLogs(session.accessToken).catch(() => []),
      ]);

      setWorkouts(workoutsData);
      setRoutine(routineData);
      setRecentLogs(logsData.slice(0, 5));
    } catch {
      toast.showToast("Não foi possível carregar os treinos.", "error");
    } finally {
      setLoading(false);
    }
  }, [toast, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Abrir Modal de Criação
  const handleOpenCreate = () => {
    setEditingWorkout(null);
    setTitle("");
    setCategory("MUSCULACAO");
    setIntensity("MODERADO");
    setDefaultDuration("60");
    setCaloriesPerHour("450");
    setNotes("");
    setSelectedDays([]);
    setExercises([]);
    setModalOpen(true);
  };

  // Abrir Modal de Edição
  const handleOpenEdit = (w: WorkoutResponse) => {
    setEditingWorkout(w);
    setTitle(w.title);
    setCategory(w.category);
    setIntensity(w.intensity || "MODERADO");
    setDefaultDuration(String(w.defaultDurationMinutes));
    setCaloriesPerHour(String(w.caloriesPerHour));
    setNotes(w.notes || "");
    setSelectedDays(w.daysOfWeek ? w.daysOfWeek.split(",").map((s) => s.trim()) : []);

    let parsedEx: WorkoutExercise[] = [];
    if (w.exercisesJson) {
      try {
        parsedEx = JSON.parse(w.exercisesJson);
      } catch {}
    }
    setExercises(parsedEx);
    setModalOpen(true);
  };

  // Alternar Dia da Semana
  const toggleDay = (key: string) => {
    setSelectedDays((prev) =>
      prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]
    );
  };

  // Adicionar exercício dinâmico
  const addExercise = () => {
    setExercises((prev) => [...prev, { name: "", sets: "4x10", weight: "", notes: "" }]);
  };

  // Atualizar exercício da lista
  const updateExercise = (index: number, field: keyof WorkoutExercise, value: string) => {
    setExercises((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Remover exercício da lista
  const removeExercise = (index: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  };

  // Salvar Treino (Create ou Update)
  const handleSaveWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!title.trim()) {
      toast.showToast("Informe o título do treino.", "error");
      return;
    }

    setSaving(true);
    try {
      const validExercises = exercises.filter((ex) => ex.name.trim() !== "");
      const exercisesJson = validExercises.length > 0 ? JSON.stringify(validExercises) : undefined;
      const daysStr = selectedDays.join(",");

      const payload: WorkoutRequest = {
        title: title.trim(),
        category,
        intensity,
        caloriesPerHour: parseInt(caloriesPerHour, 10) || 400,
        defaultDurationMinutes: parseInt(defaultDuration, 10) || 60,
        notes: notes.trim() || undefined,
        daysOfWeek: daysStr || undefined,
        exercisesJson,
        favorite: editingWorkout ? editingWorkout.favorite : false,
      };

      if (editingWorkout) {
        await updateWorkout(token, editingWorkout.id, payload);
        toast.showToast("Ficha de treino atualizada com sucesso!", "success");
      } else {
        await createWorkout(token, payload);
        toast.showToast("Novo treino adicionado ao seu caderno!", "success");
      }

      setModalOpen(false);
      loadData();
    } catch {
      toast.showToast("Erro ao salvar o treino.", "error");
    } finally {
      setSaving(false);
    }
  };

  // Excluir Treino
  const handleDeleteWorkout = async (id: string, name: string) => {
    if (!token) return;
    if (!confirm(`Deseja realmente remover o treino "${name}" do seu caderno?`)) return;

    try {
      await deleteWorkout(token, id);
      toast.showToast("Treino removido.", "info");
      loadData();
    } catch {
      toast.showToast("Falha ao remover o treino.", "error");
    }
  };

  // Alternar Favorito
  const handleToggleFavorite = async (w: WorkoutResponse) => {
    if (!token) return;
    try {
      await updateWorkout(token, w.id, {
        title: w.title,
        category: w.category,
        caloriesPerHour: w.caloriesPerHour,
        defaultDurationMinutes: w.defaultDurationMinutes,
        notes: w.notes || undefined,
        daysOfWeek: w.daysOfWeek || undefined,
        exercisesJson: w.exercisesJson || undefined,
        favorite: !w.favorite,
        intensity: w.intensity,
      });
      loadData();
    } catch {
      toast.showToast("Não foi possível atualizar o favorito.", "error");
    }
  };

  // Concluir Treino em 1 Clique (Hoje ou na grade)
  const handleCompleteWorkout = async (workoutId: string, workoutName: string) => {
    if (!token) return;
    setCompletingId(workoutId);
    try {
      await completeRoutineWorkout(token, workoutId);
      toast.showToast(`Parabéns! Treino "${workoutName}" marcado como concluído! 🎉`, "success");
      loadData();
    } catch {
      toast.showToast("Não foi possível concluir o treino.", "error");
    } finally {
      setCompletingId(null);
    }
  };

  // Treinos filtrados
  const filteredWorkouts = useMemo(() => {
    return workouts.filter((w) => {
      if (onlyFavorites && !w.favorite) return false;
      if (categoryFilter !== "ALL" && w.category !== categoryFilter) return false;
      if (search.trim()) {
        const term = search.toLowerCase();
        const matchTitle = w.title.toLowerCase().includes(term);
        const matchNotes = (w.notes || "").toLowerCase().includes(term);
        const matchExercises = (w.exercisesJson || "").toLowerCase().includes(term);
        if (!matchTitle && !matchNotes && !matchExercises) return false;
      }
      return true;
    });
  }, [workouts, search, categoryFilter, onlyFavorites]);

  // Organizar treinos por dia da semana para a grade semanal
  const weeklyMap = useMemo(() => {
    const map: Record<string, WorkoutResponse[]> = {
      SEG: [],
      TER: [],
      QUA: [],
      QUI: [],
      SEX: [],
      SAB: [],
      DOM: [],
    };
    workouts.forEach((w) => {
      if (w.daysOfWeek) {
        w.daysOfWeek.split(",").forEach((dayKey) => {
          const k = dayKey.trim().toUpperCase();
          if (map[k]) {
            map[k].push(w);
          }
        });
      }
    });
    return map;
  }, [workouts]);

  const getCategoryMeta = (catId: string) => {
    return CATEGORIES.find((c) => c.id === catId) || CATEGORIES[0];
  };

  return (
    <AppShell>
      <div className="space-y-6 pb-16 max-w-6xl mx-auto">
        {/* Cabeçalho da Página */}
        <NotebookPageHeader
          eyebrow="Meu caderno"
          title="Treinos & Rotinas"
          subtitle="Cadastre suas fichas, organize sua semana e acompanhe o ritmo de movimento da casa."
          action={
            <ActionButton
              type="button"
              variant="primary"
              onClick={handleOpenCreate}
              className="gap-2 shadow-sm transition-all duration-200 hover:rotate-1 hover:scale-[1.02] active:scale-[0.98] active:rotate-0"
            >
              <Plus className="w-4 h-4" />
              Nova Ficha de Treino
            </ActionButton>
          }
        />

        {/* 1. DESTAQUE DO TREINO DE HOJE (Hero Card) */}
        {routine && (
          <PaperCard tape="orange" className="overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-200/60 dark:border-stone-800">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl ${
                  routine.completedToday
                    ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300/50"
                    : "bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-300/50"
                }`}>
                  <CalendarDays className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                      Hoje é {routine.dayLabel}
                    </span>
                    {routine.completedToday ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border border-emerald-300/40">
                        <Check className="w-3.5 h-3.5" />
                        Treino Concluído
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-300/40">
                        <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                        Pendente
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black font-display text-stone-900 dark:text-stone-100 mt-0.5">
                    {routine.currentWorkout
                      ? routine.currentWorkout.title
                      : "Dia de Descanso ou Treino Livre"}
                  </h2>
                </div>
              </div>

              {/* Ação de 1 Clique: Concluir Treino */}
              <div className="flex items-center gap-3">
                {routine.currentWorkout && !routine.completedToday && (
                  <ActionButton
                    type="button"
                    variant="primary"
                    disabled={completingId === routine.currentWorkout.id}
                    onClick={() => handleCompleteWorkout(routine.currentWorkout!.id, routine.currentWorkout!.title)}
                    className="w-full md:w-auto gap-2 bg-gradient-to-r from-orange-600 to-amber-600 shadow-md transition-all duration-200 hover:rotate-1 hover:scale-[1.02] active:scale-[0.98] active:rotate-0"
                  >
                    <Check className="w-5 h-5" />
                    {completingId === routine.currentWorkout.id ? "Gravando..." : "Concluir Treino de Hoje"}
                  </ActionButton>
                )}
                {routine.completedToday && (
                  <div className="text-sm font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40">
                    <Flame className="w-4 h-4 text-orange-500" />
                    -{routine.todayCaloriesBurned} kcal queimadas hoje!
                  </div>
                )}
              </div>
            </div>

            {/* Detalhes do Treino de Hoje & Dicas Nutricionais */}
            {routine.currentWorkout && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-[#FFFDF9] dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 flex items-center gap-3">
                  <Clock className="w-5 h-5 text-stone-400" />
                  <div>
                    <span className="text-[11px] font-bold text-stone-400 uppercase">Duração Estimada</span>
                    <p className="text-sm font-black text-stone-800 dark:text-stone-200">
                      {routine.currentWorkout.defaultDurationMinutes} minutos
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FFFDF9] dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 flex items-center gap-3">
                  <Flame className="w-5 h-5 text-orange-500" />
                  <div>
                    <span className="text-[11px] font-bold text-stone-400 uppercase">Gasto Calórico Médio</span>
                    <p className="text-sm font-black text-stone-800 dark:text-stone-200">
                      ~{Math.round((routine.currentWorkout.caloriesPerHour * routine.currentWorkout.defaultDurationMinutes) / 60)} kcal
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FFFDF9] dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 flex items-center gap-3">
                  <Activity className="w-5 h-5 text-indigo-500" />
                  <div>
                    <span className="text-[11px] font-bold text-stone-400 uppercase">Intensidade</span>
                    <p className="text-sm font-black text-stone-800 dark:text-stone-200">
                      {routine.currentWorkout.intensity || "MODERADO"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Dicas Nutricionais Integradas GeLu */}
            {routine.currentWorkout && (
              <div className="mt-4 pt-3.5 border-t border-stone-200/50 dark:border-stone-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-stone-600 dark:text-stone-300">
                <div className="flex items-center gap-2">
                  <UtensilsCrossed className="w-4 h-4 text-orange-600" />
                  <span>
                    <strong>Sugestão Pré-Treino:</strong> {routine.suggestedPreWorkoutMeal}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-stone-500">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>
                    <strong>Pós-Treino:</strong> {routine.suggestedPostWorkoutMeal}
                  </span>
                </div>
              </div>
            )}
          </PaperCard>
        )}

        {/* 2. VISÃO DA ROTINA SEMANAL (Grade Seg a Dom) */}
        <PaperCard tape="orange">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200/60 dark:border-stone-800 mb-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <h3 className="font-display text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
                Minha Rotina Semanal
              </h3>
              <InfoHint text="Distribua seus treinos pelos dias da semana. O sistema organiza seu ritmo diário e prepara o atalho de 1 clique no dia agendado." />
            </div>
            <span className="text-xs text-stone-400">
              {workouts.filter((w) => !!w.daysOfWeek).length} fichas na rotina
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {DAYS_OF_WEEK.map((d) => {
              const isToday = routine?.dayOfWeek === d.key;
              const scheduledForDay = weeklyMap[d.key] || [];

              return (
                <div
                  key={d.key}
                  className={`p-3 rounded-2xl border transition-all ${
                    isToday
                      ? "border-orange-500 bg-orange-50/40 dark:bg-orange-950/30 shadow-xs ring-1 ring-orange-400/40"
                      : "border-stone-200/70 dark:border-stone-800 bg-[#FFFDF9] dark:bg-stone-900/60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-bold ${
                      isToday ? "text-orange-600 dark:text-orange-400" : "text-stone-500"
                    }`}>
                      {d.label}
                    </span>
                    {isToday && (
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black uppercase bg-orange-500 text-white">
                        Hoje
                      </span>
                    )}
                  </div>

                  {scheduledForDay.length > 0 ? (
                    <div className="space-y-1.5">
                      {scheduledForDay.map((w) => {
                        const Icon = getCategoryMeta(w.category).icon;
                        return (
                          <div
                            key={w.id}
                            className="p-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700/80 shadow-2xs hover:border-orange-300 transition-all cursor-pointer"
                            onClick={() => handleOpenEdit(w)}
                            title={`Editar "${w.title}"`}
                          >
                            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800 dark:text-stone-200 truncate">
                              <Icon className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                              <span className="truncate">{w.title}</span>
                            </div>
                            <span className="text-[10px] text-stone-400 block mt-0.5">
                              {w.defaultDurationMinutes} min
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-4 text-center text-[11px] text-stone-400 dark:text-stone-500 italic">
                      Descanso
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </PaperCard>

        {/* 3. MINHAS FICHAS DE TREINO (Catálogo com Filtros) */}
        <div>
          {/* Barra de Filtros */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar treino ou exercício..."
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {/* Botão de Favoritos */}
              <button
                type="button"
                onClick={() => setOnlyFavorites(!onlyFavorites)}
                title={onlyFavorites ? "Mostrar todas as fichas" : "Ver apenas fichas favoritas"}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer shrink-0 ${
                  onlyFavorites
                    ? "bg-rose-50 text-rose-600 border-rose-300 dark:bg-rose-950/40 dark:border-rose-900"
                    : "bg-white text-stone-600 border-stone-200 dark:bg-stone-900 dark:border-stone-800"
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${onlyFavorites ? "fill-rose-500 text-rose-500" : "text-stone-400"}`} />
                <span>{onlyFavorites ? "Apenas Favoritos" : "Favoritos"}</span>
              </button>

              {/* Seletor de Categoria */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 text-xs font-bold rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 focus:outline-hidden"
              >
                <option value="ALL">Todas Categorias</option>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Grade de Fichas de Treino */}
          {filteredWorkouts.length === 0 ? (
            <div className="p-8 rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900 text-center">
              <Dumbbell className="w-10 h-10 text-stone-300 dark:text-stone-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-stone-700 dark:text-stone-300">
                Nenhuma ficha de treino encontrada
              </p>
              <p className="text-xs text-stone-400 mt-1">
                {workouts.length === 0
                  ? "Crie sua primeira ficha para organizar suas rotinas da semana."
                  : "Tente mudar os filtros de busca acima."}
              </p>
              {workouts.length === 0 && (
                <div className="mt-4">
                  <ActionButton
                    type="button"
                    variant="primary"
                    onClick={handleOpenCreate}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Criar Primeira Ficha
                  </ActionButton>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredWorkouts.map((w) => {
                const meta = getCategoryMeta(w.category);
                const Icon = meta.icon;
                let parsedExercises: WorkoutExercise[] = [];
                if (w.exercisesJson) {
                  try {
                    parsedExercises = JSON.parse(w.exercisesJson);
                  } catch {}
                }
                const isExpanded = !!expandedExercises[w.id];
                const daysList = w.daysOfWeek ? w.daysOfWeek.split(",").map((s) => s.trim()) : [];

                return (
                  <div
                    key={w.id}
                    className="p-5 rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-2xs hover:border-orange-300/80 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Topo do Card: Categoria, Título e Favorito */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 border border-orange-200/40">
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                              {meta.label}
                            </span>
                            <h4 className="text-base font-black font-display text-stone-900 dark:text-stone-100 line-clamp-1">
                              {w.title}
                            </h4>
                          </div>
                        </div>

                        {/* Botão de Favoritar com Tooltip */}
                        <button
                          type="button"
                          onClick={() => handleToggleFavorite(w)}
                          title={w.favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                            w.favorite
                              ? "text-rose-500 hover:scale-110"
                              : "text-stone-300 hover:text-stone-500 dark:text-stone-600"
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${w.favorite ? "fill-rose-500" : ""}`} />
                        </button>
                      </div>

                      {/* Métricas Rápidas: Duração, Calorias e Intensidade */}
                      <div className="mt-3 flex items-center gap-3 text-xs text-stone-600 dark:text-stone-300">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-stone-400" />
                          {w.defaultDurationMinutes} min
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-orange-600 dark:text-orange-400">
                          <Flame className="w-3.5 h-3.5" />
                          ~{Math.round((w.caloriesPerHour * w.defaultDurationMinutes) / 60)} kcal
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 uppercase">
                          {w.intensity || "MODERADO"}
                        </span>
                      </div>

                      {/* Dias Agendados na Rotina */}
                      {daysList.length > 0 && (
                        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-bold text-stone-400 mr-1">Rotina:</span>
                          {daysList.map((day) => (
                            <span
                              key={day}
                              className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300"
                            >
                              {day}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Observações */}
                      {w.notes && (
                        <p className="mt-2 text-xs text-stone-500 dark:text-stone-400 italic line-clamp-2">
                          &ldquo;{w.notes}&rdquo;
                        </p>
                      )}

                      {/* Lista de Exercícios Recolhível */}
                      {parsedExercises.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedExercises((prev) => ({ ...prev, [w.id]: !prev[w.id] }))
                            }
                            className="flex items-center justify-between w-full text-xs font-bold text-stone-700 dark:text-stone-300 hover:text-orange-600 transition-colors cursor-pointer"
                          >
                            <span>Exercícios ({parsedExercises.length})</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {isExpanded && (
                            <div className="mt-2 space-y-1.5">
                              {parsedExercises.map((ex, idx) => (
                                <div
                                  key={idx}
                                  className="p-2 rounded-lg bg-stone-50 dark:bg-stone-850 text-xs flex items-center justify-between"
                                >
                                  <div>
                                    <strong className="text-stone-800 dark:text-stone-200">
                                      {ex.name}
                                    </strong>
                                    {ex.notes && (
                                      <span className="text-[10px] text-stone-400 block">
                                        {ex.notes}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-right text-[11px] text-stone-500">
                                    <span>{ex.sets || "4x10"}</span>
                                    {ex.weight && (
                                      <span className="text-orange-600 ml-1 font-bold">
                                        • {ex.weight}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Rodapé do Card: Ações Rápidas */}
                    <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(w)}
                          title="Editar ficha"
                          className="p-1.5 rounded-lg text-stone-400 hover:text-orange-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteWorkout(w.id, w.title)}
                          title="Excluir ficha"
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <ActionButton
                        type="button"
                        variant="secondary"
                        disabled={completingId === w.id}
                        onClick={() => handleCompleteWorkout(w.id, w.title)}
                        className="gap-1.5 text-xs transition-all duration-200 hover:rotate-1 hover:scale-[1.02] active:scale-[0.98] active:rotate-0"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        {completingId === w.id ? "Gravando..." : "Registrar Agora"}
                      </ActionButton>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. HISTÓRICO RECENTE DE TREINOS REALIZADOS */}
        {recentLogs.length > 0 && (
          <PaperCard tape="orange">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200/60 dark:border-stone-800 mb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-display text-base font-bold text-stone-900 dark:text-stone-100">
                  Histórico Recente de Treinos
                </h3>
              </div>
              <span className="text-xs text-stone-400">Últimos registros</span>
            </div>

            <div className="divide-y divide-stone-100 dark:divide-stone-800/80">
              {recentLogs.map((log) => (
                <div key={log.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/40">
                      <Check className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-stone-800 dark:text-stone-200">{log.title}</p>
                      <p className="text-[11px] text-stone-400">
                        {log.durationMinutes} min • {log.performedAt ? new Date(log.performedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-orange-600 dark:text-orange-400">
                    -{log.caloriesBurned} kcal
                  </span>
                </div>
              ))}
            </div>
          </PaperCard>
        )}

        {/* MODAL DE CRIAR / EDITAR FICHA DE TREINO */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingWorkout ? "Editar Ficha de Treino" : "Nova Ficha de Treino"}
        >
          <form onSubmit={handleSaveWorkout} className="space-y-4">
            <TextInput
              label="Nome do Treino"
              value={title}
              onValueChange={setTitle}
              placeholder="Ex: Treino A: Peito e Tríceps, Corrida no Parque..."
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SelectField
                label="Categoria"
                value={category}
                onValueChange={(val) => {
                  setCategory(val);
                  const meta = getCategoryMeta(val);
                  setCaloriesPerHour(String(meta.defaultCalories));
                }}
                options={CATEGORIES.map((c) => ({ label: c.label, value: c.id }))}
              />

              <SelectField
                label="Intensidade"
                value={intensity}
                onValueChange={setIntensity}
                options={INTENSITIES.map((i) => ({ label: `${i.label} (${i.desc})`, value: i.id }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <TextInput
                label="Duração Padrão (min)"
                type="number"
                value={defaultDuration}
                onValueChange={setDefaultDuration}
                placeholder="60"
              />

              <TextInput
                label="Calorias / Hora"
                type="number"
                value={caloriesPerHour}
                onValueChange={setCaloriesPerHour}
                placeholder="450"
              />
            </div>

            {/* Seleção de Dias da Semana para a Rotina */}
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                Dias Agendados na Rotina Semanal
              </label>
              <div className="grid grid-cols-7 gap-1.5">
                {DAYS_OF_WEEK.map((d) => {
                  const active = selectedDays.includes(d.key);
                  return (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() => toggleDay(d.key)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        active
                          ? "bg-orange-500 text-white border-orange-600 shadow-2xs"
                          : "bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:border-orange-300"
                      }`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-stone-400 mt-1">
                Selecione os dias em que você costuma realizar esse treino para habilitar o atalho de 1 clique no Dashboard.
              </p>
            </div>

            {/* Lista Dinâmica de Exercícios (Opcional) */}
            <div className="pt-2 border-t border-stone-200/80 dark:border-stone-800">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1">
                  <span>Exercícios da Ficha (Opcional)</span>
                  <InfoHint text="Adicione os exercícios, séries e cargas para consultar no celular enquanto treina." />
                </label>
                <button
                  type="button"
                  onClick={addExercise}
                  className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar Exercício
                </button>
              </div>

              {exercises.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {exercises.map((ex, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/70 dark:bg-stone-850 flex items-center gap-2"
                    >
                      <input
                        type="text"
                        placeholder="Exercício (ex: Supino Reto)"
                        value={ex.name}
                        onChange={(e) => updateExercise(idx, "name", e.target.value)}
                        className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 focus:outline-hidden"
                      />
                      <input
                        type="text"
                        placeholder="Séries (ex: 4x10)"
                        value={ex.sets}
                        onChange={(e) => updateExercise(idx, "sets", e.target.value)}
                        className="w-20 px-2.5 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 focus:outline-hidden"
                      />
                      <input
                        type="text"
                        placeholder="Carga (ex: 20kg)"
                        value={ex.weight}
                        onChange={(e) => updateExercise(idx, "weight", e.target.value)}
                        className="w-24 px-2.5 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => removeExercise(idx)}
                        className="p-1 rounded-md text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Observações Gerais */}
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                Observações
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Treino focado em força; não esquecer do alongamento de ombro..."
                rows={2}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 focus:outline-hidden"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <ActionButton
                type="button"
                variant="secondary"
                onClick={() => setModalOpen(false)}
              >
                Cancelar
              </ActionButton>
              <ActionButton
                type="submit"
                variant="primary"
                disabled={saving}
                className="gap-1.5 shadow-sm transition-all duration-200 hover:rotate-1 hover:scale-[1.02] active:scale-[0.98] active:rotate-0"
              >
                <Check className="w-4 h-4" />
                {saving ? "Salvando..." : editingWorkout ? "Salvar Alterações" : "Cadastrar Treino"}
              </ActionButton>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
