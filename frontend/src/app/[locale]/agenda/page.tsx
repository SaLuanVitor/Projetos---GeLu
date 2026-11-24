"use client";

import { AppShell } from "@/components/layout/AppShell";
import { ActionButton } from "@/components/ui/ActionButton";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { PaperCard } from "@/components/ui/PaperCard";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { getValidSession, handleInvalidSession } from "@/services/auth";
import { listFamilies } from "@/services/families";
import { getLocalizedApiError } from "@/services/localized-error";
import {
  createScheduleActivity,
  deleteScheduleActivity,
  listFamilyWeeklyGoals,
  listScheduleActivities,
  toggleScheduleActivityCompletion,
  updateScheduleActivity
} from "@/services/schedule";
import {
  Sunrise,
  Sun,
  Moon,
  Plus,
  Search,
  X,
  List,
  FolderKanban,
  Clock,
  Target,
  Check,
  Users,
  User,
  Pencil,
  Trash2,
  StickyNote,
  type LucideIcon,
} from "lucide-react";
import type {
  FamilyResponse,
  FamilyWeeklyGoalResponse,
  ScheduleActivityResponse
} from "@/types/api";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useFamilyContext } from "@/contexts/FamilyContext";
import { subscribeToFamilyEvents } from "@/hooks/useFamilySocket";

const DAYS = [
  { id: "SEG", namePt: "Segunda-feira", short: "Seg" },
  { id: "TER", namePt: "Terça-feira", short: "Ter" },
  { id: "QUA", namePt: "Quarta-feira", short: "Qua" },
  { id: "QUI", namePt: "Quinta-feira", short: "Qui" },
  { id: "SEX", namePt: "Sexta-feira", short: "Sex" },
  { id: "SAB", namePt: "Sábado", short: "Sáb" },
  { id: "DOM", namePt: "Domingo", short: "Dom" }
];

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  TRABALHO: { bg: "bg-blue-500/15", border: "border-blue-500", text: "text-blue-600 dark:text-blue-400" },
  ESTUDO: { bg: "bg-indigo-500/15", border: "border-indigo-500", text: "text-indigo-600 dark:text-indigo-400" },
  SAUDE: { bg: "bg-emerald-500/15", border: "border-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
  CASA: { bg: "bg-amber-500/15", border: "border-amber-500", text: "text-amber-600 dark:text-amber-400" },
  PESSOAS: { bg: "bg-purple-500/15", border: "border-purple-500", text: "text-purple-600 dark:text-purple-400" }
};

