"use client";

import React, { useState } from "react";
import { submitAiFeedback } from "@/services/ai";
import { getValidSession } from "@/services/auth";
import { useToast } from "@/components/ui/Toast";
import { ThumbsUp, ThumbsDown, Check, Sparkles, MessageSquareHeart } from "lucide-react";

interface AiFeedbackWidgetProps {
  featureType: "SUGGESTION" | "FOOD_VISION" | "FOOD_PARSER" | "NUTRITION_ESTIMATE" | string;
  itemTitle?: string;
  ingredients?: string[];
  accessToken?: string;
  onFeedbackSubmitted?: (positive: boolean, comment?: string) => void;
  className?: string;
  compact?: boolean;
}

export function AiFeedbackWidget({
  featureType,
  itemTitle,
  ingredients,
  accessToken,
  onFeedbackSubmitted,
  className = "",
  compact = false,
}: AiFeedbackWidgetProps) {
  const { showToast } = useToast();
  const [evaluated, setEvaluated] = useState<"POSITIVE" | "NEGATIVE" | null>(null);
  const [showNegativeForm, setShowNegativeForm] = useState(false);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resolveToken = async () => {
    if (accessToken) return accessToken;
    try {
      const s = await getValidSession();
      return s?.accessToken;
    } catch {
      return undefined;
    }
  };

  const handlePositiveClick = async () => {
    if (evaluated) return;
    setIsSubmitting(true);
    try {
      const token = await resolveToken();
      if (token) {
        await submitAiFeedback(token, {
          featureType,
          itemTitle: itemTitle || "Geração Nutricional",
          mealTitle: itemTitle || "Geração Nutricional",
          ingredients: ingredients || [],
          accepted: true,
          rating: 5.0,
        });
      }
      setEvaluated("POSITIVE");
      showToast(
        "Que ótimo! Memorizamos que essa sugestão combina com vocês.",
        "success"
      );
      if (onFeedbackSubmitted) {
        onFeedbackSubmitted(true);
      }
    } catch {
      showToast("Não foi possível registrar o feedback.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNegativeClick = () => {
    if (evaluated) return;
    setShowNegativeForm(true);
  };

  const handleNegativeSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = await resolveToken();
      if (token) {
        await submitAiFeedback(token, {
          featureType,
          itemTitle: itemTitle || "Geração Nutricional",
          mealTitle: itemTitle || "Geração Nutricional",
          ingredients: ingredients || [],
          accepted: false,
          rating: 1.0,
          correctionNotes: comment.trim() || undefined,
        });
      }
      setEvaluated("NEGATIVE");
      setShowNegativeForm(false);
      showToast(
        "Anotamos sua observação no caderno para aperfeiçoar as próximas sugestões.",
        "info"
      );
      if (onFeedbackSubmitted) {
        onFeedbackSubmitted(false, comment.trim());
      }
    } catch {
      showToast("Não foi possível registrar o feedback.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Se já foi avaliado
  if (evaluated) {
    return (
      <div
        className={`flex items-center gap-2.5 text-xs py-2 px-3.5 rounded-xl border font-medium ${
          evaluated === "POSITIVE"
            ? "bg-emerald-50/80 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60"
            : "bg-amber-50/80 text-amber-800 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60"
        } ${className}`}
      >
        {evaluated === "POSITIVE" ? (
          <Check className="w-4 h-4 text-emerald-700 shrink-0 stroke-[2]" />
        ) : (
          <MessageSquareHeart className="w-4 h-4 text-amber-800 shrink-0 stroke-[2]" />
        )}
        <span>
          {evaluated === "POSITIVE"
            ? "Preferência memorizada com sucesso no perfil do casal."
            : "Observação registrada no caderno. Ajustaremos as próximas recomendações."}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border border-stone-200/90 dark:border-stone-800 bg-[#fffdfa]/90 dark:bg-[#1f1b17] p-3.5 shadow-2xs transition-all ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <span className="text-xs font-medium text-stone-700 dark:text-stone-300 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          <span>Essa sugestão combina com o gosto de vocês?</span>
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePositiveClick}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 transition-colors disabled:opacity-50 shadow-2xs"
            title="Gostei: combina com nossos hábitos"
          >
            <ThumbsUp className="w-3.5 h-3.5 stroke-[1.75]" />
            {!compact && <span>Gostei</span>}
          </button>

          <button
            type="button"
            onClick={handleNegativeClick}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300 dark:hover:bg-amber-950/40 dark:hover:text-amber-300 transition-colors disabled:opacity-50 shadow-2xs"
            title="Ajustar: conte o que podemos melhorar"
          >
            <ThumbsDown className="w-3.5 h-3.5 stroke-[1.75]" />
            {!compact && <span>Ajustar</span>}
          </button>
        </div>
      </div>

      {showNegativeForm && (
        <form onSubmit={handleNegativeSubmit} className="mt-3 pt-3 border-t border-stone-200/80 dark:border-stone-800">
          <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5">
            O que podemos ajustar nesta sugestão ou leitura?
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            placeholder="Ex: não consumimos este ingrediente, porção pareceu desproporcional, preferimos pratos mais rápidos..."
            className="w-full text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 p-2.5 focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none shadow-inner"
            autoFocus
          />
          <div className="mt-2.5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowNegativeForm(false)}
              className="px-3 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-amber-800 text-white hover:bg-amber-900 transition-colors disabled:opacity-50 shadow-sm cursor-pointer"
            >
              {isSubmitting ? "Anotando..." : "Salvar no Caderno"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
