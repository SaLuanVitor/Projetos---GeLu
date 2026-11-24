"use client";

import React, { useState, useRef, ChangeEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import {
  Coffee,
  Apple,
  Soup,
  Sandwich,
  Salad,
  Moon,
  Cookie,
  Camera,
  Upload,
  X,
  Sparkles,
  Lightbulb,
  Loader2,
  Check,
  type LucideIcon,
} from "lucide-react";
import { ActionButton } from "@/components/ui/ActionButton";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { useToast } from "@/components/ui/Toast";
import { AiFeedbackWidget } from "@/components/ui/AiFeedbackWidget";
import { analyzeMealPhoto, createMealLog } from "@/services/meals";
import type { AnalyzeMealPhotoResponse, FoodItemIdentified } from "@/types/api";

interface FoodVisionScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessToken: string;
  onMealSaved: () => void;
  defaultMealType?: string;
}

interface MealTypeOption {
  key: string;
  label: string;
  icon: LucideIcon;
}

const MEAL_TYPES: MealTypeOption[] = [
  { key: "BREAKFAST", label: "Café da Manhã", icon: Coffee },
  { key: "MORNING_SNACK", label: "Lanche Manhã", icon: Apple },
  { key: "LUNCH", label: "Almoço", icon: Soup },
  { key: "AFTERNOON_SNACK", label: "Lanche Tarde", icon: Sandwich },
  { key: "DINNER", label: "Jantar", icon: Salad },
  { key: "SUPPER", label: "Ceia", icon: Moon },
  { key: "SNACK", label: "Lanche Livre", icon: Cookie },
];