function parseMinutes(t: string): number {
  if (!t || !t.includes(":")) return 0;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function formatMinutes(m: number): string {
  const h = Math.floor(m / 60);
  const r = Math.round(m % 60);
  if (h > 0) {
    return `${h}h${r > 0 ? ` ${r}min` : ""}`;
  }
  return `${r}min`;
}

export default function SchedulePage() {
  const router = useRouter();
  const toast = useToast();
  const t = useTranslations("Schedule");
  const errors = useTranslations("CommonErrors");
  const fallbackError = errors("requestError");

  const { activeFamily, isPersonal } = useFamilyContext();
  const [family, setFamily] = useState<FamilyResponse | null>(null);
  const [activities, setActivities] = useState<ScheduleActivityResponse[]>([]);
  const [goals, setGoals] = useState<FamilyWeeklyGoalResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const todayIndex = (new Date().getDay() + 6) % 7; // 0 = Mon, 6 = Sun
  const [selectedDay, setSelectedDay] = useState(DAYS[todayIndex].id);

  // Modal de edição / criação
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formStart, setFormStart] = useState("");
  const [formEnd, setFormEnd] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState("TRABALHO");
  const [formGoalTag, setFormGoalTag] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formAssigneeIds, setFormAssigneeIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deletingActivity, setDeletingActivity] = useState(false);

  // Estados de Busca, Filtro de Categoria e Modo de Visualização (Timeline x Cards)
  const [activitySearch, setActivitySearch] = useState("");
  const [activityCategoryFilter, setActivityCategoryFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<"TIMELINE" | "CARDS">("TIMELINE");

  const [currentTimeMinutes, setCurrentTimeMinutes] = useState(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });

  // Anotações do dia com persistência imediata
  const [dayNotes, setDayNotes] = useState("");
  const [notesStatus, setNotesStatus] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storageKey = `gelu_agenda_notes_${isPersonal ? "personal" : activeFamily?.id ?? "personal"}_${selectedDay}`;
    const saved = localStorage.getItem(storageKey) || "";
    setDayNotes(saved);
    setNotesStatus("idle");
  }, [selectedDay, isPersonal, activeFamily?.id]);

  const handleNotesChange = (val: string) => {
    setDayNotes(val);
    setNotesStatus("saving");
    if (typeof window !== "undefined") {
      const storageKey = `gelu_agenda_notes_${isPersonal ? "personal" : activeFamily?.id ?? "personal"}_${selectedDay}`;
      localStorage.setItem(storageKey, val);
      setTimeout(() => {
        setNotesStatus("saved");
      }, 350);
    }
  };

  // Atualizar minuto a minuto para o bloco "Agora"
  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setCurrentTimeMinutes(d.getHours() * 60 + d.getMinutes());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const loadData = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) {
        setLoading(true);
      }
      setError("");
      const session = await getValidSession();
      if (!session) {
        router.replace("/login");
        return;
      }

      if (isPersonal) {
        setFamily(null);
        const [acts, g] = await Promise.all([
          listScheduleActivities(session.accessToken, undefined),
          listFamilyWeeklyGoals(session.accessToken, undefined),
        ]);
        setActivities(acts);
        setGoals(g);
        return;
      }

      if (!activeFamily) {
        setFamily(null);
        setActivities([]);
        setGoals([]);
        return;
      }

      setFamily(activeFamily);

      const [acts, g] = await Promise.all([
        listScheduleActivities(session.accessToken, activeFamily.id),
        listFamilyWeeklyGoals(session.accessToken, activeFamily.id)
      ]);

      setActivities(acts);
      setGoals(g);
    } catch (err) {
      if (handleInvalidSession(err, () => router.replace("/login"))) return;
      setError(getLocalizedApiError(err, errors, fallbackError));
    } finally {
      if (isInitial) {
        setLoading(false);
      }
    }
  }, [router, errors, fallbackError, activeFamily, isPersonal]);

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  // Sincronização em tempo real via WebSocket silenciosa (sem recarregar tela inteira)
  useEffect(() => {
    const unsub = subscribeToFamilyEvents((event) => {
      if (event.type.startsWith("SCHEDULE_")) {
        loadData(false);
      }
    });
    return unsub;
  }, [loadData]);

  // Atividades do dia selecionado
  const dayActivities = useMemo(() => {
    return activities
      .filter((a) => a.dayOfWeek === selectedDay)
      .sort((a, b) => parseMinutes(a.startTime) - parseMinutes(b.startTime));
  }, [activities, selectedDay]);

  // Atividades filtradas por busca e categoria
  const filteredDayActivities = useMemo(() => {
    return dayActivities.filter((a) => {
      if (
        activityCategoryFilter !== "ALL" &&
        a.category !== activityCategoryFilter
      ) {
        return false;
      }
      if (!activitySearch.trim()) return true;
      const q = activitySearch.toLowerCase();
      const matchTitle = a.title.toLowerCase().includes(q);
      const matchNotes = (a.notes || "").toLowerCase().includes(q);
      const matchGoal = (a.goalTag || "").toLowerCase().includes(q);
      const matchAssignees = (a.assignees || []).some((u) =>
        u.name.toLowerCase().includes(q)
      );
      return matchTitle || matchNotes || matchGoal || matchAssignees;
    });
  }, [dayActivities, activityCategoryFilter, activitySearch]);

  // Agrupamento para visualização em Fichas do Lar (Cards por período do dia)
  const groupedCardActivities = useMemo(() => {
    const morning: ScheduleActivityResponse[] = [];
    const afternoon: ScheduleActivityResponse[] = [];
    const evening: ScheduleActivityResponse[] = [];

    for (const act of filteredDayActivities) {
      const mins = parseMinutes(act.startTime);
      if (mins < 12 * 60) {
        morning.push(act);
      } else if (mins < 18 * 60) {
        afternoon.push(act);
      } else {
        evening.push(act);
      }
    }

    return [
      { period: "Manhã", icon: Sunrise, desc: "Começando o dia com energia", items: morning },
      { period: "Tarde", icon: Sun, desc: "Foco, trabalho e afazeres", items: afternoon },
      { period: "Noite", icon: Moon, desc: "Desacelerar, autocuidado e descanso", items: evening }
    ].filter((g) => g.items.length > 0);
  }, [filteredDayActivities]);

  // Bloco "Agora" para o dia de hoje
  const nowInfo = useMemo(() => {
    if (selectedDay !== DAYS[todayIndex].id) return null;
    let current: ScheduleActivityResponse | null = null;
    let next: ScheduleActivityResponse | null = null;

    for (const act of dayActivities) {
      const s = parseMinutes(act.startTime);
      const e = parseMinutes(act.endTime);
      if (currentTimeMinutes >= s && currentTimeMinutes < e) {
        current = act;
      } else if (s > currentTimeMinutes && !next) {
        next = act;
      }
    }

    if (current) {
      const start = parseMinutes(current.startTime);
      const end = parseMinutes(current.endTime);
      const duration = Math.max(1, end - start);
      const elapsed = Math.max(0, currentTimeMinutes - start);
      const percent = Math.min(100, Math.round((elapsed / duration) * 100));
      const remaining = Math.max(0, end - currentTimeMinutes);

      return {
        type: "ACTIVE" as const,
        current,
        next,
        percent,
        remainingMinutes: remaining
      };
    }

    return {
      type: "UPCOMING" as const,
      next
    };
  }, [dayActivities, selectedDay, todayIndex, currentTimeMinutes]);

  const handleToggle = async (act: ScheduleActivityResponse) => {
    const targetId = act.id;
    const oldStatus = act.completedToday;
    const newStatus = !oldStatus;

    // 1. Atualização otimista imediata na UI (0ms de espera, zero tremer de tela)
    setActivities((prev) =>
      prev.map((item) =>
        item.id === targetId ? { ...item, completedToday: newStatus } : item
      )
    );

    try {
      const session = await getValidSession();
      if (!session) {
        // Rollback se sem sessão
        setActivities((prev) =>
          prev.map((item) =>
            item.id === targetId ? { ...item, completedToday: oldStatus } : item
          )
        );
        router.replace("/login");
        return;
      }
      await toggleScheduleActivityCompletion(session.accessToken, targetId);
    } catch (err) {
      // Rollback se falhar
      setActivities((prev) =>
        prev.map((item) =>
          item.id === targetId ? { ...item, completedToday: oldStatus } : item
        )
      );
      if (handleInvalidSession(err, () => router.replace("/login"))) return;
      toast.error(getLocalizedApiError(err, errors, fallbackError));
    }
  };

  const handleOpenModal = (act?: ScheduleActivityResponse) => {
    if (act) {
      setEditingId(act.id);
      setFormStart(act.startTime);
      setFormEnd(act.endTime);
      setFormTitle(act.title);
      setFormCategory(act.category || "TRABALHO");
      setFormGoalTag(act.goalTag || "");
      setFormNotes(act.notes || "");
      setFormAssigneeIds(
        act.assignees && act.assignees.length > 0
          ? act.assignees.map((a) => a.id)
          : act.assignedToUserId
          ? [act.assignedToUserId]
          : []
      );
    } else {
      setEditingId(null);
      setFormStart("08:00");
      setFormEnd("09:00");
      setFormTitle("");
      setFormCategory("TRABALHO");
      setFormGoalTag("");
      setFormNotes("");
      setFormAssigneeIds([]);
    }
    setModalOpen(true);
  };

  const handleSaveActivity = async (e: FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formStart || !formEnd) return;
    if (!isPersonal && !family) return;
    try {
      setSaving(true);
      const session = await getValidSession();
      if (!session) return;

      const payload = {
        dayOfWeek: selectedDay,
        startTime: formStart,
        endTime: formEnd,
        title: formTitle.trim(),
        category: formCategory,
        goalTag: formGoalTag.trim() || undefined,
        notes: formNotes.trim() || undefined,
        assigneeUserIds: formAssigneeIds.length > 0 ? formAssigneeIds : undefined,
      };

      if (editingId) {
        const updated = await updateScheduleActivity(session.accessToken, editingId, payload);
        setActivities((prev) => prev.map((a) => (a.id === editingId ? updated : a)));
        toast.success("Atividade atualizada com sucesso!");
      } else {
        const created = await createScheduleActivity(session.accessToken, {
          ...payload,
          familyId: isPersonal ? undefined : family?.id,
        });
        setActivities((prev) => [...prev, created]);
        toast.success("Atividade criada com sucesso!");
      }

      setModalOpen(false);
    } catch (err) {
      if (handleInvalidSession(err, () => router.replace("/login"))) return;
      toast.error(getLocalizedApiError(err, errors, fallbackError));
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteActivity = async () => {
    if (!editingId) return;
    try {
      setDeletingActivity(true);
      const session = await getValidSession();
      if (!session) return;
      await deleteScheduleActivity(session.accessToken, editingId);
      setActivities((prev) => prev.filter((a) => a.id !== editingId));
      setConfirmDeleteOpen(false);
      setModalOpen(false);
      toast.success("Atividade excluída da agenda!");
    } catch (err) {
      if (handleInvalidSession(err, () => router.replace("/login"))) return;
      toast.error(getLocalizedApiError(err, errors, fallbackError));
    } finally {
      setDeletingActivity(false);
    }
  };

  const todayDateStr = useMemo(() => {
    return new Date().toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long"
    });
  }, []);

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header Hero */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-surface-variant pb-4">
          <div>
            <p className="text-sm font-semibold capitalize text-on-surface-variant">{todayDateStr}</p>
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-primary">
              {isPersonal ? "Minha Agenda Pessoal" : t("title")}
            </h1>
            <p className="text-sm text-on-surface-variant">
              {isPersonal ? "Sua rotina individual, blocos de tempo para foco, treinos e hábitos." : t("subtitle")}
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border-2 border-primary/20 bg-primary/5 px-4 py-3">
            <span className="font-display text-3xl font-extrabold tabular-nums text-primary">
              {dayActivities.filter((a) => a.completedToday).length}/{dayActivities.length}
            </span>
            <span className="text-xs font-semibold uppercase leading-tight text-on-surface-variant">
              Atividades<br />Hoje
            </span>
          </div>
        </div>

        {error && <StatusMessage variant="error">{error}</StatusMessage>}

        {loading ? (
          <div className="py-12 text-center text-on-surface-variant">Carregando agenda...</div>
        ) : !isPersonal && !family ? (
          <PaperCard className="p-8 text-center">
            <h2 className="text-xl font-bold">Nenhuma família encontrada</h2>
            <p className="mt-2 text-sm text-on-surface-variant">
              Crie uma família primeiro para organizar a agenda semanal do casal.
            </p>
            <ActionButton className="mt-4" onClick={() => router.push("/familia")}>
              Ir para Família
            </ActionButton>
          </PaperCard>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
            {/* Coluna Principal: Abas dos Dias e Lista de Atividades */}
            <div>
              {/* Abas dos Dias */}
              <div className="mb-4 grid grid-cols-7 gap-2">
                {DAYS.map((d, idx) => {
                  const dayActs = activities.filter((a) => a.dayOfWeek === d.id);
                  const doneCount = dayActs.filter((a) => a.completedToday).length;
                  const isSelected = selectedDay === d.id;
                  const isToday = idx === todayIndex;

                  return (
                    <button
                      key={d.id}
                      onClick={() => setSelectedDay(d.id)}
                      className={`flex flex-col items-center justify-center rounded-xl border-2 p-2.5 transition-all ${
                        isSelected
                          ? "border-primary bg-primary text-on-primary shadow-md"
                          : "border-surface-variant bg-surface-container hover:border-primary/50"
                      }`}
                    >
                      <span className="text-xs font-bold">
                        {d.short}
                        {isToday && " •"}
                      </span>
                      <span className={`text-[11px] ${isSelected ? "text-on-primary/80" : "text-on-surface-variant"}`}>
                        {doneCount}/{dayActs.length}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Bloco Agora (Now) */}
              {nowInfo && (
                <div className="mb-6 overflow-hidden rounded-2xl border-2 border-primary/20 bg-primary/10 p-5 shadow-sm">
                  {nowInfo.type === "ACTIVE" && nowInfo.current ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold uppercase text-on-primary">
                          {t("now")}
                        </span>
                        <span className="text-xs font-semibold text-primary">
                          {t("timeLeft", { time: formatMinutes(nowInfo.remainingMinutes) })}
                        </span>
                      </div>
                      <h2 className="mt-2 font-display text-2xl font-extrabold text-on-surface">
                        {nowInfo.current.title}
                      </h2>
                      {/* Barra de Progresso */}
                      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-variant">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500"
                          style={{ width: `${nowInfo.percent}%` }}
                        />
                      </div>
                      {nowInfo.next && (
                        <p className="mt-2 text-xs font-medium text-on-surface-variant">
                          {t("after", { title: nowInfo.next.title, time: nowInfo.next.startTime })}
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-2">
                      <span className="text-xs font-semibold uppercase text-on-surface-variant">
                        {nowInfo.next ? t("next") : t("dayOver")}
                      </span>
                      <h2 className="mt-1 font-display text-xl font-bold text-on-surface">
                        {nowInfo.next
                          ? `${nowInfo.next.title} às ${nowInfo.next.startTime}`
                          : t("restMessage")}
                      </h2>
                    </div>
                  )}
                </div>
              )}

              {/* Cabeçalho do Dia & Ação */}
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl font-bold">
                    {DAYS.find((d) => d.id === selectedDay)?.namePt}
                  </h2>
                  <p className="text-xs text-on-surface-variant">
                    {dayActivities.filter((a) => a.completedToday).length} de {dayActivities.length} {t("completed")}
                  </p>
                </div>
                <ActionButton onClick={() => handleOpenModal()}>
                  <span className="inline-flex items-center gap-1.5"><Plus className="w-3.5 h-3.5 stroke-[2]" /> {t("newActivity")}</span>
                </ActionButton>
              </div>

              {/* Barra de Pesquisa, Filtros e Alternância de Visualização (Linhas x Fichas) */}
              <div className="mb-5 flex flex-col gap-2.5 rounded-2xl border border-surface-variant/80 bg-surface-container/60 p-3 shadow-2xs backdrop-blur-xs">
                {/* Linha Superior: Busca + Toggle de Visualização */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                  {/* Campo de Busca */}
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400">
                      🔍
                    </span>
                    <input
                      type="text"
                      placeholder="Pesquisar atividade, notas ou responsável..."
                      value={activitySearch}
                      onChange={(e) => setActivitySearch(e.target.value)}
                      className="w-full rounded-xl border border-surface-variant bg-surface py-1.5 pl-8 pr-7 text-xs font-medium text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    {activitySearch && (
                      <button
                        type="button"
                        onClick={() => setActivitySearch("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-xs text-on-surface-variant hover:text-on-surface cursor-pointer"
                        title="Limpar pesquisa"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Alternador de Visualização: Linhas x Fichas */}
                  <div className="flex items-center gap-1 rounded-xl border border-surface-variant/80 bg-surface p-1 shrink-0 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setViewMode("TIMELINE")}
                      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                        viewMode === "TIMELINE"
                          ? "bg-primary text-on-primary shadow-xs"
                          : "text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/30"
                      }`}
                      title="Visualização em Linha do Tempo contínua"
                    >
                      <List className="w-3.5 h-3.5" />
                      <span>Linha do Tempo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("CARDS")}
                      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                        viewMode === "CARDS"
                          ? "bg-primary text-on-primary shadow-xs"
                          : "text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/30"
                      }`}
                      title="Visualização em Fichas do Lar (Cards por período)"
                    >
                      <FolderKanban className="w-3.5 h-3.5" />
                      <span>Fichas (Cards)</span>
                    </button>
                  </div>
                </div>

                {/* Linha Inferior: Filtros de Categoria */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scrollbar-none py-0.5">
                  <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider shrink-0 mr-1">
                    Filtro:
                  </span>
                  {[
                    { id: "ALL", label: "Todas" },
                    { id: "TRABALHO", label: "Trabalho" },
                    { id: "ESTUDO", label: "Estudo" },
                    { id: "SAUDE", label: "Saúde" },
                    { id: "CASA", label: "Casa" },
                    { id: "PESSOAS", label: "Pessoas" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActivityCategoryFilter(cat.id)}
                      className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer ${
                        activityCategoryFilter === cat.id
                          ? "bg-primary text-on-primary shadow-xs"
                          : "bg-surface text-on-surface-variant hover:bg-surface-variant/40"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lista / Grid de Atividades */}
              <div>
                {dayActivities.length === 0 ? (
                  <PaperCard className="p-8 text-center text-sm text-on-surface-variant">
                    Nenhuma atividade cadastrada para este dia. Use o botão acima para adicionar.
                  </PaperCard>
                ) : filteredDayActivities.length === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed border-surface-variant bg-surface-container/30 p-8 text-center">
                    <span className="text-3xl block mb-2">🔍</span>
                    <h3 className="text-sm font-bold text-on-surface">
                      Nenhuma atividade encontrada com esta busca ou categoria
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setActivitySearch("");
                        setActivityCategoryFilter("ALL");
                      }}
                      className="mt-2 text-xs font-bold text-primary hover:underline cursor-pointer"
                    >
                      Limpar filtros de busca
                    </button>
                  </div>
                ) : viewMode === "CARDS" ? (
                  /* MODO FICHAS DO LAR (CARDS POR PERÍODO) */
                  <div className="space-y-6">
                    {groupedCardActivities.map((group) => (
                      <div key={group.period} className="space-y-3">
                        <div className="flex items-center gap-2 border-b border-surface-variant/60 pb-1.5">
                          {(() => { const Icon = group.icon; return <Icon className="w-4 h-4 text-amber-800 dark:text-amber-300 stroke-[1.75]" />; })()}
                          <h3 className="font-display text-base font-bold text-on-surface">
                            {group.period}
                          </h3>
                          <span className="text-xs text-on-surface-variant font-medium">
                            • {group.desc} ({group.items.length})
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {group.items.map((act) => {
                            const color = CATEGORY_COLORS[act.category] || CATEGORY_COLORS.TRABALHO;
                            const tapeColor: "none" | "green" | "brown" | "orange" =
                              act.category === "SAUDE"
                                ? "green"
                                : act.category === "CASA"
                                ? "orange"
                                : "brown";

                            return (
                              <PaperCard
                                key={act.id}
                                tape={tapeColor}
                                onClick={() => handleToggle(act)}
                                className={`p-4 transition-all duration-300 ease-out flex flex-col justify-between cursor-pointer hover:-translate-y-1.5 hover:-rotate-1 hover:shadow-xl group select-none ${
                                  act.completedToday ? "opacity-60 bg-surface-container-low/80" : "hover:border-primary/40"
                                }`}
                              >
                                <div>
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                                        <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                                          <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3 text-stone-400" /> {act.startTime} - {act.endTime}</span>
                                        </span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${color.bg} ${color.text}`}>
                                          {t(`categories.${act.category}` as never) || act.category}
                                        </span>
                                        {act.goalTag && (
                                          <span className="text-[10px] font-semibold bg-surface-variant text-on-surface-variant px-1.5 py-0.5 rounded-md">
                                            <span className="inline-flex items-center gap-1"><Target className="w-3 h-3" /> {act.goalTag}</span>
                                          </span>
                                        )}
                                      </div>

                                      <h4
                                        className={`font-display text-base font-bold leading-snug mt-1 ${
                                          act.completedToday ? "line-through text-on-surface-variant" : "text-on-surface"
                                        }`}
                                      >
                                        {act.title}
                                      </h4>

                                      {act.notes && (
                                        <p className="mt-1.5 text-xs text-on-surface-variant font-serif italic line-clamp-3">
                                          “{act.notes}”
                                        </p>
                                      )}
                                    </div>

                                    {/* Botão Checkbox Conclusão */}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggle(act);
                                      }}
                                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 cursor-pointer ${
                                        act.completedToday
                                          ? "border-primary bg-primary text-on-primary shadow-xs"
                                          : "border-surface-variant bg-surface hover:border-primary"
                                      }`}
                                      aria-label="Marcar como concluída"
                                    >
                                      {act.completedToday ? <Check className="w-3.5 h-3.5 text-white stroke-[2]" /> : null}
                                    </button>
                                  </div>
                                </div>

                                {/* Rodapé da Ficha: Responsáveis e Ação */}
                                <div className="mt-3 pt-2.5 border-t border-stone-200/50 dark:border-stone-800/60 flex items-center justify-between text-[11px]">
                                  <div className="flex items-center gap-1.5">
                                    {act.assignees && act.assignees.length > 0 ? (
                                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-100/80 px-2 py-0.5 font-bold text-amber-900 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-900">
                                        {act.assignees.length > 1 ? <Users className="w-3 h-3 inline mr-1" /> : <User className="w-3 h-3 inline mr-1" />}
                                        {act.assignees.map((a) => a.name.split(" ")[0]).join(" & ")}
                                      </span>
                                    ) : act.assignedToUserName ? (
                                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-100/80 px-2 py-0.5 font-bold text-amber-900 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-900">
                                        <span className="inline-flex items-center gap-1"><User className="w-3 h-3" /> {act.assignedToUserName.split(" ")[0]}</span>
                                      </span>
                                    ) : (
                                      <span className="text-on-surface-variant opacity-75">Toda a casa</span>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenModal(act);
                                    }}
                                    className="inline-flex items-center gap-1 rounded-md bg-stone-100 dark:bg-stone-800/80 px-2 py-0.5 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:text-primary hover:bg-amber-100/60 dark:hover:bg-amber-950/60 border border-stone-200/80 dark:border-stone-700 transition-colors cursor-pointer"
                                    title="Editar ficha"
                                  >
                                    <span className="inline-flex items-center gap-1"><Pencil className="w-3 h-3" /> Editar</span>
                                  </button>
                                </div>
                              </PaperCard>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* MODO LINHA DO TEMPO (LINHAS CONTÍNUAS) */
                  <div className="space-y-3">
                    {filteredDayActivities.map((act) => {
                      const color = CATEGORY_COLORS[act.category] || CATEGORY_COLORS.TRABALHO;
                      return (
                        <div
                          key={act.id}
                          className={`group relative flex items-start gap-3.5 rounded-2xl border-2 p-4 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md ${
                            act.completedToday
                              ? "border-surface-variant/50 bg-surface-container-low/70 opacity-65"
                              : "border-surface-variant bg-surface-container hover:border-primary/50 shadow-xs"
                          }`}
                        >
                          {/* Horários */}
                          <div className="flex shrink-0 flex-col items-center justify-center font-mono text-xs tabular-nums text-on-surface-variant">
                            <span className="font-bold text-on-surface">{act.startTime}</span>
                            <span className="text-[10px] opacity-75">{act.endTime}</span>
                          </div>

                          {/* Barra de Categoria */}
                          <div className={`h-10 w-1.5 shrink-0 rounded-full ${color.border.replace("border-", "bg-")}`} />

                          {/* Conteúdo */}
                          <div
                            className="min-w-0 flex-1 cursor-pointer"
                            onClick={() => handleOpenModal(act)}
                          >
                            <h3
                              className={`font-semibold leading-tight ${
                                act.completedToday ? "line-through text-on-surface-variant" : "text-on-surface"
                              }`}
                            >
                              {act.title}
                            </h3>
                            {act.notes && (
                              <p className="mt-1 text-xs text-on-surface-variant line-clamp-2">
                                {act.notes}
                              </p>
                            )}
                            <div className="mt-2 flex flex-wrap gap-2">
                              <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${color.bg} ${color.text}`}>
                                {t(`categories.${act.category}` as never) || act.category}
                              </span>
                              {act.goalTag && (
                                <span className="inline-block rounded-md bg-surface-variant px-2 py-0.5 text-[10px] font-semibold text-on-surface-variant">
                                  <span className="inline-flex items-center gap-1"><Target className="w-3 h-3" /> {act.goalTag}</span>
                                </span>
                              )}
                              {/* Responsáveis da Atividade */}
                              {act.assignees && act.assignees.length > 0 ? (
                                <span className="inline-flex items-center gap-1 rounded-md bg-amber-100/80 px-2 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-900">
                                  {act.assignees.length > 1 ? <Users className="w-3 h-3 inline mr-1" /> : <User className="w-3 h-3 inline mr-1" />}
                                  {act.assignees.map((a) => a.name.split(" ")[0]).join(" & ")}
                                </span>
                              ) : act.assignedToUserName ? (
                                <span className="inline-flex items-center gap-1 rounded-md bg-amber-100/80 px-2 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-900">
                                  <span className="inline-flex items-center gap-1"><User className="w-3 h-3" /> {act.assignedToUserName.split(" ")[0]}</span>
                                </span>
                              ) : null}
                            </div>
                          </div>

                          {/* Botão Checkbox Conclusão */}
                          <button
                            type="button"
                            onClick={() => handleToggle(act)}
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 cursor-pointer ${
                              act.completedToday
                                ? "border-primary bg-primary text-on-primary shadow-sm"
                                : "border-surface-variant bg-surface hover:border-primary"
                            }`}
                            aria-label="Marcar como concluída"
                          >
                            {act.completedToday ? <Check className="w-3.5 h-3.5 text-white stroke-[2]" /> : null}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Coluna Lateral: Metas da Semana e Lembretes */}
            <div className="space-y-6">
              {/* Metas da Semana */}
              <PaperCard className="p-5">
                <h3 className="font-display text-lg font-bold text-on-surface">
                  {t("weeklyGoals")}
                </h3>
                <div className="mt-4 space-y-4">
                  {goals.length === 0 ? (
                    <p className="text-xs text-on-surface-variant">
                      Nenhuma meta cadastrada para esta semana.
                    </p>
                  ) : (
                    goals.map((g) => (
                      <div key={g.id}>
                        <div className="flex justify-between text-xs font-semibold">
                          <span>{g.title}</span>
                          <span className="tabular-nums text-on-surface-variant">
                            {g.currentCount}/{g.targetCount} {g.unit}
                          </span>
                        </div>
                        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-surface-variant">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-300"
                            style={{ width: `${g.progressPercent}%` }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </PaperCard>

              {/* Card de Anotações do Dia Persistente */}
              <PaperCard className="p-5" tape="orange">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-bold text-on-surface flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5"><StickyNote className="w-4 h-4 text-amber-800 dark:text-amber-400 stroke-[1.75]" /> {t("dayNotes")}</span>
                  </h3>
                  {notesStatus === "saving" && (
                    <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 animate-pulse">
                      Salvando...
                    </span>
                  )}
                  {notesStatus === "saved" && (
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      <span className="inline-flex items-center gap-1"><Check className="w-3 h-3 text-emerald-600 stroke-[2]" /> Salvo no dia</span>
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-on-surface-variant">
                  Anotações livres para {DAYS.find((d) => d.id === selectedDay)?.namePt || "o dia"}:
                </p>
                <textarea
                  value={dayNotes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  className="mt-3 w-full rounded-xl border border-surface-variant bg-surface p-3 text-xs text-on-surface placeholder-on-surface-variant/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
                  rows={4}
                  placeholder={t("dayNotesPlaceholder")}
                />
                <div className="mt-2 flex items-center justify-between text-[10px] text-stone-400">
                  <span>Salvo automaticamente</span>
                  {dayNotes && (
                    <button
                      type="button"
                      onClick={() => handleNotesChange("")}
                      className="text-stone-400 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      Limpar nota
                    </button>
                  )}
                </div>
              </PaperCard>
            </div>
          </div>
        )}

        {/* Modal de Nova / Editar Atividade via React Portal */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingId ? t("editActivity") : t("newActivity")}
          subtitle={`Organizando para ${DAYS.find((d) => d.id === selectedDay)?.namePt}`}
          maxWidth="md"
        >
          <form onSubmit={handleSaveActivity} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 block mb-1">
                  {t("startTime")}
                </label>
                <input
                  type="time"
                  value={formStart}
                  onChange={(e) => setFormStart(e.target.value)}
                  required
                  className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#28221d] px-3.5 py-2 text-sm font-semibold text-stone-900 dark:text-stone-100 shadow-sm focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 block mb-1">
                  {t("endTime")}
                </label>
                <input
                  type="time"
                  value={formEnd}
                  onChange={(e) => setFormEnd(e.target.value)}
                  required
                  className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#28221d] px-3.5 py-2 text-sm font-semibold text-stone-900 dark:text-stone-100 shadow-sm focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 block mb-1">
                {t("activityTitle")}
              </label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder={t("activityPlaceholder")}
                required
                className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#28221d] px-3.5 py-2.5 text-sm font-semibold text-stone-900 dark:text-stone-100 shadow-sm placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 block mb-1">
                  {t("category")}
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#28221d] px-3 py-2.5 text-sm font-semibold text-stone-900 dark:text-stone-100 shadow-sm focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="TRABALHO" className="dark:bg-[#28221d] dark:text-stone-100">Trabalho</option>
                  <option value="ESTUDO" className="dark:bg-[#28221d] dark:text-stone-100">Estudo</option>
                  <option value="SAUDE" className="dark:bg-[#28221d] dark:text-stone-100">Saúde & Treino</option>
                  <option value="CASA" className="dark:bg-[#28221d] dark:text-stone-100">Casa & Rotina</option>
                  <option value="PESSOAS" className="dark:bg-[#28221d] dark:text-stone-100">Casal & Pessoas</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 block mb-1">
                  {t("goalTag")}
                </label>
                <input
                  type="text"
                  value={formGoalTag}
                  onChange={(e) => setFormGoalTag(e.target.value)}
                  placeholder="Ex: academia, ellie"
                  className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#28221d] px-3.5 py-2.5 text-sm font-semibold text-stone-900 dark:text-stone-100 shadow-sm placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 block mb-1">
                {t("notes")}
              </label>
              <textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#28221d] p-3 text-xs font-medium text-stone-900 dark:text-stone-100 shadow-sm placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                placeholder="Observações ou detalhes da tarefa..."
              />
            </div>

            {/* Seletor de Responsáveis (1 ou mais pessoas) */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 block mb-1.5">
                De quem é essa atividade?
              </label>
              {family && family.members && family.members.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {family.members.map((member) => {
                    const isSelected = formAssigneeIds.includes(member.userId);
                    return (
                      <button
                        key={member.userId}
                        type="button"
                        onClick={() => {
                          setFormAssigneeIds((prev) =>
                            isSelected
                              ? prev.filter((id) => id !== member.userId)
                              : [...prev, member.userId]
                          );
                        }}
                        className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? "border-amber-600 dark:border-amber-500 bg-amber-500/15 text-amber-900 dark:text-amber-200 shadow-sm ring-1 ring-amber-500/30"
                            : "border-stone-300 dark:border-stone-700 bg-white/90 dark:bg-[#28221d] text-stone-600 dark:text-stone-300 hover:border-stone-400"
                        }`}
                      >
                        {isSelected ? <Check className="w-3.5 h-3.5 text-amber-800 stroke-[2]" /> : <User className="w-3.5 h-3.5 text-stone-400" />}
                        <span>{member.userName}</span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
              <p className="mt-1.5 text-[11px] text-stone-500 dark:text-stone-400">
                Pode selecionar 1 ou mais pessoas. Se nenhuma for selecionada, a atividade será sua.
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-stone-200/60 dark:border-stone-800">
              {editingId ? (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteOpen(true)}
                  className="rounded-xl px-3 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                >
                  <span className="inline-flex items-center gap-1"><Trash2 className="w-3 h-3" /> {t("delete")}</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex gap-2">
                <ActionButton
                  type="button"
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                >
                  {t("cancel")}
                </ActionButton>
                <ActionButton type="submit" disabled={saving}>
                  {saving ? t("saving") : t("save")}
                </ActionButton>
              </div>
            </div>
          </form>
        </Modal>

        {/* Confirmação de Exclusão de Atividade */}
        <ConfirmDialog
          isOpen={confirmDeleteOpen}
          onClose={() => setConfirmDeleteOpen(false)}
          onConfirm={confirmDeleteActivity}
          title={`Excluir Atividade "${formTitle}"?`}
          description={
            <span>
              Tem certeza que deseja remover esta atividade da agenda semanal?
              Esta ação não pode ser desfeita.
            </span>
          }
          confirmLabel="Excluir Atividade"
          loading={deletingActivity}
          variant="danger"
        />
      </div>
    </AppShell>
  );
}
