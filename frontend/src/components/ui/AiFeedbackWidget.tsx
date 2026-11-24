"use client";

import React, { useState } from "react";
import { submitAiFeedback } from "@/services/ai";
import { getValidSession } from "@/services/auth";
import { useToast } from "@/components/ui/Toast";

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
          itemTitle: itemTitle || "Geração de IA",
          mealTitle: itemTitle || "Geração de IA",
          ingredients: ingredients || [],
          accepted: true,
          rating: 5.0,
        });
      }
      setEvaluated("POSITIVE");
      showToast(
        "Feedback registrado! A IA usará essa confirmação para reforçar suas preferências.",
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
          itemTitle: itemTitle || "Geração de IA",
          mealTitle: itemTitle || "Geração de IA",
          ingredients: ingredients || [],
          accepted: false,
          rating: 1.0,
          correctionNotes: comment.trim() || undefined,
        });
      }
      setEvaluated("NEGATIVE");
      setShowNegativeForm(false);
      showToast(
        "Motivo registrado! Seu comentário foi memorizado para treinar e corrigir as próximas gerações.",
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
        className={`flex items-center gap-2 text-xs py-1.5 px-3 rounded-lg border font-medium ${
          evaluated === "POSITIVE"
            ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60"
            : "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60"
        } ${className}`}
      >
        <span>{evaluated === "POSITIVE" ? "👍" : "👎"}</span>
        <span>
          {evaluated === "POSITIVE"
            ? "Avaliação positiva registrada para calibrar a IA."
            : "Motivo registrado para treinar e ajustar próximas análises."}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-3 transition-all ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
          <span>✨</span>
          <span>A geração ou análise da IA foi precisa?</span>
        </span>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePositiveClick}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 transition-colors disabled:opacity-50"
            title="Aprovado: a IA acertou"
          >
            <span>👍</span>
            {!compact && <span>Positiva</span>}
          </button>

          <button
            type="button"
            onClick={handleNegativeClick}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 dark:hover:bg-rose-950/40 dark:hover:text-rose-300 transition-colors disabled:opacity-50"
            title="Negativo: relatar motivo para treinar e corrigir"
          >
            <span>👎</span>
            {!compact && <span>Negativa</span>}
          </button>
        </div>
      </div>

      {showNegativeForm && (
        <form onSubmit={handleNegativeSubmit} className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Qual foi o problema nesta geração/análise?
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            placeholder="Ex: identificou o alimento errado, quantidade desproporcional, ingrediente que não como..."
            className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 p-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
            autoFocus
          />
          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowNegativeForm(false)}
              className="px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-3 py-1 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Gravando..." : "Salvar motivo para treinar a IA"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
