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
  PenLine,
  Camera,
  Zap,
  Sparkles,
  Upload,
  X,
  Check,
  Lightbulb,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { ActionButton } from "@/components/ui/ActionButton";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { useToast } from "@/components/ui/Toast";
import { AiFeedbackWidget } from "@/components/ui/AiFeedbackWidget";
import { analyzeMealPhoto, parseMealText, createMealLog } from "@/services/meals";
import type {
  AnalyzeMealPhotoResponse,
  FoodItemIdentified,
  ParseMealTextResponse,
} from "@/types/api";

interface MealLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessToken: string;
  onMealSaved: () => void;
  defaultMealType?: string;
  dietMealId?: string | null;
  defaultDishName?: string;
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

const STAPLE_SUGGESTIONS = [
  { label: "Arroz, feijão e frango grelhado", text: "4 colheres de sopa de arroz branco, 1 concha de feijão carioca e 1 filé de peito de frango grelhado (150g)" },
  { label: "2 ovos mexidos com pão e queijo", text: "2 ovos mexidos com 1 pão francês e 1 fatia de queijo branco" },
  { label: "Vitamina de banana com aveia", text: "1 copo de leite integral (200ml), 1 banana média e 2 colheres de sopa de aveia em flocos" },
  { label: "Salada com atum", text: "Prato fundo de alface, tomate, pepino e 1 lata de atum sólido com azeite de oliva" },
  { label: "Café com leite e torrada", text: "1 xícara de café com leite desnatado e 2 torradas integrais com requeijão" },
  { label: "Maçã com castanhas", text: "1 maçã média e 30g de castanhas de caju" },
];

