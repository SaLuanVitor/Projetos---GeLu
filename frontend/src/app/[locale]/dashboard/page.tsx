"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { AppShell } from "@/components/layout/AppShell";
import { ActionLink } from "@/components/ui/ActionButton";
import { CoupleNotesCard } from "@/components/dashboard/CoupleNotesCard";
import { WorkoutSection } from "@/components/dashboard/WorkoutSection";
import { DailyMealDiaryCard } from "@/components/meals/DailyMealDiaryCard";
import { DailyMealChecklistCard } from "@/components/meals/DailyMealChecklistCard";
import { HabitsInsightsCard } from "@/components/meals/HabitsInsightsCard";
import { PaperCard } from "@/components/ui/PaperCard";
import {
  User,
  Home,
  CalendarDays,
  AlertCircle,
  Clock,
  Zap,
  Check,
  CheckCircle2,
} from "lucide-react";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { getValidSession, handleInvalidSession } from "@/services/auth";
import { getLocalizedApiError } from "@/services/localized-error";
import { getProfile } from "@/services/profile";
import { getOrCreateWeeklyDiet } from "@/services/diet";
import { getDailyWorkoutSummary } from "@/services/workouts";
import { getDailyMealSummary } from "@/services/meals";
import { listScheduleActivities, toggleScheduleActivityCompletion } from "@/services/schedule";
import { useFamilyContext } from "@/contexts/FamilyContext";
import { subscribeToFamilyEvents } from "@/hooks/useFamilySocket";
import type { StoredSession } from "@/services/session";
import type {
  DailyMealSummaryResponse,
  DailyWorkoutSummaryResponse,
  DietMealResponse,
  ProfileResponse,
  ScheduleActivityResponse,
} from "@/types/api";

const DAYS_SHORT = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];
const DAYS_NAMES_PT: Record<string, string> = {
  DOM: "Domingo",
  SEG: "Segunda-feira",
  TER: "Terça-feira",
  QUA: "Quarta-feira",
  QUI: "Quinta-feira",
  SEX: "Sexta-feira",
  SAB: "Sábado",
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  TRABALHO: { bg: "bg-blue-100 dark:bg-blue-950/60", text: "text-blue-900 dark:text-blue-200" },
  ESTUDO: { bg: "bg-purple-100 dark:bg-purple-950/60", text: "text-purple-900 dark:text-purple-200" },
  SAUDE: { bg: "bg-emerald-100 dark:bg-emerald-950/60", text: "text-emerald-900 dark:text-emerald-200" },
  CASA: { bg: "bg-amber-100 dark:bg-amber-950/60", text: "text-amber-900 dark:text-amber-200" },
  PESSOAL: { bg: "bg-rose-100 dark:bg-rose-950/60", text: "text-rose-900 dark:text-rose-200" },
};