export function FoodVisionScannerModal({
  isOpen,
  onClose,
  accessToken,
  onMealSaved,
  defaultMealType = "LUNCH",
}: FoodVisionScannerModalProps) {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<string>(defaultMealType);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Resultado da Análise da IA
  const [analysisResult, setAnalysisResult] = useState<AnalyzeMealPhotoResponse | null>(null);
  const [editableDishName, setEditableDishName] = useState<string>("");
  const [editableCalories, setEditableCalories] = useState<number>(0);
  const [editableProteins, setEditableProteins] = useState<number>(0);
  const [editableCarbs, setEditableCarbs] = useState<number>(0);
  const [editableFats, setEditableFats] = useState<number>(0);

  const resetState = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setIsAnalyzing(false);
    setIsSaving(false);
    setError(null);
    setAnalysisResult(null);
    setEditableDishName("");
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith("image/")) {
      setError("Por favor, selecione um arquivo de imagem válido (JPEG, PNG ou WebP).");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setError("A foto é muito grande. Escolha uma imagem de até 15MB.");
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setAnalysisResult(null);
  };

  const handleAnalyzePhoto = async () => {
    if (!selectedFile) {
      setError("Selecione ou tire uma foto primeiro.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await analyzeMealPhoto(accessToken, selectedFile, selectedMealType);
      setAnalysisResult(result);
      setEditableDishName(result.dishName || "Refeição Identificada");
      setEditableCalories(Math.round(result.totalCalories || 0));
      setEditableProteins(Math.round(result.proteins || 0));
      setEditableCarbs(Math.round(result.carbohydrates || 0));
      setEditableFats(Math.round(result.fats || 0));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao analisar o prato com IA.";
      setError(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveMeal = async () => {
    if (!analysisResult) return;

    setIsSaving(true);
    setError(null);

    try {
      const nowIso = new Date().toISOString();
      await createMealLog(accessToken, {
        mealType: selectedMealType,
        dishName: editableDishName || analysisResult.dishName,
        photoUrl: analysisResult.photoUrl,
        totalCalories: editableCalories,
        proteins: editableProteins,
        carbohydrates: editableCarbs,
        fats: editableFats,
        fibers: analysisResult.fibers ?? undefined,
        sodium: analysisResult.sodium ?? undefined,
        items: analysisResult.items,
        aiNotes: analysisResult.aiNotes ?? undefined,
        consumedAt: nowIso,
      });

      showToast("Refeição registrada no seu diário com sucesso!", "success");
      onMealSaved();
      handleClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar a refeição.";
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={
        <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-bold">
          <Camera className="w-5 h-5 text-amber-800 dark:text-amber-400 stroke-[2]" />
          <span>Escanear Prato com IA</span>
        </div>
      }>
      <div className="space-y-5 max-w-xl">
        {error && (
          <StatusMessage variant="error">
            {error}
          </StatusMessage>
        )}

        {/* ETAPA 1: SELEÇÃO DA FOTO */}
        {!analysisResult && (
          <div className="space-y-4">
            {/* Seletor de Tipo de Refeição */}
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-2">
                Qual refeição você está fazendo agora?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {MEAL_TYPES.map((t) => {
                  const Icon = t.icon;
                  const isSelected = selectedMealType === t.key;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setSelectedMealType(t.key)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all text-left ${
                        isSelected
                          ? "border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 ring-1 ring-amber-500/20"
                          : "border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:border-stone-300"
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0 stroke-[1.75]" />
                      <span className="truncate">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Upload Area / Camera Trigger */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <input
              type="file"
              ref={cameraInputRef}
              onChange={handleFileChange}
              accept="image/*"
              capture="environment"
              className="hidden"
            />

            {!previewUrl ? (
              <div className="border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-2xl p-6 sm:p-8 text-center bg-stone-50/50 dark:bg-stone-900/50 transition-all hover:bg-stone-50">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100/80 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 mb-3 shadow-inner">
                  <Camera className="w-8 h-8 stroke-[1.75]" />
                </div>
                <h4 className="font-display font-bold text-base text-stone-900 dark:text-stone-100">
                  Tire uma foto do seu prato
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-sm mx-auto">
                  Aponte a câmera para o prato ou envie uma foto da sua galeria. A IA identificará os alimentos, porções e nutrientes.
                </p>

                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 text-xs font-bold shadow-xs transition-all cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Tirar Foto Agora</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-50 px-4 py-2.5 text-xs font-bold text-stone-700 dark:text-stone-300 shadow-2xs transition-all cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Escolher da Galeria</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-stone-900 max-h-72 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Preview do prato"
                    className="max-h-72 w-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={resetState}
                    className="absolute top-3 right-3 rounded-full bg-stone-900/80 hover:bg-stone-900 text-white p-1.5 text-xs font-bold shadow-md transition-all cursor-pointer"
                    title="Trocar imagem"
                  >
                    <span className="inline-flex items-center gap-1"><X className="w-3.5 h-3.5" /> Trocar</span>
                  </button>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleAnalyzePhoto}
                    disabled={isAnalyzing}
                    className="inline-flex items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white px-5 py-2.5 text-xs font-black shadow-xs transition-all cursor-pointer"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Identificando prato com IA...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Analisar Prato & Calcular Macros</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ETAPA 2: RESULTADO DA ANÁLISE PELA IA */}
        {analysisResult && (
          <div className="space-y-4">
            <div className="flex gap-4 items-start bg-orange-50/60 dark:bg-orange-950/20 p-4 rounded-2xl border border-orange-200/80 dark:border-orange-900/40">
              {previewUrl && (
                <div className="h-20 w-20 rounded-xl overflow-hidden border border-orange-200 dark:border-orange-900 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt={editableDishName}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-orange-200 dark:bg-orange-900/60 px-2 py-0.5 text-[10px] font-bold text-orange-800 dark:text-orange-200 uppercase tracking-wider">
                    {analysisResult.confidence === "HIGH"
                      ? "Alta Confiança"
                      : analysisResult.confidence === "MEDIUM"
                      ? "Média Confiança"
                      : "Estimativa Geral"}
                  </span>
                  <span className="text-[11px] text-stone-500 font-medium">
                    {MEAL_TYPES.find((m) => m.key === selectedMealType)?.label}
                  </span>
                </div>

                <input
                  type="text"
                  value={editableDishName}
                  onChange={(e) => setEditableDishName(e.target.value)}
                  placeholder="Nome do prato..."
                  className="mt-1.5 w-full font-display font-black text-lg text-stone-900 dark:text-stone-100 bg-transparent border-b border-orange-300 dark:border-orange-800 focus:outline-none focus:border-orange-500 pb-0.5"
                />

                {analysisResult.aiNotes && (
                  <p className="mt-1.5 text-xs text-stone-600 dark:text-stone-300 italic">
                    <span className="inline-flex items-center gap-1.5"><Lightbulb className="w-3.5 h-3.5 text-amber-700 shrink-0" /> &ldquo;{analysisResult.aiNotes}&rdquo;</span>
                  </p>
                )}
              </div>
            </div>

            {/* Painel de Macros Editáveis */}
            <div className="grid grid-cols-4 gap-2">
              <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-2.5 text-center shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-stone-400 block">Calorias</span>
                <input
                  type="number"
                  value={editableCalories}
                  onChange={(e) => setEditableCalories(Number(e.target.value))}
                  className="w-full text-center font-black text-base sm:text-lg text-orange-600 dark:text-orange-400 bg-transparent focus:outline-none"
                />
                <span className="text-[10px] text-stone-400 font-medium">kcal</span>
              </div>

              <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-2.5 text-center shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-stone-400 block">Proteínas</span>
                <input
                  type="number"
                  value={editableProteins}
                  onChange={(e) => setEditableProteins(Number(e.target.value))}
                  className="w-full text-center font-black text-base sm:text-lg text-sky-600 dark:text-sky-400 bg-transparent focus:outline-none"
                />
                <span className="text-[10px] text-stone-400 font-medium">gramas</span>
              </div>

              <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-2.5 text-center shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-stone-400 block">Carboidratos</span>
                <input
                  type="number"
                  value={editableCarbs}
                  onChange={(e) => setEditableCarbs(Number(e.target.value))}
                  className="w-full text-center font-black text-base sm:text-lg text-amber-600 dark:text-amber-400 bg-transparent focus:outline-none"
                />
                <span className="text-[10px] text-stone-400 font-medium">gramas</span>
              </div>

              <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-2.5 text-center shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-stone-400 block">Gorduras</span>
                <input
                  type="number"
                  value={editableFats}
                  onChange={(e) => setEditableFats(Number(e.target.value))}
                  className="w-full text-center font-black text-base sm:text-lg text-rose-600 dark:text-rose-400 bg-transparent focus:outline-none"
                />
                <span className="text-[10px] text-stone-400 font-medium">gramas</span>
              </div>
            </div>

            {/* Ingredientes / Itens Detectados */}
            {analysisResult.items && analysisResult.items.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
                  Alimentos detectados no prato ({analysisResult.items.length}):
                </label>
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {analysisResult.items.map((item: FoodItemIdentified, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-3 py-1.5 rounded-lg border border-stone-200/80 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 text-xs"
                    >
                      <span className="font-semibold text-stone-800 dark:text-stone-200">
                        {item.name}
                        {item.estimatedGrams ? ` (~${Math.round(item.estimatedGrams)}g)` : ""}
                      </span>
                      <span className="font-mono text-stone-500 dark:text-stone-400 text-[11px]">
                        {item.calories ? `${Math.round(item.calories)} kcal` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Feedback da Análise Visual para Treinamento da IA */}
            <div className="pt-2">
              <AiFeedbackWidget
                featureType="FOOD_VISION"
                itemTitle={editableDishName || analysisResult.dishName}
                ingredients={analysisResult.items?.map((i) => i.name)}
                accessToken={accessToken}
              />
            </div>

            {/* Ações Finais */}
            <div className="flex justify-between items-center pt-3 border-t border-stone-200 dark:border-stone-800">
              <button
                type="button"
                onClick={resetState}
                className="text-xs font-bold text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 cursor-pointer"
              >
                <span className="inline-flex items-center gap-1"><Camera className="w-3.5 h-3.5" /> Tirar outra foto</span>
              </button>

              <button
                type="button"
                onClick={handleSaveMeal}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white px-5 py-2.5 text-xs font-black shadow-xs transition-all cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Salvando no diário...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[2]" />
                    <span>Salvar no Diário de Alimentação</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
