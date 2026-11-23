"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getValidSession } from "@/services/auth";
import { listFamilies } from "@/services/families";
import {
  acknowledgeCoupleNote,
  listCoupleNotes,
} from "@/services/couple-notes";
import type { CoupleNoteResponse } from "@/types/api";
import { useToast } from "@/components/ui/Toast";
import { getNoteUrgencyConfig } from "./note-urgency";

const SNOOZE_DURATION_MS = 2 * 60 * 1000; // 2 minutos para re-notificar se não marcar lido
const POLL_INTERVAL_MS = 30 * 1000; // Checa a cada 30 segundos

export function CoupleNotePopupListener() {
  const toast = useToast();
  const [mounted, setMounted] = useState(false);
  const [activeNote, setActiveNote] = useState<CoupleNoteResponse | null>(null);
  const [snoozedNotes, setSnoozedNotes] = useState<Record<string, number>>({});
  const [acknowledging, setAcknowledging] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const checkUnreadNotes = useCallback(async () => {
    try {
      const session = await getValidSession();
      if (!session) return;

      const families = await listFamilies(session.accessToken);
      if (!families || families.length === 0) return;

      const now = Date.now();
      let latestUnread: CoupleNoteResponse | null = null;

      for (const fam of families) {
        const notes = await listCoupleNotes(session.accessToken, fam.id, true);
        const unread = notes.filter((n) => {
          if (n.resolved || n.acknowledgedAt) return false;
          // O autor do recado nunca deve receber o popup da própria nota
          if (n.authorId === session.user.id) return false;
          // Se foi adiado e o tempo ainda não expirou, ignora por enquanto
          const snoozeUntil = snoozedNotes[n.id];
          if (snoozeUntil && snoozeUntil > now) return false;
          return true;
        });

        if (unread.length > 0) {
          latestUnread = unread[0];
          break;
        }
      }

      setActiveNote(latestUnread);
    } catch {
      // Ignora erro silencioso no polling em background
    }
  }, [snoozedNotes]);

  useEffect(() => {
    if (!mounted) return;

    checkUnreadNotes();
    const interval = setInterval(checkUnreadNotes, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [mounted, checkUnreadNotes]);

  // Ação: Marcar como Visto com Amor
  const handleAcknowledge = async () => {
    if (!activeNote) return;
    try {
      setAcknowledging(true);
      const session = await getValidSession();
      if (!session) return;

      await acknowledgeCoupleNote(session.accessToken, activeNote.id);
      toast.success("Recado marcado como visto com carinho! ❤️");
      setActiveNote(null);
    } catch {
      toast.error("Não foi possível confirmar o visto.");
    } finally {
      setAcknowledging(false);
    }
  };

  // Ação: Adiar notificação (lembrar em 2 minutos se continuar não lido)
  const handleSnooze = () => {
    if (!activeNote) return;
    const snoozeUntil = Date.now() + SNOOZE_DURATION_MS;
    setSnoozedNotes((prev) => ({ ...prev, [activeNote.id]: snoozeUntil }));
    setActiveNote(null);
    toast.info("Lembrete adiado por 2 minutos.");
  };

  if (!mounted || !activeNote) return null;

  const cfg = getNoteUrgencyConfig(activeNote.color);

  return createPortal(
    <aside
      aria-label="Notificação de novo recado"
      className="fixed top-6 right-6 z-[105] max-w-sm w-full animate-in slide-in-from-top-6 fade-in duration-300 pointer-events-auto"
    >
      <div
        className={`rounded-3xl border-2 p-5 shadow-2xl backdrop-blur-md ring-1 ring-black/5 ${cfg.bg} ${cfg.border}`}
      >
        {/* Cabeçalho do Popup */}
        <div className="flex items-center justify-between gap-2 border-b border-black/5 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xl">💌</span>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                Novo Recado do Casal!
              </h4>
              <p className="text-[11px] font-semibold text-stone-600">
                De: {activeNote.authorName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${cfg.badgeColor}`}
            >
              {cfg.badge}
            </span>
            <button
              type="button"
              onClick={handleSnooze}
              className="rounded-full p-1 text-stone-400 hover:text-stone-700 hover:bg-black/5 transition-colors"
              title="Lembrar mais tarde (2 min)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Mensagem do Recado com Tipografia Afetuosa */}
        <div className="py-3 px-1">
          <p className="font-hand text-2xl sm:text-3xl font-normal text-stone-900 leading-snug break-words">
            &ldquo;{activeNote.content}&rdquo;
          </p>
          <p className="mt-2 text-[10px] font-medium text-stone-500">
            Postado às{" "}
            {new Date(activeNote.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        {/* Barra de Ações do Popup */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/5">
          <button
            type="button"
            onClick={handleSnooze}
            className="rounded-xl border border-stone-300 bg-white/90 px-3 py-1.5 text-xs font-bold text-stone-700 hover:bg-white transition-colors"
          >
            Lembrar em 2 min
          </button>

          <button
            type="button"
            onClick={handleAcknowledge}
            disabled={acknowledging}
            className="inline-flex items-center gap-1.5 rounded-xl bg-pink-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-pink-600/20 hover:bg-pink-700 transition-all active:scale-95 disabled:opacity-50"
          >
            <span>❤️</span>
            <span>{acknowledging ? "Confirmando..." : "Visto com Amor"}</span>
          </button>
        </div>
      </div>
    </aside>,
    document.body
  );
}