export function MealLogModal({
  isOpen,
  onClose,
  accessToken,
  onMealSaved,
  defaultMealType = "LUNCH",
  dietMealId = null,
  defaultDishName = "",
}: MealLogModalProps) {
  const { showToast } = useToast();

  // Active Tab: "text" | "photo"
  const [activeTab, setActiveTab] = useState<"text" | "photo">("text");

  // Common State
  const [selectedMealType, setSelectedMealType] = useState<string>(() => {
    // Normaliza defaultMealType para uma das chaves válidas
    const match = MEAL_TYPES.find(
      (m) => m.key === defaultMealType || m.label.toLowerCase() === defaultMealType?.toLowerCase()
    );
    return match ? match.key : "LUNCH";
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Tab 1: Text State
  const [rawText, setRawText] = useState<string>(defaultDishName || "");
  const [isParsingText, setIsParsingText] = useState<boolean>(false);
  const [parsedTextResult, setParsedTextResult] = useState<ParseMealTextResponse | null>(null);

  // Tab 2: Photo State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeMealPhotoResponse | null>(null);

  // Editable Form Fields (Used by either tab once analyzed)
  const [dishName, setDishName] = useState<string>(defaultDishName);
  const [calories, setCalories] = useState<number>(0);
  const [proteins, setProteins] = useState<number>(0);
  const [carbs, setCarbs] = useState<number>(0);
  const [fats, setFats] = useState<number>(0);
  const [fibers, setFibers] = useState<number>(0);
  const [sodium, setSodium] = useState<number>(0);
  const [items, setItems] = useState<FoodItemIdentified[]>([]);
  const [aiNotes, setAiNotes] = useState<string>("");

  const resetState = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setIsParsingText(false);
    setIsAnalyzingPhoto(false);
    setIsSubmitting(false);
    setError(null);
    setParsedTextResult(null);
    setAnalysisResult(null);
    setRawText("");
    setDishName("");
    setCalories(0);
    setProteins(0);
    setCarbs(0);
    setFats(0);
    setFibers(0);
    setSodium(0);
    setItems([]);
    setAiNotes("");
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // --- Handlers Tab 1: Text & Voice Parser ---
  const handleParseText = async () => {
    if (!rawText.trim()) {
      setError("Por favor, digite o que você comeu para a IA analisar.");
      return;
    }

    setIsParsingText(true);
    setError(null);

    try {
      const result = await parseMealText(accessToken, {
        text: rawText.trim(),
        mealType: selectedMealType,
      });

      setParsedTextResult(result);
      setDishName(result.dishName || rawText.substring(0, 50));
      setCalories(Math.round(result.totalCalories || 0));
      setProteins(Math.round(result.proteins || 0));
      setCarbs(Math.round(result.carbohydrates || 0));
      setFats(Math.round(result.fats || 0));
      setFibers(Math.round(result.fibers || 0));
      setSodium(Math.round(result.sodium || 0));
      setItems(result.items || []);
      setAiNotes(result.aiNotes || "");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao interpretar texto com IA.";
      setError(msg);
    } finally {
      setIsParsingText(false);
    }
  };

  const handleApplyStaple = (suggestionText: string) => {
    setRawText((prev) => (prev ? `${prev}, ${suggestionText}` : suggestionText));
  };

  // --- Handlers Tab 2: Photo Vision ---
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith("image/")) {
      setError("Selecione um arquivo de imagem válido (JPEG, PNG ou WebP).");
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

    setIsAnalyzingPhoto(true);
    setError(null);

    try {
      const result = await analyzeMealPhoto(accessToken, selectedFile, selectedMealType);
      setAnalysisResult(result);
      setDishName(result.dishName || "Prato Fotografado");
      setCalories(Math.round(result.totalCalories || 0));
      setProteins(Math.round(result.proteins || 0));
      setCarbs(Math.round(result.carbohydrates || 0));
      setFats(Math.round(result.fats || 0));
      setFibers(Math.round(result.fibers || 0));
      setSodium(Math.round(result.sodium || 0));
      setItems(result.items || []);
      setAiNotes(result.aiNotes || "");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao analisar foto com IA.";
      setError(msg);
    } finally {
      setIsAnalyzingPhoto(false);
    }
  };

  // --- Final Save Handler ---
  const handleSaveMeal = async () => {
    if (!dishName.trim()) {
      setError("Dê um nome para a refeição.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const inputMethod = activeTab === "text" ? "TEXT_AI" : "VISION_AI";
      const status = dietMealId ? "CUSTOM_CONSUMED" : "UNPLANNED_CONSUMED";

      await createMealLog(accessToken, {
        mealType: selectedMealType,
        dishName: dishName.trim(),
        photoUrl: analysisResult?.photoUrl,
        totalCalories: calories,
        proteins,
        carbohydrates: carbs,
        fats,
        fibers,
        sodium,
        items,
        aiNotes,
        dietMealId: dietMealId || undefined,
        status,
        inputMethod,
        rawInputText: activeTab === "text" ? rawText : undefined,
      });

      showToast(`${dishName} anotado no seu diário (+${calories} kcal)`, "success");

      handleClose();
      onMealSaved();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar refeição.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasAnalysis = Boolean(parsedTextResult || analysisResult);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      maxWidth="2xl"
      title={
        <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-bold">
          <UtensilsCrossed className="w-5 h-5 text-amber-800 dark:text-amber-400 stroke-[2]" />
          <span>Anotar Refeição no Caderno</span>
        </div>
      }
      subtitle={
        dietMealId
          ? "Registrando o que você realmente consumiu nesta refeição do plano"
          : "Descreva em português ou fotografe seu prato para calcular calorias e macros"
      }
    >
      <div className="space-y-4">
        {error && <StatusMessage variant="error">{error}</StatusMessage>}

        {/* Seletor de Tipo de Refeição */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1.5">
            Tipo de Refeição
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-1.5">
            {MEAL_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedMealType === type.key;
              return (
                <button
                  key={type.key}
                  type="button"
                  title={`Refeição: ${type.label}`}
                  onClick={() => setSelectedMealType(type.key)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-xs font-bold transition-all duration-150 hover:-translate-y-0.5 hover:shadow-xs active:scale-95 active:translate-y-0 cursor-pointer ${
                    isSelected
                      ? "border-amber-600 bg-amber-500/15 text-amber-950 dark:text-amber-200 ring-1 ring-amber-500/30 shadow-xs"
                      : "border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:border-amber-300 dark:hover:border-stone-600"
                  }`}
                >
                  <Icon className="w-4 h-4 mb-1 stroke-[1.75]" />
                  <span className="text-[10px] text-center leading-tight">{type.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Abas: Texto/Voz vs Foto */}
        <div className="flex border-b border-stone-200 dark:border-stone-800">
          <button
            type="button"
            onClick={() => {
              setActiveTab("text");
              setError(null);
            }}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === "text"
                ? "border-primary text-primary dark:text-primary-light"
                : "border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
            }`}
          >
            <PenLine className="w-3.5 h-3.5" /> <span>Descrever o que comi</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("photo");
              setError(null);
            }}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === "photo"
                ? "border-primary text-primary dark:text-primary-light"
                : "border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
            }`}
          >
            <Camera className="w-3.5 h-3.5" /> <span>Fotografar Prato</span>
          </button>
        </div>

        {/* Conteúdo Aba 1: Texto Livre & Hábitos */}
        {activeTab === "text" && (
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  Descreva seus alimentos com medidas caseiras:
                </label>
                <span className="text-[11px] text-stone-400">Gemini 2.5 Flash</span>
              </div>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Ex: Comi 4 colheres de sopa de arroz branco, 1 concha de feijão carioca, 1 bife bovino grelhado médio e salada de tomate com alface"
                rows={3}
                className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#1a1714] p-3 text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:border-primary focus:outline-none"
              />
            </div>

            {/* Chips de hábitos frequentes / atalhos */}
            <div>
              <p className="text-[11px] font-bold text-stone-500 mb-1.5">
                <span className="inline-flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-amber-600" /> Sugestões Rápidas:</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {STAPLE_SUGGESTIONS.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyStaple(s.text)}
                    className="rounded-full border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/80 px-2.5 py-1 text-[11px] font-medium text-stone-700 dark:text-stone-300 hover:border-primary hover:text-primary transition-all cursor-pointer"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Botão Analisar Texto */}
            <div className="flex justify-end pt-1">
              <ActionButton
                type="button"
                onClick={handleParseText}
                disabled={isParsingText || !rawText.trim()}
                className="text-xs py-2 px-4 shadow-sm"
              >
                {isParsingText ? (
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Nutri IA analisando porções...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> <span>Analisar Alimentos & Calorias</span>
                  </span>
                )}
              </ActionButton>
            </div>
          </div>
        )}

        {/* Conteúdo Aba 2: Foto do Prato */}
        {activeTab === "photo" && (
          <div className="space-y-3">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />

            {!previewUrl ? (
              <div className="rounded-2xl border-2 border-dashed border-stone-300 dark:border-stone-700 p-8 text-center bg-stone-50/50 dark:bg-stone-900/20">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 mx-auto mb-2.5">
                  <Camera className="w-6 h-6 stroke-[1.75]" />
                </div>
                <p className="text-sm font-bold text-stone-800 dark:text-stone-200 mb-1">
                  Fotografe sua refeição
                </p>
                <p className="text-xs text-stone-500 mb-4">
                  A IA identifica os alimentos, calcula as porções e estima os macronutrientes
                </p>
                <div className="flex justify-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary text-white font-bold text-xs px-4 py-2 hover:bg-primary-hover shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md active:scale-95 active:translate-y-0 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" /> <span>Abrir Câmera</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-bold text-xs px-4 py-2 hover:border-primary shadow-xs transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md active:scale-95 active:translate-y-0 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" /> <span>Escolher Foto</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700 max-h-56 flex justify-center bg-black/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewUrl} alt="Preview" className="object-contain max-h-56 w-auto" />
                  <button
                    type="button"
                    onClick={() => {
                      if (previewUrl) URL.revokeObjectURL(previewUrl);
                      setPreviewUrl(null);
                      setSelectedFile(null);
                      setAnalysisResult(null);
                    }}
                    className="absolute top-2 right-2 rounded-full bg-black/60 text-white p-1 hover:bg-black cursor-pointer"
                    title="Remover foto"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="text-xs text-stone-600 dark:text-stone-400 underline cursor-pointer"
                  >
                    Tirar outra foto
                  </button>
                  <ActionButton
                    type="button"
                    onClick={handleAnalyzePhoto}
                    disabled={isAnalyzingPhoto}
                    className="text-xs py-2 px-4 shadow-sm"
                  >
                    {isAnalyzingPhoto ? (
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Visão Computacional analisando...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> <span>Escanear Prato com Visão IA</span>
                      </span>
                    )}
                  </ActionButton>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Resultado e Ajuste de Macronutrientes (Exibido após análise) */}
        {hasAnalysis && (
          <div className="mt-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900/60 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5 stroke-[2]" /> <span>Análise Nutricional Concluída</span>
              </span>
              <span className="text-[11px] font-semibold text-stone-500">
                Ajuste os valores se desejar
              </span>
            </div>

            {/* Nome do Prato */}
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                Nome da Refeição:
              </label>
              <input
                type="text"
                value={dishName}
                onChange={(e) => setDishName(e.target.value)}
                className="w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#1a1714] px-3 py-2 text-sm font-bold text-stone-900 dark:text-stone-100"
              />
            </div>

            {/* Grid de Macros com Hints Explicativos */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div
                title="Calorias (kcal): energia total fornecida por este prato"
                className="rounded-xl border border-orange-200/90 bg-orange-50/80 dark:border-orange-950/60 dark:bg-orange-950/30 p-2.5 text-center shadow-2xs hover:border-orange-300 transition-colors"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-800 dark:text-orange-300 block">
                  Calorias (kcal)
                </span>
                <input
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(Number(e.target.value))}
                  className="w-full text-center font-display text-xl font-black text-orange-950 dark:text-orange-100 bg-transparent focus:outline-none"
                />
                <span className="text-[10px] text-orange-600 dark:text-orange-400 font-medium">energia total</span>
              </div>

              <div
                title="Proteínas (P): macronutriente essencial para massa muscular, recuperação e saciedade duradoura"
                className="rounded-xl border border-rose-200/90 bg-rose-50/80 dark:border-rose-950/60 dark:bg-rose-950/30 p-2.5 text-center shadow-2xs hover:border-rose-300 transition-colors"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 block">
                  Proteínas (P)
                </span>
                <input
                  type="number"
                  value={proteins}
                  onChange={(e) => setProteins(Number(e.target.value))}
                  className="w-full text-center font-display text-xl font-black text-rose-950 dark:text-rose-100 bg-transparent focus:outline-none"
                />
                <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">gramas (g)</span>
              </div>

              <div
                title="Carboidratos (C): principal fonte de energia imediata e glicose para mente e corpo"
                className="rounded-xl border border-amber-200/90 bg-amber-50/80 dark:border-amber-950/60 dark:bg-amber-950/30 p-2.5 text-center shadow-2xs hover:border-amber-300 transition-colors"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 block">
                  Carboidratos (C)
                </span>
                <input
                  type="number"
                  value={carbs}
                  onChange={(e) => setCarbs(Number(e.target.value))}
                  className="w-full text-center font-display text-xl font-black text-amber-950 dark:text-amber-100 bg-transparent focus:outline-none"
                />
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">gramas (g)</span>
              </div>

              <div
                title="Gorduras Saudáveis (G): lipídios fundamentais para regulação hormonal e absorção de vitaminas"
                className="rounded-xl border border-yellow-200/90 bg-yellow-50/80 dark:border-yellow-950/60 dark:bg-yellow-950/30 p-2.5 text-center shadow-2xs hover:border-yellow-300 transition-colors"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-800 dark:text-yellow-300 block">
                  Gorduras (G)
                </span>
                <input
                  type="number"
                  value={fats}
                  onChange={(e) => setFats(Number(e.target.value))}
                  className="w-full text-center font-display text-xl font-black text-yellow-950 dark:text-yellow-100 bg-transparent focus:outline-none"
                />
                <span className="text-[10px] text-yellow-600 dark:text-yellow-400 font-medium">gramas (g)</span>
              </div>
            </div>

            {/* Lista de Itens Identificados */}
            {items && items.length > 0 && (
              <div className="mt-2 space-y-1">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                  Porções Identificadas:
                </span>
                <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs py-1 px-2 rounded bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
                    >
                      <span className="font-medium text-stone-800 dark:text-stone-200 truncate pr-2">
                        {item.name} {item.estimatedGrams ? `(${item.estimatedGrams}g)` : ""}
                      </span>
                      <span className="shrink-0 font-bold text-primary">
                        ~{Math.round(item.calories || 0)} kcal
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dica / Notas da IA */}
            {aiNotes && (
              <p className="text-xs text-stone-600 dark:text-stone-400 italic bg-primary/5 p-2 rounded-lg border border-primary/10">
                <span className="inline-flex items-center gap-1.5"><Lightbulb className="w-3.5 h-3.5 text-amber-700 shrink-0" /> <span className="font-medium">Nota Nutricional:</span></span> {aiNotes}
              </p>
            )}

            {/* Feedback da Análise da IA para Treinamento Contínuo */}
            <div className="pt-1">
              <AiFeedbackWidget
                featureType={activeTab === "text" ? "FOOD_PARSER" : "FOOD_VISION"}
                itemTitle={dishName}
                ingredients={items?.map((i) => i.name)}
                accessToken={accessToken}
              />
            </div>

            {/* Ação Salvar */}
            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg border border-stone-300 dark:border-stone-700 px-4 py-2 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 cursor-pointer"
              >
                Cancelar
              </button>
              <ActionButton
                type="button"
                onClick={handleSaveMeal}
                disabled={isSubmitting}
                className="text-xs py-2 px-5 shadow-sm"
              >
                {isSubmitting ? "Gravando no Diário..." : "Salvar no Diário"}
              </ActionButton>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
