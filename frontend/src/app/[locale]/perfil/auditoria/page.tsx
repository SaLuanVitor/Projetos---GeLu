"use client";

import { AppShell } from "@/components/layout/AppShell";
import { ActionLink } from "@/components/ui/ActionButton";
import { NotebookPageHeader } from "@/components/ui/Notebook";
import { PaperCard } from "@/components/ui/PaperCard";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "@/i18n/navigation";
import { getValidSession, handleInvalidSession } from "@/services/auth";
import { listSystemAuditLogs } from "@/services/audit";
import type { AuditLogResponse } from "@/types/api";
import { useCallback, useEffect, useMemo, useState } from "react";

const ACTION_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  CREATE: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-800 dark:text-emerald-300",
    border: "border-emerald-300 dark:border-emerald-800",
  },
  UPDATE: {
    bg: "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-800 dark:text-blue-300",
    border: "border-blue-300 dark:border-blue-800",
  },
  DELETE: {
    bg: "bg-red-50 dark:bg-red-950/40",
    text: "text-red-800 dark:text-red-300",
    border: "border-red-300 dark:border-red-800",
  },
  ROLE_CHANGE: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-800 dark:text-amber-300",
    border: "border-amber-300 dark:border-amber-800",
  },
  ACKNOWLEDGE: {
    bg: "bg-pink-50 dark:bg-pink-950/40",
    text: "text-pink-800 dark:text-pink-300",
    border: "border-pink-300 dark:border-pink-800",
  },
};

export default function SystemAuditPage() {
  const router = useRouter();
  const toast = useToast();
  const [logs, setLogs] = useState<AuditLogResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState<string>("ALL");
  const [selectedAction, setSelectedAction] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const session = await getValidSession();
      if (!session) {
        router.replace("/login");
        return;
      }

      const data = await listSystemAuditLogs(session.accessToken);
      setLogs(data);
    } catch (err) {
      if (handleInvalidSession(err, () => router.replace("/login"))) return;
      toast.error("Não foi possível carregar a auditoria.");
    } finally {
      setLoading(false);
    }
  }, [router, toast]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (selectedEntity !== "ALL" && log.entityType !== selectedEntity) return false;
      if (selectedAction !== "ALL" && log.action !== selectedAction) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesDetails = log.details.toLowerCase().includes(q);
        const matchesUser = log.userName.toLowerCase().includes(q);
        const matchesType = log.entityType.toLowerCase().includes(q);
        if (!matchesDetails && !matchesUser && !matchesType) return false;
      }
      return true;
    });
  }, [logs, selectedEntity, selectedAction, search]);

  const uniqueEntities = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => set.add(l.entityType));
    return Array.from(set);
  }, [logs]);

  return (
    <AppShell>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 dark:border-stone-800 pb-6 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-3xl">📜</span>
              <h1 className="font-display text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
                Auditoria do Sistema
              </h1>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-xl">
              Registro cronológico e imutável de todas as ações, cadastros, alterações e exclusões realizadas no sistema da sua família.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <ActionLink href="/perfil" variant="outline">
              ◀ Voltar ao Perfil
            </ActionLink>
          </div>
        </div>

        {/* Filtros de Auditoria */}
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 block mb-1">
              Módulo / Entidade
            </label>
            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-xs font-bold text-stone-800 dark:text-stone-200 shadow-sm focus:border-amber-600 focus:outline-none"
            >
              <option value="ALL">Todos os Módulos</option>
              {uniqueEntities.map((ent) => (
                <option key={ent} value={ent}>
                  {ent}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 block mb-1">
              Tipo de Ação
            </label>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-xs font-bold text-stone-800 dark:text-stone-200 shadow-sm focus:border-amber-600 focus:outline-none"
            >
              <option value="ALL">Todas as Ações</option>
              <option value="CREATE">Criação (CREATE)</option>
              <option value="UPDATE">Alteração (UPDATE)</option>
              <option value="DELETE">Exclusão (DELETE)</option>
              <option value="ROLE_CHANGE">Permissão (ROLE_CHANGE)</option>
              <option value="ACKNOWLEDGE">Visualização (ACKNOWLEDGE)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 block mb-1">
              Buscar nos Detalhes
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ex: Nome da receita, membro..."
              className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-xs font-medium text-stone-900 dark:text-stone-100 shadow-sm placeholder:text-stone-400 focus:border-amber-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Tabela / Lista de Eventos de Auditoria */}
        <PaperCard className="p-6" tape="orange">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-200/80 dark:border-stone-800">
            <h3 className="font-display text-xl font-bold text-stone-900 dark:text-stone-100">
              Histórico ({filteredLogs.length} eventos)
            </h3>
            <button
              type="button"
              onClick={loadLogs}
              className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
            >
              🔄 Atualizar
            </button>
          </div>

          {loading ? (
            <StatusMessage>Carregando registros de auditoria...</StatusMessage>
          ) : filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-xs text-stone-500 dark:text-stone-400">
              Nenhum registro de auditoria encontrado para os filtros selecionados.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log) => {
                const color = ACTION_COLORS[log.action] || {
                  bg: "bg-stone-100 dark:bg-stone-800",
                  text: "text-stone-700 dark:text-stone-300",
                  border: "border-stone-300 dark:border-stone-700",
                };

                return (
                  <div
                    key={log.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 p-4 shadow-2xs hover:bg-white dark:hover:bg-stone-900 transition-all"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span
                          className={`rounded-lg px-2 py-0.5 text-[10px] font-extrabold tracking-wider border ${color.bg} ${color.text} ${color.border}`}
                        >
                          {log.action}
                        </span>
                        <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400">
                          [{log.entityType}]
                        </span>
                        <span className="text-xs font-bold text-stone-900 dark:text-stone-200">
                          {log.userName}
                        </span>
                      </div>

                      <p className="text-xs text-stone-800 dark:text-stone-300 leading-relaxed break-words">
                        {log.details}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">
                        {new Date(log.createdAt).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </PaperCard>
      </main>
    </AppShell>
  );
}
