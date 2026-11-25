"use client";

import { ActionButton } from "@/components/ui/ActionButton";
import { PaperCard } from "@/components/ui/PaperCard";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import {
  HeartHandshake,
  Heart,
  PenLine,
  User,
  Clock,
  Check,
  X,
  Mail,
} from "lucide-react";
import {
  acknowledgeCoupleNote,
  createCoupleNote,
  listCoupleNotes,
  resolveCoupleNote,
} from "@/services/couple-notes";
import { getValidSession } from "@/services/auth";
import { useFamilyContext } from "@/contexts/FamilyContext";
import { subscribeToFamilyEvents } from "@/hooks/useFamilySocket";
import type { CoupleNoteResponse } from "@/types/api";
import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  getNoteUrgencyConfig,
  URGENCY_CONFIGS,
  type NoteUrgency,
} from "@/components/couplenotes/note-urgency";

// Variações de leve inclinação para simular post-its colados à mão
const POST_IT_ROTATIONS = [
  "rotate-[-1.5deg] hover:rotate-0",
  "rotate-[1.2deg] hover:rotate-0",
  "rotate-[-0.8deg] hover:rotate-0",
  "rotate-[1.6deg] hover:rotate-0",
  "rotate-[-1.2deg] hover:rotate-0",
  "rotate-[0.6deg] hover:rotate-0",
];

type NoteFilter = "ALL" | "FOR_ME" | "BY_ME";

