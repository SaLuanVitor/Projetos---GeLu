"use client";

import { AppShell } from "@/components/layout/AppShell";
import { ActionButton, ActionLink } from "@/components/ui/ActionButton";
import { NotebookPageHeader } from "@/components/ui/Notebook";
import { PaperCard } from "@/components/ui/PaperCard";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useFamilyContext } from "@/contexts/FamilyContext";
import { getValidSession, handleInvalidSession } from "@/services/auth";
import { getLocalizedApiError } from "@/services/localized-error";
import {
  createWeightRecord,
  getFamilyWeightHistory,
  getWeeklyEvolutionSummary,
  listWeightHistory
} from "@/services/profile";
import type { StoredSession } from "@/services/session";
import type {
  FamilyMemberEvolutionDto,
  FamilyWeightHistoryResponse,
  WeeklyEvolutionSummaryResponse,
  WeightHistoryItem
} from "@/types/api";
import { useRouter } from "@/i18n/navigation";
import {
  Scale,
  TrendingDown,
  TrendingUp,
  Sparkles,
  Lightbulb,
  Check,
  Users,
  User,
  Flame,
  Activity,
  Calendar,
  AlertCircle,
  Plus,
  BarChart3,
  Home,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

const MEMBER_COLORS = [
  { stroke: "#ea580c", bg: "bg-orange-500", text: "text-orange-600 dark:text-orange-400", hex: "#ea580c", lightBg: "bg-orange-50 dark:bg-orange-950/40", border: "border-orange-500" },
  { stroke: "#059669", bg: "bg-emerald-600", text: "text-emerald-600 dark:text-emerald-400", hex: "#059669", lightBg: "bg-emerald-50 dark:bg-emerald-950/40", border: "border-emerald-500" },
  { stroke: "#7c3aed", bg: "bg-purple-600", text: "text-purple-600 dark:text-purple-400", hex: "#7c3aed", lightBg: "bg-purple-50 dark:bg-purple-950/40", border: "border-purple-500" },
  { stroke: "#2563eb", bg: "bg-blue-600", text: "text-blue-600 dark:text-blue-400", hex: "#2563eb", lightBg: "bg-blue-50 dark:bg-blue-950/40", border: "border-blue-500" },
  { stroke: "#db2777", bg: "bg-pink-600", text: "text-pink-600 dark:text-pink-400", hex: "#db2777", lightBg: "bg-pink-50 dark:bg-pink-950/40", border: "border-pink-500" },
];

export default function WeightEvolutionPage() {
  const router = useRouter();
  const toast = useToast();
  const t = useTranslations("Evolution");
  const errors = useTranslations("CommonErrors");
  const locale = useLocale();

  const { activeFamily, isPersonal } = useFamilyContext();
  const [session, setSession] = useState<StoredSession | null>(null);
  const [myHistory, setMyHistory] = useState<WeightHistoryItem[]>([]);
  const [familyData, setFamilyData] = useState<FamilyWeightHistoryResponse | null>(null);
  const [weeklySummary, setWeeklySummary] = useState<WeeklyEvolutionSummaryResponse | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filtro de membros selecionados para o gráfico: ["ALL"] ou array de IDs
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(["ALL"]);

  // Aba ativa na Retrospectiva Semanal: "FAMILY" ou ID do membro selecionado
  const [retrospectiveTab, setRetrospectiveTab] = useState<string>("FAMILY");

  // Hover Tooltip no SVG
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    memberName: string;
    weight: number;
    date: string;
    delta?: number;
  } | null>(null);

  // Registro Rápido (Card de Segunda-feira)
  const [quickWeight, setQuickWeight] = useState("");
  const [savingWeight, setSavingWeight] = useState(false);

  // Modal de Registro de Peso
  const [modalOpen, setModalOpen] = useState(false);
  const [modalWeight, setModalWeight] = useState("");
  const [modalDate, setModalDate] = useState(() => new Date().toISOString().slice(0, 10));

  const loadData = useCallback(async (isInitial = true) => {
    try {
      if (isInitial) setLoading(true);
      setError("");
      const validSession = await getValidSession();
      if (!validSession) {
        setSession(null);
        setLoading(false);
        return;
      }
      setSession(validSession);

      // 1. Carrega histórico pessoal
      const myHist = await listWeightHistory(validSession.accessToken);
      setMyHistory(myHist);

      // 2. Se estiver em família, carrega histórico da família
      if (activeFamily && !isPersonal) {
        try {
          const famHist = await getFamilyWeightHistory(validSession.accessToken, activeFamily.id);
          setFamilyData(famHist);
        } catch (err) {
          console.warn("Não foi possível carregar histórico da família:", err);
          setFamilyData(null);
        }
      } else {
        setFamilyData(null);
      }

      // 3. Carrega resumo semanal de evolução
      try {
        setSummaryLoading(true);
        const sum = await getWeeklyEvolutionSummary(
          validSession.accessToken,
          activeFamily && !isPersonal ? activeFamily.id : undefined
        );
        setWeeklySummary(sum);
      } catch (err) {
        console.warn("Resumo semanal não pôde ser gerado:", err);
      } finally {
        setSummaryLoading(false);
      }
    } catch (err) {
      if (handleInvalidSession(err, () => router.replace("/login"))) return;
      setError(getLocalizedApiError(err, errors, t("error")));
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [activeFamily, isPersonal, errors, router, t]);

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  // Lista consolidada de membros (ou apenas o usuário atual)
  const membersList = useMemo(() => {
    if (familyData && familyData.members.length > 0 && !isPersonal) {
      return familyData.members;
    }
    if (session) {
      const currentWeight = myHistory.length > 0 ? Number(myHistory[0].weightKg) : null;
      const me: FamilyMemberEvolutionDto = {
        userId: session.user.id,
        userName: session.user.name,
        userEmail: session.user.email,
        currentWeight,
        role: "TITULAR",
        history: myHistory,
      };
      return [me];
    }
    return [];
  }, [familyData, myHistory, session, isPersonal]);

  // Atribui cor a cada membro de forma determinística
  const memberColorMap = useMemo(() => {
    const map = new Map<string, typeof MEMBER_COLORS[0]>();
    membersList.forEach((m, idx) => {
      map.set(m.userId, MEMBER_COLORS[idx % MEMBER_COLORS.length]);
    });
    return map;
  }, [membersList]);

  // Membros visíveis no gráfico
  const visibleMembers = useMemo(() => {
    if (selectedMemberIds.includes("ALL")) {
      return membersList;
    }
    return membersList.filter((m) => selectedMemberIds.includes(m.userId));
  }, [membersList, selectedMemberIds]);

  const handleToggleMember = (userId: string) => {
    if (userId === "ALL") {
      setSelectedMemberIds(["ALL"]);
      return;
    }

    if (selectedMemberIds.includes("ALL")) {
      setSelectedMemberIds([userId]);
      return;
    }

    if (selectedMemberIds.includes(userId)) {
      const next = selectedMemberIds.filter((id) => id !== userId);
      if (next.length === 0) {
        setSelectedMemberIds(["ALL"]);
      } else {
        setSelectedMemberIds(next);
      }
    } else {
      const next = [...selectedMemberIds, userId];
      if (next.length === membersList.length) {
        setSelectedMemberIds(["ALL"]);
      } else {
        setSelectedMemberIds(next);
      }
    }
  };

  // Verificações de Segunda-feira e periodicidade
  const isMonday = new Date().getDay() === 1;
  const hasWeighedToday = useMemo(() => {
    if (myHistory.length === 0) return false;
    const latest = new Date(myHistory[0].recordedAt);
    const today = new Date();
    return (
      latest.getDate() === today.getDate() &&
      latest.getMonth() === today.getMonth() &&
      latest.getFullYear() === today.getFullYear()
    );
  }, [myHistory]);

  const daysSinceLatest = useMemo(() => {
    if (myHistory.length === 0) return 999;
    const latest = new Date(myHistory[0].recordedAt);
    return Math.floor((Date.now() - latest.getTime()) / 86_400_000);
  }, [myHistory]);

  const showMondayReminder = (isMonday && !hasWeighedToday) || daysSinceLatest >= 7;

  // Registro Rápido
  const handleQuickWeightSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const val = parseFloat(quickWeight.replace(",", "."));
    if (isNaN(val) || val <= 0) {
      toast.error("Informe um peso válido (ex: 85.5)");
      return;
    }

    try {
      setSavingWeight(true);
      const validSession = await getValidSession();
      if (!validSession) return;

      await createWeightRecord(validSession.accessToken, {
        weightKg: val,
        recordedAt: new Date().toISOString(),
      });

      toast.success("Peso anotado com sucesso no caderno! Boa semana!");
      setQuickWeight("");
      await loadData(false);
    } catch (err) {
      toast.error(getLocalizedApiError(err, errors, "Não foi possível registrar o peso."));
    } finally {
      setSavingWeight(false);
    }
  };

  // Registro pelo Modal Completo
  const handleModalSaveWeight = async (e: FormEvent) => {
    e.preventDefault();
    const val = parseFloat(modalWeight.replace(",", "."));
    if (isNaN(val) || val <= 0) {
      toast.error("Informe um peso válido (ex: 85.5)");
      return;
    }

    try {
      setSavingWeight(true);
      const validSession = await getValidSession();
      if (!validSession) return;

      const dateObj = modalDate ? new Date(`${modalDate}T12:00:00`) : new Date();

      await createWeightRecord(validSession.accessToken, {
        weightKg: val,
        recordedAt: dateObj.toISOString(),
      });

      toast.success("Novo registro de peso adicionado!");
      setModalOpen(false);
      setModalWeight("");
      await loadData(false);
    } catch (err) {
      toast.error(getLocalizedApiError(err, errors, "Não foi possível registrar o peso."));
    } finally {
      setSavingWeight(false);
    }
  };

  // Atualização sob demanda da Análise IA
  const handleRefreshSummary = async () => {
    try {
      setSummaryLoading(true);
      const validSession = await getValidSession();
      if (!validSession) return;
      const sum = await getWeeklyEvolutionSummary(
        validSession.accessToken,
        activeFamily && !isPersonal ? activeFamily.id : undefined
      );
      setWeeklySummary(sum);
      toast.success("Retrospectiva da semana atualizada com sucesso!");
    } catch (err) {
      toast.error("Não foi possível atualizar a análise da semana.");
    } finally {
      setSummaryLoading(false);
    }
  };

  // Métricas do Topo
  const current = myHistory[0];
  const previous = myHistory[1];
  const delta = current && previous ? Number(current.weightKg) - Number(previous.weightKg) : null;

  // Cálculos do Gráfico SVG com timeline temporal precisa (sem empilhar no mesmo dia)
  const chartData = useMemo(() => {
    // 1. Coleta todos os registros individuais de todos os membros visíveis
    type RawRecord = {
      id: string;
      userId: string;
      userName: string;
      weight: number;
      timestamp: number;
      dateLabel: string;
      timeLabel: string;
      fullDate: string;
    };

    const allRecords: RawRecord[] = [];

    visibleMembers.forEach((member) => {
      member.history.forEach((h) => {
        const d = new Date(h.recordedAt);
        const dayStr = d.toLocaleDateString(locale, { day: "2-digit", month: "2-digit" });
        const timeStr = d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
        allRecords.push({
          id: h.id,
          userId: member.userId,
          userName: member.userName,
          weight: Number(h.weightKg),
          timestamp: d.getTime(),
          dateLabel: dayStr,
          timeLabel: timeStr,
          fullDate: `${dayStr} às ${timeStr}`,
        });
      });
    });

    if (allRecords.length === 0) {
      return null;
    }

    // Ordenar cronologicamente
    allRecords.sort((a, b) => a.timestamp - b.timestamp);

    // Identificar registros no mesmo dia para desambiguação no rótulo X
    const dayCounts = new Map<string, number>();
    allRecords.forEach((r) => {
      dayCounts.set(r.dateLabel, (dayCounts.get(r.dateLabel) || 0) + 1);
    });

    // Criar pontos de tempo únicos
    // Mapeamos os marcos no tempo garantindo que pontos no mesmo dia não colidam
    const uniqueTimestamps = Array.from(new Set(allRecords.map((r) => r.timestamp))).sort((a, b) => a - b);

    // Limites de peso com margem
    const weights = allRecords.map((r) => r.weight);
    const minW = Math.max(0, Math.floor(Math.min(...weights) - 2));
    const maxW = Math.ceil(Math.max(...weights) + 2);
    const weightRange = Math.max(4, maxW - minW);

    // Dimensões SVG
    const svgWidth = 720;
    const svgHeight = 280;
    const padLeft = 60;
    const padRight = 45;
    const padTop = 35;
    const padBottom = 45;
    const plotWidth = svgWidth - padLeft - padRight;
    const plotHeight = svgHeight - padTop - padBottom;

    const getY = (w: number) => {
      const frac = (w - minW) / weightRange;
      return padTop + plotHeight - frac * plotHeight;
    };

    const getX = (ts: number) => {
      if (uniqueTimestamps.length <= 1) return padLeft + plotWidth / 2;
      const idx = uniqueTimestamps.indexOf(ts);
      return padLeft + (idx / (uniqueTimestamps.length - 1)) * plotWidth;
    };

    // Linhas de Grade Y (4 linhas)
    const ySteps = 4;
    const gridLines = Array.from({ length: ySteps + 1 }, (_, i) => {
      const w = minW + (weightRange / ySteps) * i;
      return {
        weight: Math.round(w * 10) / 10,
        y: getY(w),
      };
    });

    // Labels do Eixo X
    const xLabels = uniqueTimestamps.map((ts) => {
      const sample = allRecords.find((r) => r.timestamp === ts);
      const isMulti = sample && (dayCounts.get(sample.dateLabel) || 0) > 1;
      return {
        x: getX(ts),
        label: isMulti ? `${sample?.dateLabel} ${sample?.timeLabel}` : (sample?.dateLabel || ""),
      };
    });

    // Séries de cada membro visível
    const memberSeries = visibleMembers
      .map((member) => {
        const color = memberColorMap.get(member.userId) || MEMBER_COLORS[0];
        const mRecords = allRecords
          .filter((r) => r.userId === member.userId)
          .sort((a, b) => a.timestamp - b.timestamp);

        if (mRecords.length === 0) return null;

        const points = mRecords.map((rec, idx) => {
          const prev = idx > 0 ? mRecords[idx - 1] : null;
          const deltaVal = prev ? rec.weight - prev.weight : undefined;
          return {
            x: getX(rec.timestamp),
            y: getY(rec.weight),
            weight: rec.weight,
            dateKey: rec.dateLabel,
            fullDate: rec.fullDate,
            delta: deltaVal,
            memberName: member.userName,
          };
        });

        // Construir path SVG suave
        let pathD = "";
        points.forEach((p, idx) => {
          if (idx === 0) {
            pathD += `M ${p.x} ${p.y}`;
          } else {
            const prev = points[idx - 1];
            const cx = (prev.x + p.x) / 2;
            pathD += ` C ${cx} ${prev.y}, ${cx} ${p.y}, ${p.x} ${p.y}`;
          }
        });

        return {
          member,
          color,
          points,
          pathD,
        };
      })
      .filter(Boolean);

    return {
      svgWidth,
      svgHeight,
      padLeft,
      padRight,
      padTop,
      padBottom,
      gridLines,
      xLabels,
      memberSeries,
    };
  }, [visibleMembers, memberColorMap, locale]);

  // Posição segura do Tooltip dentro do SVG (sem overflow nem clipping)
  const tooltipBounds = useMemo(() => {
    if (!tooltip || !chartData) return null;
    const boxW = 145;
    const boxH = 68;

    // Garante que o tooltip nunca ultrapasse as laterais do gráfico
    let tipX = tooltip.x - boxW / 2;
    if (tipX + boxW > chartData.svgWidth - 10) {
      tipX = chartData.svgWidth - boxW - 10;
    }
    if (tipX < 10) {
      tipX = 10;
    }

    // Se o ponto estiver na metade superior, mostra o tooltip abaixo do ponto; se não, acima
    const tipY = tooltip.y < 105 ? tooltip.y + 14 : tooltip.y - boxH - 12;

    return { x: tipX, y: tipY, width: boxW, height: boxH };
  }, [tooltip, chartData]);

  if (!session) {
    return (
      <AppShell>
        <main className="mx-auto max-w-xl px-5 py-10">
          <PaperCard tape="green">
            <h1 className="font-display text-4xl font-bold text-primary">{t("guestTitle")}</h1>
            <p className="mt-3 text-sm leading-6 text-on-surface-variant">
              {t("guestDescription")}
            </p>
            <ActionLink className="mt-5" href="/login">
              {t("login")}
            </ActionLink>
          </PaperCard>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-7">
        {/* Cabeçalho */}
        <NotebookPageHeader
          action={
            <ActionButton onClick={() => setModalOpen(true)} variant="primary">
              <span className="inline-flex items-center gap-1.5"><Plus className="w-3.5 h-3.5 stroke-[2]" /> Registrar Peso</span>
            </ActionButton>
          }
          eyebrow={activeFamily && !isPersonal ? `Família ${activeFamily.name} • Evolução` : "Minha Evolução Pessoal"}
          subtitle="Acompanhe a balança de toda a casa, compare o progresso e veja o resumo inteligente da semana."
          title="Histórico de Peso & Evolução"
        />

        {/* 1. Card Especial de Segunda-Feira / Lembrete de Pesagem */}
        {showMondayReminder && (
          <div className="relative overflow-hidden rounded-3xl border-2 border-amber-300 dark:border-amber-800 bg-amber-50/90 dark:bg-amber-950/30 p-5 sm:p-6 shadow-paper transition-all">
            <span aria-hidden="true" className="washi-tape washi-orange" />
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-amber-500 text-white px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider shadow-xs">
                    {isMonday ? "Segunda-Feira • Dia Oficial" : "Lembrete de Pesagem"}
                  </span>
                  <span className="text-xs font-semibold text-amber-900/80 dark:text-amber-300">
                    {isMonday ? "Comece a semana no ritmo certo!" : "Atualize seu peso da semana"}
                  </span>
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-amber-950 dark:text-amber-100">
                  {isMonday
                    ? "Que tal registrar seu peso de hoje?"
                    : "Já faz mais de 7 dias desde a última pesagem"}
                </h3>
                <p className="text-xs text-amber-900/80 dark:text-amber-300/80 max-w-xl leading-relaxed">
                  Pesar-se toda segunda-feira de manhã é a melhor prática para acompanhar a tendência real sem a variação natural de água ao longo da semana.
                </p>
              </div>

              {/* Registro Rápido */}
              <form onSubmit={handleQuickWeightSubmit} className="flex items-center gap-2.5 shrink-0 self-start lg:self-auto">
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="30"
                    max="300"
                    placeholder={current ? String(current.weightKg) : "75.0"}
                    value={quickWeight}
                    onChange={(e) => setQuickWeight(e.target.value)}
                    className="w-28 rounded-2xl border-2 border-amber-400 dark:border-amber-700 bg-white dark:bg-stone-900 px-3 py-2 text-base font-extrabold text-stone-900 dark:text-stone-100 text-center focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
                    required
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                    kg
                  </span>
                </div>
                <ActionButton type="submit" disabled={savingWeight} className="whitespace-nowrap py-2.5 px-4">
                  {savingWeight ? "Salvando..." : "Salvar Peso"}
                </ActionButton>
              </form>
            </div>
          </div>
        )}

        {error && <StatusMessage variant="error">{error}</StatusMessage>}

        {/* 2. Cards de Métricas Principais */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <PaperCard tape="orange" className="p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-tertiary">
              {activeFamily && !isPersonal ? "Meu Peso Atual" : "Peso Atual"}
            </span>
            <p className="mt-2 font-display text-4xl font-extrabold text-primary">
              {current ? `${current.weightKg} kg` : "--"}
            </p>
            <p className="mt-1 text-xs text-on-surface-variant">
              {current
                ? `Registrado em ${new Date(current.recordedAt).toLocaleDateString(locale)}`
                : "Nenhum peso cadastrado"}
            </p>
          </PaperCard>

          <PaperCard tape="green" className="p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-tertiary">
              Peso Anterior
            </span>
            <p className="mt-2 font-display text-4xl font-extrabold text-secondary">
              {previous ? `${previous.weightKg} kg` : "--"}
            </p>
            <p className="mt-1 text-xs text-on-surface-variant">
              {previous
                ? `Em ${new Date(previous.recordedAt).toLocaleDateString(locale)}`
                : "Sem registro anterior"}
            </p>
          </PaperCard>

          <PaperCard tape="brown" className="p-5 sm:col-span-2 lg:col-span-1">
            <span className="text-xs font-bold uppercase tracking-wider text-tertiary">
              Variação Recente
            </span>
            <p className={`mt-2 font-display text-4xl font-extrabold ${
              delta == null
                ? "text-on-surface-variant"
                : delta < 0
                ? "text-emerald-600 dark:text-emerald-400"
                : delta > 0
                ? "text-amber-600 dark:text-amber-400"
                : "text-primary"
            }`}>
              {delta == null ? "--" : `${delta > 0 ? "+" : ""}${delta.toFixed(2)} kg`}
            </p>
            <p className="mt-1 text-xs text-on-surface-variant">
              {delta == null
                ? "Necessário 2 registros para calcular"
                : delta < 0
                ? "Redução em relação à pesagem anterior"
                : delta > 0
                ? "Aumento em relação à pesagem anterior"
                : "Peso mantido e estável"}
            </p>
          </PaperCard>
        </section>

        {/* 3. Seção do Gráfico com Filtro de Membros da Família */}
        <section className="space-y-4">
          {/* Barra de Filtro de Membros da Família */}
          {membersList.length > 1 && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-surface-variant/80 bg-surface-container/60 p-3 shadow-2xs backdrop-blur-xs">
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Exibir no Gráfico:
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Botão Ver Todos */}
                <button
                  type="button"
                  onClick={() => handleToggleMember("ALL")}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    selectedMemberIds.includes("ALL") || selectedMemberIds.length === membersList.length
                      ? "bg-primary text-on-primary shadow-xs"
                      : "bg-surface text-on-surface-variant hover:bg-surface-variant/40"
                  }`}
                >
                  <Users className="w-4 h-4 text-amber-800 dark:text-amber-300" />
                  <span>Toda a Família ({membersList.length})</span>
                </button>

                {/* Chips de Cada Membro */}
                {membersList.map((m) => {
                  const color = memberColorMap.get(m.userId) || MEMBER_COLORS[0];
                  const isSelected =
                    selectedMemberIds.includes("ALL") || selectedMemberIds.includes(m.userId);
                  const isMe = session?.user.id === m.userId;

                  return (
                    <button
                      key={m.userId}
                      type="button"
                      onClick={() => handleToggleMember(m.userId)}
                      className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer border ${
                        isSelected
                          ? `${color.lightBg} ${color.text} ${color.border} shadow-2xs`
                          : "bg-surface text-stone-400 border-surface-variant hover:bg-surface-variant/20"
                      }`}
                    >
                      <span className={`h-2.5 w-2.5 rounded-full ${color.bg}`} />
                      <span>{m.userName.split(" ")[0]} {isMe && "(Você)"}</span>
                      {m.currentWeight && (
                        <span className="text-[10px] opacity-75">
                          • {m.currentWeight}kg
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Container do Gráfico e Lista Lateral de Registros */}
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            {/* Gráfico SVG Artesanal com Tooltip Integrado */}
            <PaperCard ink tape="green" className="p-5 sm:p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-surface-variant/60 pb-3 mb-4">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-tertiary dark:text-amber-200">
                      Curva de Evolução
                    </h2>
                    <p className="text-xs text-on-surface-variant">
                      {selectedMemberIds.includes("ALL") || selectedMemberIds.length === membersList.length
                        ? `Comparando ${visibleMembers.length} membro(s) da família`
                        : `Exibindo ${visibleMembers.map((m) => m.userName.split(" ")[0]).join(", ")}`}
                    </p>
                  </div>

                  {/* Legenda Resumida */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {visibleMembers.map((m) => {
                      const col = memberColorMap.get(m.userId) || MEMBER_COLORS[0];
                      return (
                        <div key={m.userId} className="flex items-center gap-1 text-[11px] font-bold">
                          <span className={`h-2 w-2 rounded-full ${col.bg}`} />
                          <span className="text-on-surface">{m.userName.split(" ")[0]}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* SVG Render */}
                {loading ? (
                  <div className="h-64 flex items-center justify-center text-sm text-on-surface-variant">
                    Carregando dados da balança...
                  </div>
                ) : !chartData || chartData.memberSeries.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-2 border-2 border-dashed border-surface-variant rounded-2xl">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100/70 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900/60 shadow-2xs"><Scale className="w-7 h-7 stroke-[1.75]" /></div>
                    <h3 className="font-display text-base font-bold text-on-surface">
                      Nenhum peso registrado para os membros selecionados
                    </h3>
                    <p className="text-xs text-on-surface-variant max-w-sm">
                      Use o botão &quot;Registrar Peso&quot; no topo para adicionar o primeiro registro de pesagem.
                    </p>
                    <ActionButton onClick={() => setModalOpen(true)} className="mt-2 text-xs">
                      Registrar Primeiro Peso
                    </ActionButton>
                  </div>
                ) : (
                  <div className="relative w-full py-2">
                    <svg
                      viewBox={`0 0 ${chartData.svgWidth} ${chartData.svgHeight}`}
                      className="w-full h-auto select-none"
                      onMouseLeave={() => setTooltip(null)}
                    >
                      {/* Linhas de Grade Y e Labels */}
                      {chartData.gridLines.map((line, idx) => (
                        <g key={idx}>
                          <line
                            x1={chartData.padLeft}
                            y1={line.y}
                            x2={chartData.svgWidth - chartData.padRight}
                            y2={line.y}
                            stroke="currentColor"
                            strokeOpacity={idx === 0 ? "0.3" : "0.15"}
                            strokeDasharray={idx === 0 ? "" : "3,3"}
                            className="text-stone-400 dark:text-stone-600"
                          />
                          <text
                            x={chartData.padLeft - 10}
                            y={line.y + 3.5}
                            textAnchor="end"
                            fontSize="10"
                            fontWeight="bold"
                            className="fill-stone-500 dark:fill-stone-400 font-mono"
                          >
                            {line.weight} kg
                          </text>
                        </g>
                      ))}

                      {/* Labels do Eixo X (Datas e Horários) */}
                      {chartData.xLabels.map((lbl, idx) => (
                        <g key={idx}>
                          <line
                            x1={lbl.x}
                            y1={chartData.svgHeight - chartData.padBottom}
                            x2={lbl.x}
                            y2={chartData.svgHeight - chartData.padBottom + 4}
                            stroke="currentColor"
                            className="text-stone-400 dark:text-stone-600"
                          />
                          <text
                            x={lbl.x}
                            y={chartData.svgHeight - chartData.padBottom + 16}
                            textAnchor="middle"
                            fontSize="9"
                            fontWeight="bold"
                            className="fill-stone-500 dark:fill-stone-400 font-mono"
                          >
                            {lbl.label}
                          </text>
                        </g>
                      ))}

                      {/* Séries de Cada Membro */}
                      {chartData.memberSeries.map((series) => {
                        if (!series) return null;
                        return (
                          <g key={series.member.userId}>
                            {/* Linha Curva */}
                            <path
                              d={series.pathD}
                              fill="none"
                              stroke={series.color.hex}
                              strokeWidth="3.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="transition-all duration-300 drop-shadow-xs"
                            />

                            {/* Pontos Clicáveis com Hit Area de 20px (Zero Flickering) */}
                            {series.points.map((pt, pIdx) => {
                              const isHovered = tooltip?.x === pt.x && tooltip?.y === pt.y;
                              return (
                                <g key={pIdx}>
                                  {/* Hit target transparente amplo para manter hover estável */}
                                  <circle
                                    cx={pt.x}
                                    cy={pt.y}
                                    r="18"
                                    fill="transparent"
                                    className="cursor-pointer"
                                    onMouseEnter={() => {
                                      setTooltip({
                                        x: pt.x,
                                        y: pt.y,
                                        memberName: pt.memberName,
                                        weight: pt.weight,
                                        date: pt.fullDate,
                                        delta: pt.delta,
                                      });
                                    }}
                                  />
                                  {/* Ponto Visual */}
                                  <circle
                                    cx={pt.x}
                                    cy={pt.y}
                                    r={isHovered ? 7.5 : 5}
                                    fill={series.color.hex}
                                    stroke="#ffffff"
                                    strokeWidth={isHovered ? 3 : 2}
                                    className="pointer-events-none transition-all duration-150 drop-shadow-xs"
                                  />
                                </g>
                              );
                            })}
                          </g>
                        );
                      })}

                      {/* Tooltip Renderizado no SVG (Imune a corte por overflow e sem piscar) */}
                      {tooltipBounds && tooltip && (
                        <g
                          className="pointer-events-none select-none"
                          transform={`translate(${tooltipBounds.x}, ${tooltipBounds.y})`}
                        >
                          {/* Fundo do Tooltip */}
                          <rect
                            width={tooltipBounds.width}
                            height={tooltipBounds.height}
                            rx="10"
                            ry="10"
                            fill="#1c1917"
                            stroke="#44403c"
                            strokeWidth="1.5"
                            className="drop-shadow-xl"
                          />
                          {/* Nome do Membro */}
                          <text x="12" y="18" fill="#fbbf24" fontSize="11" fontWeight="bold">
                            {tooltip.memberName}
                          </text>
                          {/* Peso em Destaque */}
                          <text
                            x="12"
                            y="38"
                            fill="#ffffff"
                            fontSize="15"
                            fontWeight="900"
                            fontFamily="monospace"
                          >
                            {tooltip.weight} kg
                          </text>
                          {/* Variação Recente */}
                          {tooltip.delta !== undefined && (
                            <text
                              x="85"
                              y="38"
                              fill={tooltip.delta < 0 ? "#34d399" : tooltip.delta > 0 ? "#fbbf24" : "#a8a29e"}
                              fontSize="10"
                              fontWeight="bold"
                            >
                              {tooltip.delta < 0
                                ? `-${Math.abs(tooltip.delta).toFixed(1)}kg`
                                : tooltip.delta > 0
                                ? `+${tooltip.delta.toFixed(1)}kg`
                                : "Estável"}
                            </text>
                          )}
                          {/* Data e Hora */}
                          <text x="12" y="55" fill="#a8a29e" fontSize="9" fontWeight="medium">
                            {tooltip.date}
                          </text>
                        </g>
                      )}
                    </svg>
                  </div>
                )}
              </div>

              {/* Dica de Rodapé */}
              <div className="mt-4 pt-3 border-t border-stone-200/60 dark:border-stone-800 text-[11px] text-on-surface-variant flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5"><Lightbulb className="w-3.5 h-3.5 text-amber-700" /> Dica: Passe o cursor sobre os pontos para ver data exata e variação.</span>
                <span className="font-semibold text-primary">Pesagem recomendada: Segundas-feiras</span>
              </div>
            </PaperCard>

            {/* Lista Lateral de Registros */}
            <PaperCard ink tape="orange" className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-surface-variant/60 pb-3 mb-4">
                  <h3 className="font-display text-xl font-bold text-tertiary dark:text-amber-200">
                    Últimos Registros
                  </h3>
                  <button
                    type="button"
                    onClick={() => setModalOpen(true)}
                    className="text-xs font-bold text-primary hover:underline cursor-pointer"
                  >
                    + Adicionar
                  </button>
                </div>

                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {myHistory.length > 0 ? (
                    myHistory.slice(0, 7).map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-stone-200 dark:border-stone-700/80 bg-white dark:bg-[#25201c] p-3 shadow-2xs flex items-center justify-between"
                      >
                        <div>
                          <p className="font-display text-xl font-extrabold text-primary">
                            {item.weightKg} kg
                          </p>
                          <p className="text-[11px] text-on-surface-variant">
                            {new Date(item.recordedAt).toLocaleString(locale, {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <Scale className="w-3.5 h-3.5 text-stone-400" />
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border-2 border-dashed border-stone-200 dark:border-stone-800 p-6 text-center text-xs text-on-surface-variant">
                      Nenhum peso registrado ainda.
                    </div>
                  )}
                </div>
              </div>

              <ActionButton onClick={() => setModalOpen(true)} className="w-full mt-4 text-xs py-2">
                <span className="inline-flex items-center gap-1.5"><Plus className="w-3.5 h-3.5 stroke-[2]" /> Novo Registro de Peso</span>
              </ActionButton>
            </PaperCard>
          </div>
        </section>

        {/* 4. BLOCO DA RETROSPECTIVA: SEPARAÇÃO NÍTIDA (PONTOS EM FAMÍLIA VS PONTOS INDIVIDUAIS) */}
        <section className="space-y-4">
          <PaperCard ink tape="brown" className="p-6">
            {/* Header do Resumo Semanal */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/70 dark:border-stone-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-amber-800 dark:text-amber-300 stroke-[1.75]" />
                  <h3 className="font-display text-2xl font-bold text-on-surface">
                    Retrospectiva Semanal & Evolução
                  </h3>
                </div>
                <p className="text-xs text-on-surface-variant">
                  {weeklySummary ? `Período analisado: ${weeklySummary.periodLabel}` : "Resumo inteligente dos hábitos, treinos e balança"}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {weeklySummary && (
                  <span className={`rounded-full px-3 py-1 text-xs font-bold border ${
                    weeklySummary.overallStatus === "POSITIVO"
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                      : weeklySummary.overallStatus === "MODERADO"
                      ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                      : "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800"
                  }`}>
                    {weeklySummary.overallStatus === "POSITIVO"
                      ? "✨ Excelente Ritmo"
                      : weeklySummary.overallStatus === "MODERADO"
                      ? "⚡ Bom Ritmo"
                      : "⚠️ Requer Atenção"}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleRefreshSummary}
                  disabled={summaryLoading}
                  className="rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-1.5 text-xs font-bold text-stone-700 dark:text-stone-200 hover:border-primary transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
                  title="Atualizar análise inteligente com a IA"
                >
                  {summaryLoading ? "Atualizando..." : "Atualizar Análise"}
                </button>
              </div>
            </div>

            {/* Alternador de Âmbito: Família & Lar vs Membros Individuais */}
            {weeklySummary && (
              <div className="mt-4 flex flex-wrap items-center gap-2 border-b border-stone-200/60 dark:border-stone-800/80 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mr-1">
                  Ver Análise de:
                </span>

                {/* Aba Família & Lar */}
                <button
                  type="button"
                  onClick={() => setRetrospectiveTab("FAMILY")}
                  className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    retrospectiveTab === "FAMILY"
                      ? "bg-primary text-on-primary shadow-xs scale-102"
                      : "bg-surface-container text-on-surface-variant hover:bg-surface-variant/40"
                  }`}
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Pontos da Família & Lar</span>
                </button>

                {/* Abas Individuais para Cada Membro */}
                {(weeklySummary.memberBreakdown || []).map((m) => {
                  const isTabActive = retrospectiveTab === m.userId;
                  const isMe = session?.user.id === m.userId;
                  return (
                    <button
                      key={m.userId}
                      type="button"
                      onClick={() => setRetrospectiveTab(m.userId)}
                      className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer border ${
                        isTabActive
                          ? "bg-amber-500 text-white border-amber-600 shadow-xs scale-102"
                          : "bg-surface text-stone-600 dark:text-stone-300 border-surface-variant hover:bg-surface-variant/30"
                      }`}
                    >
                      <span>👤</span>
                      <span>{m.userName.split(" ")[0]} {isMe && "(Você)"}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Conteúdo da Retrospectiva Dinâmica */}
            {summaryLoading ? (
              <div className="py-12 text-center text-sm text-on-surface-variant">
                Gerando resumo inteligente da semana...
              </div>
            ) : weeklySummary ? (
              <div className="mt-5 space-y-6">
                {/* 1. SE RETROSPECTIVA ESTIVER NA ABA FAMÍLIA & LAR */}
                {retrospectiveTab === "FAMILY" && (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    {/* Headline Coletiva */}
                    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="rounded-md bg-primary/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                            Escopo Familiar
                          </span>
                          <span className="text-xs font-bold text-on-surface">
                            {weeklySummary.familyScope?.familyName || "Rotina da Casa"}
                          </span>
                        </div>
                        <p className="font-display text-base sm:text-lg font-bold text-primary">
                          “{weeklySummary.headline}”
                        </p>
                      </div>
                      <div className="shrink-0 text-xs font-semibold text-on-surface-variant">
                        <span className="inline-flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600" /> {weeklySummary.familyScope?.collectiveActivitiesCount || weeklySummary.activitiesCompleted} hábitos e acordos concluídos</span>
                      </div>
                    </div>

                    {/* 3 Colunas da Família */}
                    <div className="grid gap-5 md:grid-cols-3">
                      {/* O que deu certo na casa */}
                      <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-white text-xs font-black shadow-xs">
                            ✓
                          </span>
                          <h4 className="font-display text-base font-bold text-emerald-950 dark:text-emerald-200">
                            Na Família: O Que Deu Certo
                          </h4>
                        </div>
                        <ul className="space-y-2 text-xs text-emerald-900/90 dark:text-emerald-300 leading-relaxed">
                          {(weeklySummary.familyScope?.wentWell || weeklySummary.wentWell).map((item, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-emerald-600 font-bold shrink-0 mt-0.5">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* O que faltou na casa */}
                      <div className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-white text-xs font-black shadow-xs">
                            !
                          </span>
                          <h4 className="font-display text-base font-bold text-amber-950 dark:text-amber-200">
                            Na Família: Pontos de Atenção
                          </h4>
                        </div>
                        <ul className="space-y-2 text-xs text-amber-900/90 dark:text-amber-300 leading-relaxed">
                          {(weeklySummary.familyScope?.missedOrAttention || weeklySummary.missedOrAttention).map((item, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-amber-600 font-bold shrink-0 mt-0.5">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Melhorias da casa */}
                      <div className="rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500 text-white text-xs font-black shadow-xs">
                            ↗
                          </span>
                          <h4 className="font-display text-base font-bold text-blue-950 dark:text-blue-200">
                            Na Família: Como Melhorar
                          </h4>
                        </div>
                        <ul className="space-y-2 text-xs text-blue-900/90 dark:text-blue-300 leading-relaxed">
                          {(weeklySummary.familyScope?.recommendations || weeklySummary.recommendations).map((item, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-blue-600 font-bold shrink-0 mt-0.5">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. SE RETROSPECTIVA ESTIVER NA ABA DE UM MEMBRO INDIVIDUAL */}
                {retrospectiveTab !== "FAMILY" && (() => {
                  const member = (weeklySummary.memberBreakdown || []).find((m) => m.userId === retrospectiveTab)
                    || weeklySummary.memberBreakdown?.[0];

                  if (!member) {
                    return (
                      <div className="py-6 text-center text-xs text-on-surface-variant">
                        Membro não encontrado para exibição individual.
                      </div>
                    );
                  }

                  const isMe = session?.user.id === member.userId;

                  return (
                    <div className="space-y-5 animate-in fade-in duration-200">
                      {/* Cartão de Identificação do Membro */}
                      <div className="rounded-2xl border border-amber-300 dark:border-amber-700 bg-amber-50/80 dark:bg-amber-950/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500 text-white font-display text-xl font-black shadow-sm">
                            {member.userName.charAt(0).toUpperCase()}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-display text-lg font-bold text-on-surface">
                                {member.userName} {isMe && "(Você)"}
                              </h4>
                              <span className="rounded-md bg-amber-200/80 dark:bg-amber-900/80 px-2 py-0.5 text-[10px] font-bold text-amber-900 dark:text-amber-200 uppercase">
                                {member.role}
                              </span>
                            </div>
                            <p className="text-xs text-on-surface-variant">
                              {member.currentWeight ? `Peso atual: ${member.currentWeight} kg` : "Sem peso recente registrado"}
                              {member.weightChange ? ` (${member.weightChange > 0 ? "+" : ""}${member.weightChange} kg)` : ""}
                            </p>
                          </div>
                        </div>

                        {/* Estatísticas Pessoais */}
                        <div className="flex items-center gap-2 flex-wrap text-xs font-semibold">
                          <span className="rounded-lg bg-surface px-2.5 py-1 border border-surface-variant">
                            <span className="inline-flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-emerald-600" /> {member.workoutsCount} treinos ({member.totalMinutes} min)</span>
                          </span>
                          <span className="rounded-lg bg-surface px-2.5 py-1 border border-surface-variant">
                            <span className="inline-flex items-center gap-1.5"><Flame className="w-3.5 h-3.5 text-amber-600" /> {member.caloriesBurned} kcal queimadas</span>
                          </span>
                        </div>
                      </div>

                      {/* 3 Colunas Individuais do Membro */}
                      <div className="grid gap-5 md:grid-cols-3">
                        {/* O que deu certo para o membro */}
                        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-white text-xs font-black shadow-xs">
                              ✓
                            </span>
                            <h4 className="font-display text-base font-bold text-emerald-950 dark:text-emerald-200">
                              O Que Deu Certo ({member.userName.split(" ")[0]})
                            </h4>
                          </div>
                          <ul className="space-y-2 text-xs text-emerald-900/90 dark:text-emerald-300 leading-relaxed">
                            {member.wentWell.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <span className="text-emerald-600 font-bold shrink-0 mt-0.5">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* O que faltou para o membro */}
                        <div className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-white text-xs font-black shadow-xs">
                              !
                            </span>
                            <h4 className="font-display text-base font-bold text-amber-950 dark:text-amber-200">
                              Pontos de Atenção ({member.userName.split(" ")[0]})
                            </h4>
                          </div>
                          <ul className="space-y-2 text-xs text-amber-900/90 dark:text-amber-300 leading-relaxed">
                            {member.missedOrAttention.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <span className="text-amber-600 font-bold shrink-0 mt-0.5">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Próximos passos para o membro */}
                        <div className="rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500 text-white text-xs font-black shadow-xs">
                              ↗
                            </span>
                            <h4 className="font-display text-base font-bold text-blue-950 dark:text-blue-200">
                              Como {member.userName.split(" ")[0]} Pode Melhorar
                            </h4>
                          </div>
                          <ul className="space-y-2 text-xs text-blue-900/90 dark:text-blue-300 leading-relaxed">
                            {member.recommendations.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <span className="text-blue-600 font-bold shrink-0 mt-0.5">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Métricas Consolidadas do Rodapé */}
                <div className="pt-4 border-t border-stone-200/60 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3 text-xs text-on-surface-variant font-medium">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-surface-container px-2.5 py-1 border border-surface-variant">
                      <Activity className="w-3.5 h-3.5 text-emerald-600 inline mr-1" /> {weeklySummary.workoutsCompleted} {weeklySummary.workoutsCompleted === 1 ? "treino total" : "treinos totais"} ({weeklySummary.totalWorkoutMinutes} min)
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-surface-container px-2.5 py-1 border border-surface-variant">
                      <Flame className="w-3.5 h-3.5 text-amber-600 inline mr-1" /> {weeklySummary.totalCaloriesBurned} kcal gastas pela casa
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-surface-container px-2.5 py-1 border border-surface-variant">
                      <Calendar className="w-3.5 h-3.5 text-stone-600 inline mr-1" /> {weeklySummary.activitiesCompleted} tarefas/hábitos da casa
                    </span>
                  </div>
                  <span className="font-serif italic text-stone-400">
                    Baseado nas rotinas, balança e treinos sincronizados no Gelu Menu.
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-on-surface-variant">
                Nenhum dado suficiente registrado nesta semana para gerar a retrospectiva.
              </div>
            )}
          </PaperCard>
        </section>

        {/* Modal de Registro de Peso */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={
        <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-bold">
          <Scale className="w-5 h-5 text-amber-800 dark:text-amber-400 stroke-[2]" />
          <span>Anotar Peso na Balança</span>
        </div>
      }
          subtitle="Mantenha o histórico contínuo da sua jornada."
          maxWidth="md"
        >
          <form onSubmit={handleModalSaveWeight} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1">
                Peso Corporal (kg)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="30"
                  max="300"
                  value={modalWeight}
                  onChange={(e) => setModalWeight(e.target.value)}
                  placeholder={current ? String(current.weightKg) : "75.0"}
                  className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#28221d] px-4 py-3 text-2xl font-black text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-stone-400">
                  kg
                </span>
              </div>
            </div>

            {/* Botões de Ajuste Rápido */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-stone-500">Ajuste rápido:</span>
              {[-1.0, -0.5, +0.5, +1.0].map((adj) => (
                <button
                  key={adj}
                  type="button"
                  onClick={() => {
                    const base = parseFloat(modalWeight || (current ? String(current.weightKg) : "75.0"));
                    setModalWeight((Math.round((base + adj) * 10) / 10).toFixed(1));
                  }}
                  className="rounded-lg bg-surface-container px-2 py-1 text-xs font-bold text-stone-700 dark:text-stone-300 hover:bg-surface-variant transition-colors cursor-pointer"
                >
                  {adj > 0 ? `+${adj}` : adj}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1">
                Data do Registro
              </label>
              <input
                type="date"
                value={modalDate}
                onChange={(e) => setModalDate(e.target.value)}
                className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#28221d] px-3 py-2 text-sm font-medium text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-stone-200 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-xl border border-stone-300 dark:border-stone-700 px-4 py-2 text-xs font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                Cancelar
              </button>
              <ActionButton type="submit" disabled={savingWeight} className="py-2 px-5 text-xs">
                {savingWeight ? "Salvando..." : "Confirmar Peso"}
              </ActionButton>
            </div>
          </form>
        </Modal>
      </main>
    </AppShell>
  );
}
