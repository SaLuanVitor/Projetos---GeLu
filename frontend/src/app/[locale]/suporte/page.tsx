"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PaperCard } from "@/components/ui/PaperCard";
import { ActionButton } from "@/components/ui/ActionButton";
import { NotebookPageHeader } from "@/components/ui/Notebook";
import { Modal } from "@/components/ui/Modal";
import { TextInput, SelectField, TextAreaField } from "@/components/ui/FormField";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { useToast } from "@/components/ui/Toast";
import {
  HelpCircle,
  Megaphone,
  Phone,
  Clock,
  Mail,
  MessageSquare,
  ListOrdered,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Hourglass,
} from "lucide-react";
import { getValidSession } from "@/services/auth";
import {
  getPublicSupportSettings,
  getMySupportTickets,
  createSupportTicket,
} from "@/services/support";
import type {
  PublicSupportSettingsResponse,
  SupportTicketResponse,
} from "@/types/api";

const TICKET_CATEGORIES = [
  { label: "Dúvida sobre o Sistema", value: "DUVIDA" },
  { label: "Sugestão de Melhoria", value: "SUGESTAO" },
  { label: "Problema Técnico ou Inconsistência", value: "PROBLEMA" },
  { label: "Dúvida de Dieta ou Receita", value: "NUTRICAO" },
  { label: "Outro Assunto", value: "OUTRO" },
];

