"use client";

import { useState } from "react";
import { PaperCard } from "@/components/ui/PaperCard";
import { ActionButton } from "@/components/ui/ActionButton";
import { Modal } from "@/components/ui/Modal";
import { TextInput, SelectField } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/Toast";
import { logWorkout } from "@/services/workouts";
import { estimateWorkoutCalories } from "@/services/ai";
import type { DailyWorkoutSummaryResponse } from "@/types/api";

const PRESET_WORKOUTS = [
  { title: "Musculação", category: "MUSCULACAO", caloriesPerHour: 450, defaultMinutes: 60, icon: "🏋️" },
  { title: "Corrida na Rua / Esteira", category: "CORRIDA", caloriesPerHour: 650, defaultMinutes: 45, icon: "🏃" },
  { title: "Caminhada com a Ellie", category: "CAMINHADA", caloriesPerHour: 280, defaultMinutes: 40, icon: "🐕" },
  { title: "Treino Funcional / HIIT", category: "FUNCIONAL", caloriesPerHour: 500, defaultMinutes: 45, icon: "⚡" },
  { title: "Ciclismo / Bike", category: "CICLISMO", caloriesPerHour: 480, defaultMinutes: 50, icon: "🚴" },
  { title: "Yoga / Alongamento", category: "YOGA", caloriesPerHour: 200, defaultMinutes: 30, icon: "🧘" },
];

const INTENSITY_OPTIONS = [
  { id: "LEVE", label: "Leve", icon: "🟢", desc: "Ritmo tranquilo, sem cansaço extremo" },
  { id: "MODERADO", label: "Moderado", icon: "🟡", desc: "Ritmo padrão constante" },
  { id: "INTENSO", label: "Intenso", icon: "🟠", desc: "Ritmo acelerado, suor e respiração forte" },
  { id: "MUITO_INTENSO", label: "Muito Intenso", icon: "🔴", desc: "HIIT, tiros, esforço máximo" },
];