export default function DashboardPage() {
  const router = useRouter();
  const t = useTranslations("Dashboard");
  const errors = useTranslations("CommonErrors");
  const { activeFamily, isPersonal } = useFamilyContext();

  const [session, setSession] = useState<StoredSession | null>(null);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [todayMeals, setTodayMeals] = useState<DietMealResponse[]>([]);
  const [dailyMealSummary, setDailyMealSummary] = useState<DailyMealSummaryResponse | null>(null);
  const [workoutSummary, setWorkoutSummary] = useState<DailyWorkoutSummaryResponse | null>(null);
  const [todayActivities, setTodayActivities] = useState<ScheduleActivityResponse[]>([]);
  const [error, setError] = useState("");
  const [, setLoading] = useState(true);

  const [currentTimeMinutes, setCurrentTimeMinutes] = useState(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });

  const currentDayKey = useMemo(() => {
    return DAYS_SHORT[new Date().getDay()];
  }, []);

  // Atualizar minuto a minuto para o checklist em tempo real
  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setCurrentTimeMinutes(d.getHours() * 60 + d.getMinutes());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const validSession = await getValidSession();
      if (!validSession) {
        setLoading(false);
        router.replace("/login");
        return;
      }
      setSession(validSession);

      const familyIdToUse = isPersonal ? undefined : activeFamily?.id;
      const todayDateIso = new Date().toISOString().split("T")[0];

      // Carregar perfil, treinos, dieta, diário fotográfico e agenda do dia em paralelo
      const [profileData, workoutsData, currentDiet, activitiesData, mealsSummaryData] = await Promise.all([
        getProfile(validSession.accessToken).catch(() => null),
        getDailyWorkoutSummary(validSession.accessToken).catch(() => null),
        getOrCreateWeeklyDiet(validSession.accessToken, familyIdToUse).catch(() => null),
        listScheduleActivities(
          validSession.accessToken,
          familyIdToUse,
          currentDayKey,
          todayDateIso
        ).catch(() => []),
        getDailyMealSummary(validSession.accessToken, todayDateIso).catch(() => null),
      ]);

      if (profileData) setProfile(profileData);
      if (workoutsData) setWorkoutSummary(workoutsData);
      if (mealsSummaryData) setDailyMealSummary(mealsSummaryData);

      if (currentDiet && currentDiet.meals) {
        const mealsOfToday = currentDiet.meals.filter(
          (m: DietMealResponse) => m.weekDay === currentDayKey
        );
        setTodayMeals(mealsOfToday);
      } else {
        setTodayMeals([]);
      }

      const sortedActivities = [...activitiesData].sort((a, b) =>
        a.startTime.localeCompare(b.startTime)
      );
      setTodayActivities(sortedActivities);
    } catch (err) {
      if (handleInvalidSession(err, () => router.replace("/login"))) return;
      setError(getLocalizedApiError(err, errors, t("loadError")));
    } finally {
      setLoading(false);
    }
  }, [activeFamily?.id, currentDayKey, errors, isPersonal, router, t]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Atualizações em tempo real para a família ativa
  useEffect(() => {
    if (isPersonal || !activeFamily?.id) return;
    const unsubscribe = subscribeToFamilyEvents((event) => {
      if (
        event.familyId === activeFamily.id &&
        (event.type === "MEAL_ADDED" ||
          event.type === "MEAL_UPDATED" ||
          event.type === "MEAL_DELETED" ||
          event.type === "TASK_COMPLETED")
      ) {
        loadDashboardData();
      }
    });
    return unsubscribe;
  }, [activeFamily?.id, isPersonal, loadDashboardData]);

  // Toggle rápido da atividade diretamente pelo checklist do Dashboard
  const handleToggleActivity = async (act: ScheduleActivityResponse) => {
    if (!session?.accessToken) return;
    const todayDateIso = new Date().toISOString().split("T")[0];
    const prev = [...todayActivities];
    setTodayActivities((curr) =>
      curr.map((item) =>
        item.id === act.id ? { ...item, completedToday: !item.completedToday } : item
      )
    );
    try {
      await toggleScheduleActivityCompletion(session.accessToken, act.id, todayDateIso);
    } catch {
      setTodayActivities(prev);
    }
  };

  // Cálculos de Calorias
  const totalConsumedCalories = useMemo(() => {
    // Se o usuário registrou refeições reais no diário com IA hoje, prioriza o consumo real registrado
    const realCalories = dailyMealSummary?.totalCalories || 0;
    if (realCalories > 0) {
      return Math.round(realCalories);
    }
    return todayMeals.reduce((acc, m) => acc + (m.totalEstimatedCalories || 0), 0);
  }, [dailyMealSummary, todayMeals]);

  const totalBurnedCalories = useMemo(() => {
    return workoutSummary?.totalCaloriesBurned ?? 0;
  }, [workoutSummary]);

  const calorieGoal = profile?.dailyCalorieGoal ?? 2000;
  const netCalories = Math.max(0, totalConsumedCalories - totalBurnedCalories);
  const remainingCalories = calorieGoal - netCalories;

  const displayName = profile?.name ?? session?.user.name ?? t("fallbackName");

  // Análise de horários para a agenda de hoje
  const parseMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(":").map(Number);
    // Se for 00:00 como término, representa o fim do dia (meia-noite = 1440 min)
    if (h === 0 && (m === 0 || isNaN(m))) return 24 * 60;
    return (h || 0) * 60 + (m || 0);
  };

  const completedActivitiesCount = useMemo(() => {
    return todayActivities.filter((a) => a.completedToday).length;
  }, [todayActivities]);

  // Atividades atrasadas: terminaram antes do horário atual e NÃO foram marcadas
  const overdueActivities = useMemo(() => {
    return todayActivities.filter(
      (a) => !a.completedToday && parseMinutes(a.endTime) < currentTimeMinutes
    );
  }, [todayActivities, currentTimeMinutes]);

  // Atividades relevantes para a hora atual: em andamento agora ou próximas
  const currentAndUpcomingActivities = useMemo(() => {
    return todayActivities.filter((act) => {
      const endM = parseMinutes(act.endTime);
      return endM >= currentTimeMinutes;
    });
  }, [todayActivities, currentTimeMinutes]);

  const activityProgressPercent =
    todayActivities.length > 0
      ? Math.round((completedActivitiesCount / todayActivities.length) * 100)
      : 0;

  return (
    <AppShell>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-950/60 px-3 py-1 text-xs font-bold text-amber-900 dark:text-amber-200">
                {isPersonal ? <span className="inline-flex items-center gap-1"><User className="w-3.5 h-3.5" /> Espaço Pessoal</span> : <span className="inline-flex items-center gap-1"><Home className="w-3.5 h-3.5" /> {activeFamily?.name || "Família"}</span>}
              </span>
              <span suppressHydrationWarning className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                {DAYS_NAMES_PT[currentDayKey]}
              </span>
            </div>
            <h1 className="mt-2 font-display text-3xl sm:text-4xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
              Bom ver você por aqui, {displayName}!
            </h1>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
              {isPersonal
                ? "Seu cantinho pessoal: acompanhe suas metas, checklist do dia e treinos."
                : `Visão geral da rotina, treinos e refeições da ${activeFamily?.name || "família"} em tempo real.`}
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4">
            <StatusMessage variant="warning">{error}</StatusMessage>
          </div>
        )}

        <section className="mt-6 grid gap-6 lg:grid-cols-12">
          {/* Mural de Recados do Casal */}
          {session?.accessToken && <CoupleNotesCard accessToken={session.accessToken} />}

          {/* Módulo de Treinos e Atividade Física (Posicionado no Início) */}
          <div className="lg:col-span-12">
            {session?.accessToken && (
              <WorkoutSection
                accessToken={session.accessToken}
                summary={workoutSummary}
                onRefresh={loadDashboardData}
              />
            )}
          </div>

          {/* Diário Fotográfico de Refeições com IA (Food Vision) */}
          <div className="lg:col-span-12">
            {session?.accessToken && (
              <DailyMealDiaryCard
                accessToken={session.accessToken}
                onMealsUpdated={loadDashboardData}
              />
            )}
          </div>

          {/* Checklist Rápido da Rotina de Hoje com Detecção de Horários */}
          <PaperCard className="lg:col-span-12 p-6" tape="green">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-stone-200/80 dark:border-stone-800 pb-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">
                    {isPersonal ? "Minha Rotina de Hoje" : "Rotina da Casa de Hoje"}
                  </span>
                  <span suppressHydrationWarning className="text-xs text-stone-500 font-semibold">• {DAYS_NAMES_PT[currentDayKey]}</span>
                </div>
                <h2 className="mt-1 font-display text-2xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5"><CalendarDays className="w-5 h-5 text-amber-800 dark:text-amber-300 stroke-[1.75]" /> Rotina de Agora & Próximas Tarefas</span>
                </h2>
                <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                  {completedActivitiesCount} de {todayActivities.length} tarefas concluídas no dia ({activityProgressPercent}%)
                </p>
              </div>

              <ActionLink
                href="/agenda"
                variant="outline"
                className="text-xs py-1.5 px-3 self-start sm:self-auto shadow-2xs font-semibold"
              >
                Abrir Agenda Completa →
              </ActionLink>
            </div>

            {/* Barra de Progresso do Dia */}
            {todayActivities.length > 0 && (
              <div className="mt-3 mb-4 h-2 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800 border border-stone-200/60 dark:border-stone-700/60">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                  style={{ width: `${activityProgressPercent}%` }}
                />
              </div>
            )}

            {/* ALERTA DE ATIVIDADES ATRASADAS (Aparece apenas como aviso clicável) */}
            {overdueActivities.length > 0 && (
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-amber-500/10 border border-amber-500/30 p-3.5 text-amber-950 dark:text-amber-200">
                <div className="flex items-center gap-2.5 min-w-0">
                  <AlertCircle className="w-5 h-5 text-amber-700 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold truncate sm:whitespace-normal">
                      {overdueActivities.length} {overdueActivities.length > 1 ? "atividades anteriores não foram marcadas" : "atividade anterior não foi marcada"} no horário programado.
                    </p>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
                      {overdueActivities.slice(0, 3).map((a) => a.title).join(", ")}
                      {overdueActivities.length > 3 ? ` e mais ${overdueActivities.length - 3}...` : ""}
                    </p>
                  </div>
                </div>
                <ActionLink
                  href="/agenda"
                  variant="outline"
                  className="text-xs py-1.5 px-3 self-start sm:self-auto bg-white dark:bg-[#25201c] border-amber-400 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-950/40 shadow-2xs font-bold shrink-0"
                >
                  Ver pendências na Agenda →
                </ActionLink>
              </div>
            )}

            {/* ITENS DO MOMENTO ATUAL (Somente Agora e Próximas) */}
            {todayActivities.length === 0 ? (
              <div className="rounded-xl border border-dashed border-stone-300 dark:border-stone-800 p-6 text-center text-xs text-stone-500">
                <CalendarDays className="w-8 h-8 text-stone-400 mx-auto mb-1 stroke-[1.75]" />
                <span suppressHydrationWarning>
                  Nenhuma atividade agendada para {DAYS_NAMES_PT[currentDayKey]}. Aproveite para descansar ou programar sua rotina!
                </span>
                <div className="mt-3">
                  <ActionLink href="/agenda" className="text-xs py-1.5 px-3">
                    + Adicionar Tarefa na Agenda
                  </ActionLink>
                </div>
              </div>
            ) : currentAndUpcomingActivities.length === 0 ? (
              <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-[#201b17]/50 p-6 text-center text-xs text-stone-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-1 stroke-[1.75]" />
                Todas as tarefas programadas para hoje já encerraram seu horário. Bom descanso!
                <div className="mt-3">
                  <ActionLink href="/agenda" variant="outline" className="text-xs py-1.5 px-3">
                    Conferir dia na Agenda
                  </ActionLink>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {currentAndUpcomingActivities.map((act) => {
                  const startM = parseMinutes(act.startTime);
                  const endM = parseMinutes(act.endTime);
                  const isNow =
                    !act.completedToday &&
                    startM <= currentTimeMinutes &&
                    currentTimeMinutes <= endM;
                  const catStyle =
                    CATEGORY_COLORS[act.category] || CATEGORY_COLORS.TRABALHO;

                  return (
                    <div
                      key={act.id}
                      onClick={() => handleToggleActivity(act)}
                      className={`group flex items-start justify-between gap-3 p-3.5 rounded-xl border transition-all duration-200 cursor-pointer select-none ${
                        act.completedToday
                          ? "bg-stone-50/70 dark:bg-[#201b17]/60 border-stone-200/60 dark:border-stone-800 opacity-60"
                          : isNow
                          ? "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-700 shadow-xs hover:border-emerald-600 ring-1 ring-emerald-400/40"
                          : "bg-white dark:bg-[#25201c] border-stone-200 dark:border-stone-700/80 shadow-2xs hover:border-primary/50"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <span className="font-mono text-[11px] font-bold text-primary">
                            <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3 text-stone-400" /> {act.startTime} - {act.endTime}</span>
                          </span>
                          {isNow ? (
                            <span className="text-[10px] font-extrabold bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 px-1.5 py-0.2 rounded animate-pulse">
                              <span className="inline-flex items-center gap-1"><Zap className="w-3 h-3 text-amber-700" /> Agora</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 px-1.5 py-0.2 rounded">
                              <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3 text-stone-500" /> Próxima</span>
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${catStyle.bg} ${catStyle.text}`}
                          >
                            {act.category}
                          </span>
                        </div>
                        <p
                          className={`font-display text-sm font-bold leading-snug truncate ${
                            act.completedToday
                              ? "line-through text-stone-400 dark:text-stone-500"
                              : "text-stone-900 dark:text-stone-100"
                          }`}
                        >
                          {act.title}
                        </p>
                        {act.notes && (
                          <p className="text-[11px] text-stone-500 italic truncate mt-0.5">
                            {act.notes}
                          </p>
                        )}
                      </div>

                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleActivity(act);
                        }}
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all cursor-pointer ${
                          act.completedToday
                            ? "border-primary bg-primary text-white text-xs font-bold"
                            : "border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 hover:border-primary"
                        }`}
                        aria-label="Marcar tarefa"
                      >
                        {act.completedToday ? <Check className="w-3.5 h-3.5 text-white stroke-[2]" /> : null}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </PaperCard>

          {/* Balanço Calórico Dinâmico em Tempo Real */}
          <PaperCard className="lg:col-span-4 text-center p-6 flex flex-col justify-between" tape="orange">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 block mb-1">
                Balanço Diário
              </span>
              <h3 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
                Saldo Calórico de Hoje
              </h3>

              <div className="mx-auto my-6 flex h-40 w-40 flex-col items-center justify-center rounded-full border-4 border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 shadow-inner">
                <span className="font-display text-4xl font-black text-amber-700 dark:text-amber-400">
                  {remainingCalories}
                </span>
                <span className="text-xs font-extrabold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  {remainingCalories >= 0 ? "kcal restantes" : "kcal excedidas"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-3 border-t border-stone-200/80 dark:border-stone-800 text-xs">
              <div className="rounded-xl bg-stone-50 dark:bg-[#25201c] p-2">
                <span className="text-[10px] text-stone-400 block font-bold uppercase">Meta</span>
                <span className="font-black text-stone-800 dark:text-stone-200 block text-sm mt-0.5">
                  {calorieGoal}
                </span>
              </div>

              <div className="rounded-xl bg-stone-50 dark:bg-[#25201c] p-2">
                <span className="text-[10px] text-stone-400 block font-bold uppercase">Comidas</span>
                <span className="font-black text-amber-800 dark:text-amber-300 block text-sm mt-0.5">
                  +{totalConsumedCalories}
                </span>
              </div>

              <div className="rounded-xl bg-stone-50 dark:bg-[#25201c] p-2">
                <span className="text-[10px] text-stone-400 block font-bold uppercase">Treinos</span>
                <span className="font-black text-emerald-700 dark:text-emerald-400 block text-sm mt-0.5">
                  -{totalBurnedCalories}
                </span>
              </div>
            </div>
          </PaperCard>

          {/* Checklist Inteligente de Refeições (1-Clique, IA Texto/Voz & Visão) */}
          <div className="lg:col-span-8">
            {session?.accessToken && (
              <DailyMealChecklistCard
                accessToken={session.accessToken}
                familyId={isPersonal ? undefined : activeFamily?.id}
                onMealsUpdated={loadDashboardData}
              />
            )}
          </div>

          {/* Memória de Hábitos e Insights Nutricionais da IA (Orion) */}
          <div className="lg:col-span-4">
            {session?.accessToken && (
              <HabitsInsightsCard
                accessToken={session.accessToken}
                familyId={isPersonal ? undefined : activeFamily?.id}
              />
            )}
          </div>
        </section>
      </main>
    </AppShell>
  );
}