export default function SuportePage() {
  const { showToast } = useToast();
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<PublicSupportSettingsResponse | null>(null);
  const [myTickets, setMyTickets] = useState<SupportTicketResponse[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modal de abertura de chamado
  const [modalOpen, setModalOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("DUVIDA");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const pubSettings = await getPublicSupportSettings();
      setSettings(pubSettings);

      const session = await getValidSession();
      if (session) {
        setSessionToken(session.accessToken);
        const tickets = await getMySupportTickets(session.accessToken);
        setMyTickets(tickets);
      }
    } catch (err: unknown) {
      console.error("Erro ao carregar suporte:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      setFormError("Preencha o assunto e a descrição do seu chamado.");
      return;
    }
    if (!sessionToken) {
      setFormError("Você precisa estar conectado para abrir um chamado.");
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      const created = await createSupportTicket(sessionToken, {
        subject: subject.trim(),
        category,
        description: description.trim(),
      });
      showToast(`Seu chamado "${created.subject}" foi registrado com sucesso.`, "success");
      setSubject("");
      setDescription("");
      setCategory("DUVIDA");
      setModalOpen(false);
      loadData();
    } catch (err: unknown) {
      setFormError(
        err instanceof Error ? err.message : "Erro ao abrir chamado de suporte."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTickets = myTickets.filter((t) => {
    if (statusFilter === "ALL") return true;
    return t.status === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "RESOLVED":
        return {
          label: "Resolvido",
          bg: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
        };
      case "IN_PROGRESS":
        return {
          label: "Em Andamento",
          bg: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
        };
      default:
        return {
          label: "Aberto",
          bg: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
        };
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-8 pb-12">
        <NotebookPageHeader
          eyebrow="ATENDIMENTO AO USUÁRIO & FEEDBACK"
          title="Central de Ajuda & Suporte"
          subtitle="Tire dúvidas, envie sugestões de melhorias ou relate problemas para nossa equipe."
          action={
            <ActionButton
              onClick={() => {
                setFormError(null);
                setModalOpen(true);
              }}
              variant="primary"
            >
              + Abrir Chamado / Sugestão
            </ActionButton>
          }
        />

        {settings?.systemBroadcastBanner && (
          <div className="p-4 rounded-xl border-2 border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-sm font-semibold flex items-center gap-3 shadow-sm">
            <Megaphone className="w-5 h-5 text-amber-800 dark:text-amber-300 stroke-[1.75]" />
            <p>{settings.systemBroadcastBanner}</p>
          </div>
        )}

        {/* Canais Oficiais de Contato Direto */}
        <PaperCard tape="orange">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-surface-variant">
            <div>
              <h2 className="font-display text-xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5"><Phone className="w-4 h-4 text-amber-800 dark:text-amber-300" /> Canais de Atendimento Direto</span>
              </h2>
              <p className="text-xs text-stone-600 dark:text-stone-300 mt-1">
                Prefere conversar diretamente com a equipe do GeLu? Fale conosco pelos canais abaixo:
              </p>
            </div>
            {settings?.supportHours && (
              <span className="text-xs px-3 py-1.5 rounded-full border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium">
                <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {settings.supportHours}</span>
              </span>
            )}
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {settings?.supportEmail && (
              <a
                href={`mailto:${settings.supportEmail}`}
                className="flex items-center gap-3 p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 hover:border-primary/50 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center text-lg shrink-0">
                  <Mail className="w-4 h-4 text-amber-800 dark:text-amber-300" />
                </div>
                <div>
                  <div className="text-xs text-stone-500 dark:text-stone-400 font-semibold uppercase tracking-wider">
                    E-mail Oficial
                  </div>
                  <div className="text-sm font-bold text-stone-800 dark:text-stone-200 group-hover:text-primary transition-colors">
                    {settings.supportEmail}
                  </div>
                </div>
              </a>
            )}

            {settings?.supportWhatsapp && (
              <a
                href={`https://wa.me/${settings.supportWhatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 hover:border-emerald-500/50 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg shrink-0">
                  <MessageSquare className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                </div>
                <div>
                  <div className="text-xs text-stone-500 dark:text-stone-400 font-semibold uppercase tracking-wider">
                    WhatsApp & Telefone
                  </div>
                  <div className="text-sm font-bold text-stone-800 dark:text-stone-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {settings.supportPhone || settings.supportWhatsapp}
                  </div>
                </div>
              </a>
            )}
          </div>
        </PaperCard>

        {/* Meus Chamados & Sugestões */}
        <PaperCard tape="orange">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-surface-variant">
            <div>
              <h2 className="font-display text-xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5"><ListOrdered className="w-4 h-4 text-amber-800 dark:text-amber-300" /> Minhas Solicitações & Sugestões</span>
              </h2>
              <p className="text-xs text-stone-600 dark:text-stone-300 mt-1">
                Acompanhe o andamento das suas mensagens e as respostas da nossa equipe.
              </p>
            </div>

            <div className="flex gap-2">
              {[
                { label: "Todos", value: "ALL" },
                { label: "Abertos", value: "OPEN" },
                { label: "Em Andamento", value: "IN_PROGRESS" },
                { label: "Resolvidos", value: "RESOLVED" },
              ].map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setStatusFilter(f.value)}
                  className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                    statusFilter === f.value
                      ? "border-primary bg-primary text-white"
                      : "border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-600 dark:text-stone-300 hover:border-stone-400"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {loading ? (
              <div className="text-center py-10 text-stone-400 text-sm">
                Carregando seus chamados...
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="text-center py-10 text-stone-500 dark:text-stone-400 text-sm bg-stone-50/50 dark:bg-stone-900/30 rounded-xl border border-dashed border-stone-300 dark:border-stone-800">
                Você ainda não abriu nenhuma solicitação com o filtro selecionado.
                <div className="mt-3">
                  <button
                    onClick={() => setModalOpen(true)}
                    className="text-primary hover:underline font-bold text-xs"
                  >
                    + Clique aqui para enviar uma mensagem
                  </button>
                </div>
              </div>
            ) : (
              filteredTickets.map((t) => {
                const badge = getStatusBadge(t.status);
                return (
                  <div
                    key={t.id}
                    className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-surface dark:bg-stone-900/40 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.bg}`}
                        >
                          {badge.label}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-semibold uppercase">
                          {t.category}
                        </span>
                      </div>
                      <span className="text-xs text-stone-400">
                        {new Date(t.createdAt).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <h3 className="font-display font-bold text-base text-stone-900 dark:text-stone-100">
                      {t.subject}
                    </h3>
                    <p className="text-sm text-stone-700 dark:text-stone-300 whitespace-pre-line">
                      {t.description}
                    </p>

                    {t.adminNotes && (
                      <div className="mt-3 p-4 rounded-xl border-l-4 border-l-primary bg-primary/5 dark:bg-primary/10 border-t border-r border-b border-stone-200 dark:border-stone-800 text-sm">
                        <div className="font-bold text-xs text-primary uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-stone-600" /> Resposta da Equipe:</span>
                        </div>
                        <p className="text-stone-800 dark:text-stone-200 whitespace-pre-line">
                          {t.adminNotes}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </PaperCard>

        {/* Modal de Abertura de Chamado */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Abrir Chamado / Sugestão"
          subtitle="Conte-nos o que você precisa ou como podemos melhorar sua experiência no GeLu."
        >
          <form onSubmit={handleOpenTicket} className="space-y-4">
            {formError && <StatusMessage variant="error">{formError}</StatusMessage>}

            <SelectField
              id="category"
              label="Categoria do Assunto"
              value={category}
              onValueChange={setCategory}
              options={TICKET_CATEGORIES}
              required
            />

            <TextInput
              id="subject"
              label="Assunto / Título do Chamado"
              placeholder="Ex: Sugestão para o cardápio de sábado, Dúvida no balanço calórico..."
              value={subject}
              onValueChange={setSubject}
              required
            />

            <TextAreaField
              id="description"
              label="Mensagem / Detalhes"
              placeholder="Descreva com detalhes sua dúvida, ideia ou problema..."
              value={description}
              onValueChange={setDescription}
              rows={4}
              required
            />

            <div className="flex justify-end gap-3 pt-3 border-t border-surface-variant">
              <ActionButton
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
              >
                Cancelar
              </ActionButton>
              <ActionButton
                type="submit"
                variant="primary"
                disabled={submitting}
              >
                {submitting ? "Enviando..." : "Enviar Solicitação"}
              </ActionButton>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