export function WorkoutSection({
  accessToken,
  summary,
  onRefresh,
}: {
  accessToken: string;
  summary: DailyWorkoutSummaryResponse | null;
  onRefresh: () => void;
}) {
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("Musculação");
  const [category, setCategory] = useState("MUSCULACAO");
  const [intensity, setIntensity] = useState<"LEVE" | "MODERADO" | "INTENSO" | "MUITO_INTENSO">("MODERADO");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [caloriesBurned, setCaloriesBurned] = useState("450");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);

  const calculateCalorieEstimate = (minsStr: string, cat: string, inten: string) => {
    const mins = parseInt(minsStr, 10);
    const preset = PRESET_WORKOUTS.find((p) => p.category === cat);
    let rate = preset ? preset.caloriesPerHour : 450;
    if (inten === "LEVE") rate = Math.round(rate * 0.85);
    else if (inten === "INTENSO") rate = Math.round(rate * 1.25);
    else if (inten === "MUITO_INTENSO") rate = Math.round(rate * 1.45);

    if (!isNaN(mins) && mins > 0) {
      return String(Math.round((rate * mins) / 60));
    }
    return "0";
  };

  const handleSelectPreset = (p: typeof PRESET_WORKOUTS[0]) => {
    setTitle(p.title);
    setCategory(p.category);
    setDurationMinutes(String(p.defaultMinutes));
    setAiExplanation(null);
    setCaloriesBurned(calculateCalorieEstimate(String(p.defaultMinutes), p.category, intensity));
  };

  const handleDurationChange = (val: string) => {
    setDurationMinutes(val);
    setCaloriesBurned(calculateCalorieEstimate(val, category, intensity));
  };

  const handleIntensityChange = (newIntensity: "LEVE" | "MODERADO" | "INTENSO" | "MUITO_INTENSO") => {
    setIntensity(newIntensity);
    setCaloriesBurned(calculateCalorieEstimate(durationMinutes, category, newIntensity));
  };

  const handleEstimateWithAi = async () => {
    if (!title.trim()) {
      toast.error("Informe o nome da atividade para calcular.");
      return;
    }
    const mins = parseInt(durationMinutes, 10) || 45;

    try {
      setEstimating(true);
      const res = await estimateWorkoutCalories(accessToken, {
        activity: title.trim(),
        durationMinutes: mins,
        intensity,
      });

      setCaloriesBurned(String(res.estimatedCalories));
      setAiExplanation(res.explanation);
      toast.success(`✨ Estimado: ${res.estimatedCalories} kcal (${res.caloriesPerHour} kcal/h)!`);
    } catch {
      toast.error("Não foi possível consultar o assistente de treino no momento.");
    } finally {
      setEstimating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setSaving(true);
      await logWorkout(accessToken, {
        title: title.trim(),
        category,
        durationMinutes: parseInt(durationMinutes, 10) || 60,
        caloriesBurned: parseInt(caloriesBurned, 10) || 300,
        notes: notes.trim() || undefined,
      });

      toast.success("Treino confirmado com sucesso! Queima registrada! 🔥");
      setModalOpen(false);
      onRefresh();
    } catch {
      toast.error("Não foi possível salvar o registro de treino.");
    } finally {
      setSaving(false);
    }
  };

  const completed = summary?.completedToday ?? false;
  const totalBurned = summary?.totalCaloriesBurned ?? 0;
  const totalMinutes = summary?.totalDurationMinutes ?? 0;

  return (
    <>
      <PaperCard className="p-6 transition-all" tape="green">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 dark:border-stone-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">💪</span>
              <h3 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
                Treino & Atividade Física
              </h3>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              {completed
                ? `Hoje você já queimou ${totalBurned} kcal em ${totalMinutes} min de treino!`
                : "Registre sua atividade física de hoje para abater no saldo calórico diário."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              handleSelectPreset(PRESET_WORKOUTS[0]);
              setModalOpen(true);
            }}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold shadow-md transition-all cursor-pointer ${
              completed
                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
                : "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20 animate-pulse hover:animate-none"
            }`}
          >
            <span>{completed ? "＋ Registrar Outro Treino" : "⚡ Treinei Hoje!"}</span>
          </button>
        </div>

        {/* Status de Hoje */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-stone-50/70 dark:bg-[#25201c] p-3.5 text-center">
            <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
              Gasto em Treinos
            </span>
            <span className="text-2xl font-black text-amber-700 dark:text-amber-400 mt-1 block">
              -{totalBurned} <span className="text-xs font-bold text-stone-500">kcal</span>
            </span>
          </div>

          <div className="rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-stone-50/70 dark:bg-[#25201c] p-3.5 text-center">
            <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
              Tempo Ativo
            </span>
            <span className="text-2xl font-black text-stone-800 dark:text-stone-200 mt-1 block">
              {totalMinutes} <span className="text-xs font-bold text-stone-500">min</span>
            </span>
          </div>

          <div className="rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-stone-50/70 dark:bg-[#25201c] p-3.5 text-center">
            <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
              Status do Dia
            </span>
            <span
              className={`text-sm font-extrabold mt-2 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full ${
                completed
                  ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                  : "bg-stone-200/80 dark:bg-stone-800 text-stone-600 dark:text-stone-400"
              }`}
            >
              {completed ? "✅ Concluído" : "⏳ Pendente"}
            </span>
          </div>
        </div>

        {/* Lista de Treinos Registrados Hoje */}
        {summary && summary.logs && summary.logs.length > 0 && (
          <div className="mt-4 space-y-2 pt-3 border-t border-dashed border-stone-200 dark:border-stone-800">
            <h4 className="text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider">
              Atividades de Hoje:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {summary.logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between rounded-xl border border-stone-200 dark:border-stone-700/80 bg-white dark:bg-[#28221d] p-3 text-xs shadow-2xs"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-stone-900 dark:text-stone-100 truncate">
                      {log.title}
                    </p>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">
                      {log.durationMinutes} min • {log.userName}
                    </p>
                  </div>
                  <span className="rounded-lg bg-amber-100 dark:bg-amber-950/60 px-2 py-1 text-xs font-extrabold text-amber-900 dark:text-amber-300 shrink-0">
                    -{log.caloriesBurned} kcal
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </PaperCard>

      {/* Modal: Registrar Treino */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Registrar Treino de Hoje"
        subtitle="Escolha uma atividade ou personalize a duração e o gasto calórico."
        maxWidth="md"
      >
        <div className="mb-4">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 block mb-2">
            Atalhos rápidos:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PRESET_WORKOUTS.map((p) => (
              <button
                key={p.category}
                type="button"
                onClick={() => handleSelectPreset(p)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  category === p.category
                    ? "border-amber-600 bg-amber-500/15 text-amber-950 dark:text-amber-200 ring-1 ring-amber-500/30"
                    : "border-stone-200 dark:border-stone-700 bg-white dark:bg-[#25201c] text-stone-700 dark:text-stone-300 hover:border-stone-300"
                }`}
              >
                <span className="text-lg block mb-0.5">{p.icon}</span>
                <span className="text-xs font-bold block truncate">{p.title}</span>
                <span className="text-[10px] text-stone-400 block">
                  ~{p.caloriesPerHour} kcal/h
                </span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <TextInput
            label="Nome da Atividade"
            value={title}
            onValueChange={(val) => {
              setTitle(val);
              setAiExplanation(null);
            }}
            placeholder="Ex: Treino de Perna, Corrida no Parque, Natação..."
            required
          />

          {/* Seletor de Intensidade */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 block mb-1.5">
              Intensidade do Esforço
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {INTENSITY_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleIntensityChange(opt.id as any)}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    intensity === opt.id
                      ? "border-amber-600 bg-amber-500/20 text-amber-950 dark:text-amber-200 font-extrabold ring-1 ring-amber-500/40"
                      : "border-stone-200 dark:border-stone-700 bg-white/80 dark:bg-[#25201c] text-stone-600 dark:text-stone-300 hover:border-stone-400"
                  }`}
                  title={opt.desc}
                >
                  <span className="text-sm block">{opt.icon}</span>
                  <span className="text-xs block mt-0.5">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 items-end">
            <TextInput
              label="Duração (minutos)"
              type="number"
              min="5"
              max="360"
              value={durationMinutes}
              onValueChange={handleDurationChange}
              required
            />

            <div>
              <div className="flex items-center justify-between gap-1 mb-1">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                  Calorias (kcal)
                </label>
                <button
                  type="button"
                  onClick={handleEstimateWithAi}
                  disabled={estimating}
                  className="text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer inline-flex items-center gap-1 disabled:opacity-50"
                >
                  <span>{estimating ? "⏳" : "✨"}</span>
                  <span>{estimating ? "Calculando..." : "Assistente IA"}</span>
                </button>
              </div>
              <TextInput
                type="number"
                min="10"
                max="3000"
                value={caloriesBurned}
                onValueChange={setCaloriesBurned}
                required
              />
            </div>
          </div>

          {/* Caixa de Explicação do Assistente */}
          {aiExplanation && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-50/70 dark:bg-amber-950/30 p-2.5 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2 animate-in fade-in">
              <span className="text-base shrink-0">💡</span>
              <p className="leading-relaxed">{aiExplanation}</p>
            </div>
          )}

          <TextInput
            label="Observações (Opcional)"
            value={notes}
            onValueChange={setNotes}
            placeholder="Ex: Foco em quadríceps, pace médio 5:30..."
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-stone-200/60 dark:border-stone-800">
            <ActionButton
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </ActionButton>
            <ActionButton type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Confirmar Treino 🔥"}
            </ActionButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