export function CoupleNotesCard({ accessToken }: { accessToken: string }) {
  const { showToast } = useToast();
  const { activeFamily, isPersonal } = useFamilyContext();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [notes, setNotes] = useState<CoupleNoteResponse[]>([]);
  const [content, setContent] = useState("");
  const [urgency, setUrgency] = useState<NoteUrgency>("attention");
  const [recipientUserId, setRecipientUserId] = useState<string>("");
  const [noteFilter, setNoteFilter] = useState<NoteFilter>("ALL");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [noteToResolve, setNoteToResolve] = useState<CoupleNoteResponse | null>(null);
  const [resolving, setResolving] = useState(false);

  const loadNotes = useCallback(async () => {
    if (!activeFamily || isPersonal) {
      setNotes([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const session = await getValidSession();
      if (session) {
        setCurrentUserId(session.user.id);
      }

      const data = await listCoupleNotes(accessToken, activeFamily.id, true);
      setNotes(data);
    } catch {
      // Silencioso em caso de erro inicial
    } finally {
      setLoading(false);
    }
  }, [accessToken, activeFamily, isPersonal]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // Sincronização em tempo real via WebSocket
  useEffect(() => {
    const unsubscribe = subscribeToFamilyEvents((event) => {
      if (event.type.startsWith("COUPLE_NOTE_")) {
        loadNotes();
      }
    });
    return unsubscribe;
  }, [loadNotes]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !activeFamily) return;
    try {
      setSubmitting(true);
      const newNote = await createCoupleNote(accessToken, {
        familyId: activeFamily.id,
        content: content.trim(),
        color: urgency,
        category: "RECADO",
        pinned: true,
        recipientUserId: recipientUserId ? recipientUserId : undefined,
      });
      setNotes((prev) => [newNote, ...prev]);
      setContent("");
      setRecipientUserId("");
      showToast("Bilhetinho colocado no mural com carinho!", "success");
    } catch {
      showToast("Não foi possível postar o recado.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcknowledge = async (id: string) => {
    try {
      const updated = await acknowledgeCoupleNote(accessToken, id);
      setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
      showToast("Visto confirmado no bilhete!", "success");
    } catch {
      showToast("Erro ao registrar visualização.", "error");
    }
  };

  const confirmResolve = async () => {
    if (!noteToResolve) return;
    try {
      setResolving(true);
      await resolveCoupleNote(accessToken, noteToResolve.id, true);
      setNotes((prev) => prev.filter((n) => n.id !== noteToResolve.id));
      setNoteToResolve(null);
      showToast("Recado arquivado com sucesso!", "info");
    } catch {
      showToast("Não foi possível arquivar o recado.", "error");
    } finally {
      setResolving(false);
    }
  };

  if (isPersonal) {
    return (
      <PaperCard className="lg:col-span-12" tape="orange">
        <div className="flex items-center gap-3 py-6 text-center justify-center flex-col text-stone-500">
          <User className="w-8 h-8 text-stone-400 mx-auto stroke-[1.75]" />
          <p className="font-display font-bold text-base text-stone-800 dark:text-stone-200">
            Você está no seu Espaço Pessoal Solo
          </p>
          <p className="text-xs text-stone-400 max-w-sm">
            O Mural de Bilhetes é uma funcionalidade colaborativa. Selecione sua família no topo para ver e deixar recados!
          </p>
        </div>
      </PaperCard>
    );
  }

  if (!activeFamily) return null;

  // Filtragem dos bilhetes
  const filteredNotes = notes.filter((n) => {
    if (noteFilter === "FOR_ME") {
      return n.recipientUserId === currentUserId;
    }
    if (noteFilter === "BY_ME") {
      return n.authorId === currentUserId;
    }
    return true;
  });

  const notesForMeCount = notes.filter((n) => n.recipientUserId === currentUserId).length;
  const notesByMeCount = notes.filter((n) => n.authorId === currentUserId).length;

  return (
    <PaperCard className="lg:col-span-12" tape="orange">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200/80 dark:border-stone-800 pb-4">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5"><HeartHandshake className="w-5 h-5 text-amber-800 dark:text-amber-300 stroke-[1.75]" /> Mural de Bilhetes do Lar</span>
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Recados rápidos, carinhos e avisos importantes entre os membros de <strong>{activeFamily.name}</strong>.
          </p>
        </div>

        {/* Filtros rápidos estilo Pills */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setNoteFilter("ALL")}
            className={`px-3 py-1 rounded-xl font-bold transition-all ${
              noteFilter === "ALL"
                ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-sm"
                : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200"
            }`}
          >
            Todos ({notes.length})
          </button>
          <button
            type="button"
            onClick={() => setNoteFilter("FOR_ME")}
            className={`px-3 py-1 rounded-xl font-bold transition-all ${
              noteFilter === "FOR_ME"
                ? "bg-rose-500 text-white shadow-sm"
                : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200"
            }`}
          >
            Para Mim ({notesForMeCount})
          </button>
          <button
            type="button"
            onClick={() => setNoteFilter("BY_ME")}
            className={`px-3 py-1 rounded-xl font-bold transition-all ${
              noteFilter === "BY_ME"
                ? "bg-primary text-white shadow-sm"
                : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200"
            }`}
          >
            Meus Bilhetes ({notesByMeCount})
          </button>
        </div>
      </div>

      {/* Formulário para adicionar bilhete com escolha de destinatário */}
      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Deixe um bilhete carinhoso ou recado importante..."
            className="flex-1 rounded-xl border border-stone-300 dark:border-stone-700 bg-white/95 dark:bg-stone-800/90 px-4 py-2.5 text-sm font-medium text-stone-900 dark:text-stone-100 shadow-sm placeholder:text-stone-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            required
          />

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Escolha do Destinatário */}
            <select
              value={recipientUserId}
              onChange={(e) => setRecipientUserId(e.target.value)}
              className="rounded-xl border border-stone-300 dark:border-stone-700 bg-white/95 dark:bg-stone-800 px-3 py-2.5 text-xs font-bold text-stone-800 dark:text-stone-200 shadow-sm focus:border-primary focus:outline-none cursor-pointer"
            >
              <option value="">Para: Toda a Família</option>
              {activeFamily.members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  Para: {m.userName}
                </option>
              ))}
            </select>

            {/* Nível de Urgência / Cor do Post-it */}
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value as NoteUrgency)}
              className="rounded-xl border border-stone-300 dark:border-stone-700 bg-white/95 dark:bg-stone-800 px-3 py-2.5 text-xs font-bold text-stone-800 dark:text-stone-200 shadow-sm focus:border-primary focus:outline-none cursor-pointer"
            >
              {Object.values(URGENCY_CONFIGS).map((cfg) => (
                <option key={cfg.id} value={cfg.id}>
                  {cfg.label}
                </option>
              ))}
            </select>

            <ActionButton type="submit" disabled={submitting} variant="primary">
              {submitting ? "Postando..." : "Colar Bilhete"}
            </ActionButton>
          </div>
        </div>
      </form>

      {/* Grid de Post-its Coloridos */}
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 pt-2">
        {loading ? (
          <p className="text-xs text-stone-500">Carregando mural...</p>
        ) : filteredNotes.length === 0 ? (
          <div className="col-span-full rounded-2xl border-2 border-dashed border-stone-300 dark:border-stone-700 bg-white/50 dark:bg-stone-800/40 p-8 text-center text-xs text-stone-500 dark:text-stone-400 font-medium">
            Nenhum recado encontrado neste filtro. Que tal deixar um bilhete afetuoso agora?
          </div>
        ) : (
          filteredNotes.map((note, index) => {
            const cfg = getNoteUrgencyConfig(note.color);
            const rotationClass = POST_IT_ROTATIONS[index % POST_IT_ROTATIONS.length];
            const isAuthor = currentUserId ? note.authorId === currentUserId : false;

            return (
              <div
                key={note.id}
                className={`post-it-note relative flex min-h-[170px] flex-col justify-between rounded-2xl border-2 p-5 shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${cfg.bg} ${cfg.border} ${rotationClass}`}
              >
                {/* Washi Tape */}
                <div
                  className={`washi-tape ${cfg.tapeBg}`}
                  style={{
                    position: "absolute",
                    top: "-13px",
                    left: "50%",
                    transform: "translateX(-50%) rotate(-1deg)",
                    zIndex: 10,
                    width: "84px",
                    height: "22px",
                    clipPath: "polygon(0 0, 100% 0, 96% 100%, 76% 82%, 58% 100%, 38% 82%, 18% 100%, 0 82%)",
                    opacity: 0.82,
                    border: "1px solid rgba(121, 87, 63, 0.15)",
                  }}
                  aria-hidden="true"
                />

                <div>
                  {/* Topo do Post-it */}
                  <div className="flex items-center justify-between gap-2 border-b border-black/5 pb-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-xs font-bold ${cfg.titleColor}`}>
                        <span className="inline-flex items-center gap-1"><PenLine className="w-3 h-3" /> {note.authorName}</span>
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${cfg.badgeColor}`}
                      >
                        {cfg.badge}
                      </span>

                      {/* Destinatário */}
                      {note.recipientUserName ? (
                        <span className="rounded-full bg-rose-100/90 text-rose-800 border border-rose-200 px-2 py-0.5 text-[10px] font-extrabold">
                          <span className="inline-flex items-center gap-1"><Heart className="w-3 h-3 text-rose-500" /> Para: {note.recipientUserName}</span>
                        </span>
                      ) : (
                        <span className="rounded-full bg-stone-100/90 text-stone-700 border border-stone-200 px-2 py-0.5 text-[10px] font-medium">
                          Para todos
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setNoteToResolve(note)}
                      className="rounded-full p-1 text-stone-400 hover:text-stone-700 hover:bg-black/5 transition-colors cursor-pointer"
                      title="Arquivar recado"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Conteúdo com Caligrafia Gochi Hand */}
                  <div className="py-2 px-1">
                    <p
                      className="font-hand text-2xl sm:text-3xl font-extrabold leading-snug break-words whitespace-pre-wrap select-text"
                      style={{ color: "#1c1917" }}
                    >
                      {note.content}
                    </p>
                  </div>
                </div>

                {/* Rodapé do Post-it */}
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-black/5 text-xs">
                  {isAuthor ? (
                    note.acknowledgedAt &&
                    note.acknowledgedByName &&
                    note.acknowledgedByName.toLowerCase() !== note.authorName.toLowerCase() ? (
                      <span suppressHydrationWarning className="flex items-center gap-1.5 font-bold text-pink-700 bg-pink-100/90 px-2.5 py-1 rounded-full border border-pink-200 text-[11px] shadow-sm">
                        <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 shrink-0 inline mr-1" /> Visto por {note.acknowledgedByName} às{" "}
                        {new Date(note.acknowledgedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-[11px] font-semibold text-stone-500 bg-white/70 px-2.5 py-1 rounded-full border border-stone-200/60 shadow-xs">
                        <span className="inline-flex items-center gap-1 text-stone-400"><Clock className="w-3 h-3" /> Aguardando visto...</span>
                      </span>
                    )
                  ) : note.acknowledgedAt ? (
                    <span className="flex items-center gap-1.5 font-bold text-emerald-800 bg-emerald-100/90 px-2.5 py-1 rounded-full border border-emerald-200 text-[11px] shadow-sm">
                      <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400"><Check className="w-3 h-3 stroke-[2]" /> Você visualizou este bilhete</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleAcknowledge(note.id)}
                      className="flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 border border-rose-300 hover:bg-rose-100 transition-colors shadow-xs"
                    >
                      <span className="inline-flex items-center gap-1"><Heart className="w-3 h-3" /> Marcar como Visto</span>
                    </button>
                  )}

                  <span suppressHydrationWarning className="text-[10px] text-stone-500 font-medium">
                    {new Date(note.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <ConfirmDialog
        isOpen={Boolean(noteToResolve)}
        title="Arquivar Recado do Mural"
        description="Tem certeza que deseja arquivar este recado? Ele sairá da visualização ativa do mural."
        confirmLabel="Sim, arquivar"
        cancelLabel="Voltar"
        variant="warning"
        loading={resolving}
        onConfirm={confirmResolve}
        onClose={() => setNoteToResolve(null)}
      />
    </PaperCard>
  );
}
