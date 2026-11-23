"use client";

import { AppShell } from "@/components/layout/AppShell";
import { ActionButton } from "@/components/ui/ActionButton";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TextInput, SelectField } from "@/components/ui/FormField";
import { NotebookPageHeader } from "@/components/ui/Notebook";
import { PaperCard } from "@/components/ui/PaperCard";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { useToast } from "@/components/ui/Toast";
import { getValidSession, handleInvalidSession } from "@/services/auth";
import {
  addFamilyMember,
  cancelFamilyInvite,
  createFamily,
  createFamilyInvite,
  deleteFamily,
  listFamilies,
  listFamilyInvites,
  removeFamilyMember,
  updateFamily,
} from "@/services/families";
import { listFamilyAuditLogs } from "@/services/audit";
import { getLocalizedApiError } from "@/services/localized-error";
import type {
  FamilyResponse,
  FamilyMemberResponse,
  AuditLogResponse,
  FamilyInviteResponse,
} from "@/types/api";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";

export default function FamilyPage() {
  const router = useRouter();
  const toast = useToast();
  const t = useTranslations("Family");
  const errors = useTranslations("CommonErrors");
  const fallbackError = errors("requestError");

  const [families, setFamilies] = useState<FamilyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modais de Formulário
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState("");
  const [creating, setCreating] = useState(false);

  const [editingFamily, setEditingFamily] = useState<FamilyResponse | null>(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);

  const [addMemberFamily, setAddMemberFamily] = useState<FamilyResponse | null>(null);
  const [addMemberEmail, setAddMemberEmail] = useState("");
  const [addMemberRole, setAddMemberRole] = useState("MEMBER");
  const [addingMember, setAddingMember] = useState(false);

  // Modais de Confirmação Destrutiva
  const [familyToDelete, setFamilyToDelete] = useState<FamilyResponse | null>(null);
  const [deletingFamily, setDeletingFamily] = useState(false);

  const [memberToRemove, setMemberToRemove] = useState<{
    familyId: string;
    familyName: string;
    member: FamilyMemberResponse;
  } | null>(null);
  const [removingMember, setRemovingMember] = useState(false);

  // Modal de Histórico e Auditoria
  const [auditFamily, setAuditFamily] = useState<FamilyResponse | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogResponse[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Convites por E-mail & Link (Sprint 6)
  const [inviteModalFamily, setInviteModalFamily] = useState<FamilyResponse | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");
  const [sendingInvite, setSendingInvite] = useState(false);
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(null);
  const [familyInvites, setFamilyInvites] = useState<Record<string, FamilyInviteResponse[]>>({});

  const loadInvites = useCallback(async (famId: string) => {
    try {
      const session = await getValidSession();
      if (!session) return;
      const data = await listFamilyInvites(session.accessToken, famId);
      setFamilyInvites((prev) => ({ ...prev, [famId]: data }));
    } catch {
      // Silencioso se não tiver permissão
    }
  }, []);

  const handleOpenAudit = async (fam: FamilyResponse) => {
    setAuditFamily(fam);
    setLoadingAudit(true);
    try {
      const session = await getValidSession();
      if (!session) return;
      const logs = await listFamilyAuditLogs(session.accessToken, fam.id);
      setAuditLogs(logs);
    } catch {
      toast.error("Não foi possível carregar o histórico.");
    } finally {
      setLoadingAudit(false);
    }
  };

  const loadFamilies = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const session = await getValidSession();
      if (!session) {
        router.replace("/login");
        return;
      }
      const data = await listFamilies(session.accessToken);
      setFamilies(data);
      for (const fam of data) {
        loadInvites(fam.id);
      }
    } catch (err) {
      if (handleInvalidSession(err, () => router.replace("/login"))) return;
      setError(getLocalizedApiError(err, errors, fallbackError));
    } finally {
      setLoading(false);
    }
  }, [router, errors, fallbackError, loadInvites]);

  useEffect(() => {
    loadFamilies();
  }, [loadFamilies]);

  const handleSendInvite = async (e: FormEvent) => {
    e.preventDefault();
    if (!inviteModalFamily || !inviteEmail.trim()) return;
    try {
      setSendingInvite(true);
      const session = await getValidSession();
      if (!session) return;
      const res = await createFamilyInvite(session.accessToken, inviteModalFamily.id, {
        invitedEmail: inviteEmail.trim(),
        role: inviteRole,
      });
      const link = `${window.location.origin}/convite/${res.token}`;
      setGeneratedInviteLink(link);
      toast.success("Convite gerado com sucesso! Copie o link abaixo para enviar.");
      await loadInvites(inviteModalFamily.id);
    } catch (err) {
      if (handleInvalidSession(err, () => router.replace("/login"))) return;
      toast.error(getLocalizedApiError(err, errors, fallbackError));
    } finally {
      setSendingInvite(false);
    }
  };

  const handleCancelInvite = async (famId: string, inviteId: string) => {
    try {
      const session = await getValidSession();
      if (!session) return;
      await cancelFamilyInvite(session.accessToken, famId, inviteId);
      toast.success("Convite cancelado!");
      await loadInvites(famId);
    } catch (err) {
      if (handleInvalidSession(err, () => router.replace("/login"))) return;
      toast.error(getLocalizedApiError(err, errors, fallbackError));
    }
  };

  // Criar Família
  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!newFamilyName.trim()) return;
    try {
      setCreating(true);
      const session = await getValidSession();
      if (!session) {
        router.replace("/login");
        return;
      }
      await createFamily(session.accessToken, { name: newFamilyName.trim() });
      setNewFamilyName("");
      setIsCreateOpen(false);
      toast.success("Família criada com sucesso!");
      await loadFamilies();
    } catch (err) {
      if (handleInvalidSession(err, () => router.replace("/login"))) return;
      toast.error(getLocalizedApiError(err, errors, fallbackError));
    } finally {
      setCreating(false);
    }
  };

  // Atualizar Nome da Família
  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingFamily || !editName.trim()) return;
    try {
      setSaving(true);
      const session = await getValidSession();
      if (!session) {
        router.replace("/login");
        return;
      }
      await updateFamily(session.accessToken, editingFamily.id, {
        name: editName.trim(),
      });
      setEditingFamily(null);
      setEditName("");
      toast.success("Família atualizada com sucesso!");
      await loadFamilies();
    } catch (err) {
      if (handleInvalidSession(err, () => router.replace("/login"))) return;
      toast.error(getLocalizedApiError(err, errors, fallbackError));
    } finally {
      setSaving(false);
    }
  };

  // Excluir Família (com Confirmação)
  const confirmDeleteFamily = async () => {
    if (!familyToDelete) return;
    try {
      setDeletingFamily(true);
      const session = await getValidSession();
      if (!session) {
        router.replace("/login");
        return;
      }
      await deleteFamily(session.accessToken, familyToDelete.id);
      setFamilyToDelete(null);
      toast.success("Família excluída com sucesso!");
      await loadFamilies();
    } catch (err) {
      if (handleInvalidSession(err, () => router.replace("/login"))) return;
      toast.error(getLocalizedApiError(err, errors, fallbackError));
    } finally {
      setDeletingFamily(false);
    }
  };

  // Adicionar Membro
  const handleAddMember = async (e: FormEvent) => {
    e.preventDefault();
    if (!addMemberFamily || !addMemberEmail.trim()) return;
    try {
      setAddingMember(true);
      const session = await getValidSession();
      if (!session) {
        router.replace("/login");
        return;
      }
      await addFamilyMember(session.accessToken, addMemberFamily.id, {
        userId: addMemberEmail.trim(),
        role: addMemberRole,
      });
      setAddMemberFamily(null);
      setAddMemberEmail("");
      setAddMemberRole("MEMBER");
      toast.success("Membro adicionado com sucesso!");
      await loadFamilies();
    } catch (err) {
      if (handleInvalidSession(err, () => router.replace("/login"))) return;
      toast.error(getLocalizedApiError(err, errors, fallbackError));
    } finally {
      setAddingMember(false);
    }
  };

  // Remover Membro (com Confirmação)
  const confirmRemoveMember = async () => {
    if (!memberToRemove) return;
    try {
      setRemovingMember(true);
      const session = await getValidSession();
      if (!session) {
        router.replace("/login");
        return;
      }
      await removeFamilyMember(
        session.accessToken,
        memberToRemove.familyId,
        memberToRemove.member.userId
      );
      setMemberToRemove(null);
      toast.success("Membro removido da família!");
      await loadFamilies();
    } catch (err) {
      if (handleInvalidSession(err, () => router.replace("/login"))) return;
      toast.error(getLocalizedApiError(err, errors, fallbackError));
    } finally {
      setRemovingMember(false);
    }
  };

  return (
    <AppShell>
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200/80 pb-6 mb-8">
          <NotebookPageHeader title={t("title")} subtitle={t("subtitle")} />

          <ActionButton
            type="button"
            onClick={() => {
              setNewFamilyName("");
              setIsCreateOpen(true);
            }}
            className="self-start sm:self-auto shrink-0 shadow-md"
          >
            + {t("createFamily")}
          </ActionButton>
        </div>

        {error && <StatusMessage variant="error">{error}</StatusMessage>}

        {loading ? (
          <StatusMessage>{t("loading")}</StatusMessage>
        ) : families.length === 0 ? (
          <PaperCard className="p-10 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-100 text-amber-700">
              <svg
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.7"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                />
              </svg>
            </div>
            <h3 className="font-display text-xl font-bold text-stone-900">
              {t("noFamilies")}
            </h3>
            <p className="mt-2 text-sm text-stone-500 max-w-md mx-auto">
              {t("noFamiliesHint")}
            </p>
            <div className="mt-6">
              <ActionButton
                type="button"
                onClick={() => {
                  setNewFamilyName("");
                  setIsCreateOpen(true);
                }}
              >
                {t("createFamily")}
              </ActionButton>
            </div>
          </PaperCard>
        ) : (
          <div className="space-y-6">
            {families.map((family) => (
              <PaperCard key={family.id} className="p-6 transition-all">
                {/* Header do Card da Família */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/70 pb-4">
                  <div>
                    <h3 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                      <span>🏡</span> {family.name}
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                      {family.members.length}{" "}
                      {family.members.length === 1 ? "membro" : "membros"} • Criada
                      em{" "}
                      {new Date(family.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => handleOpenAudit(family)}
                      className="rounded-xl border border-stone-300 dark:border-stone-700 bg-white/90 dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-700 px-3 py-1.5 text-xs font-bold transition-colors shadow-sm cursor-pointer"
                    >
                      📜 Histórico
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingFamily(family);
                        setEditName(family.name);
                      }}
                      className="rounded-xl border border-stone-300 dark:border-stone-700 bg-white/90 dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-700 px-3 py-1.5 text-xs font-bold transition-colors shadow-sm cursor-pointer"
                    >
                      ✏️ {t("edit")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFamilyToDelete(family)}
                      className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/80 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60 px-3 py-1.5 text-xs font-bold transition-colors shadow-sm cursor-pointer"
                    >
                      🗑️ {t("delete")}
                    </button>
                  </div>
                </div>

                {/* Lista de Membros */}
                <div className="mt-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                      {t("members")} ({family.members.length})
                    </h4>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setInviteModalFamily(family);
                          setInviteEmail("");
                          setInviteRole("MEMBER");
                          setGeneratedInviteLink(null);
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200/80 dark:hover:bg-amber-900/60 px-3 py-1.5 rounded-xl transition-colors border border-amber-300 dark:border-amber-800 cursor-pointer shadow-xs"
                      >
                        <span>💌</span> Convidar por E-mail
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAddMemberFamily(family);
                          setAddMemberEmail("");
                          setAddMemberRole("MEMBER");
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200/80 dark:hover:bg-stone-700 px-3 py-1.5 rounded-xl transition-colors border border-stone-200 dark:border-stone-700 cursor-pointer shadow-xs"
                      >
                        <span>+</span> Adicionar Direto
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {family.members.map((member: FamilyMemberResponse) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between rounded-2xl border border-stone-200/80 dark:border-stone-700/80 bg-white/90 dark:bg-[#25201c] p-3.5 shadow-sm transition-all hover:bg-white dark:hover:bg-[#2c2622]"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
                            {member.userName}
                          </p>
                          <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                            {member.userEmail}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`rounded-lg px-2 py-0.5 text-[11px] font-bold tracking-wider ${
                              member.role === "ADMIN"
                                ? "bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                                : member.role === "EDITOR"
                                ? "bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                                : "bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700"
                            }`}
                          >
                            {member.role}
                          </span>

                          {member.role !== "OWNER" && (
                            <button
                              type="button"
                              onClick={() =>
                                setMemberToRemove({
                                  familyId: family.id,
                                  familyName: family.name,
                                  member,
                                })
                              }
                              className="rounded-lg p-1 text-stone-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                              title={t("remove")}
                            >
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="2"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Convites Pendentes */}
                  {familyInvites[family.id] && familyInvites[family.id].length > 0 && (
                    <div className="mt-5 pt-4 border-t border-dashed border-stone-200 dark:border-stone-800">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-1.5">
                        <span>✉️</span> Convites Pendentes ({familyInvites[family.id].length})
                      </h4>
                      <div className="space-y-2">
                        {familyInvites[family.id].map((inv) => {
                          const inviteUrl =
                            typeof window !== "undefined"
                              ? `${window.location.origin}/convite/${inv.token}`
                              : "";
                          return (
                            <div
                              key={inv.id}
                              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-dashed border-amber-300 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/20 p-3 text-xs"
                            >
                              <div>
                                <span className="font-bold text-stone-900 dark:text-stone-100">
                                  {inv.invitedEmail}
                                </span>
                                <span className="ml-2 rounded px-1.5 py-0.5 text-[10px] font-bold bg-amber-200/80 dark:bg-amber-900/60 text-amber-950 dark:text-amber-200">
                                  {inv.role}
                                </span>
                                <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                                  Enviado por {inv.invitedByUserName} • Expira em 7 dias
                                </p>
                              </div>

                              <div className="flex items-center gap-2 self-end sm:self-auto">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (navigator.clipboard && inviteUrl) {
                                      navigator.clipboard.writeText(inviteUrl);
                                      toast.success(
                                        "Link copiado para a área de transferência!"
                                      );
                                    }
                                  }}
                                  className="rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-stone-800 px-2.5 py-1 text-[11px] font-bold text-amber-900 dark:text-amber-200 hover:bg-amber-100/50 transition-colors cursor-pointer"
                                >
                                  🔗 Copiar Link
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCancelInvite(family.id, inv.id)}
                                  className="rounded-lg border border-red-200 dark:border-red-900/60 bg-white dark:bg-stone-800 px-2.5 py-1 text-[11px] font-bold text-red-600 dark:text-red-400 hover:bg-red-50 transition-colors cursor-pointer"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </PaperCard>
            ))}
          </div>
        )}

        {/* MODAL: Criar Família */}
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title={t("newFamily")}
          subtitle="Crie um espaço compartilhado para receitas, agenda e recados."
          maxWidth="md"
        >
          <form onSubmit={handleCreate} className="space-y-4">
            <TextInput
              label={t("familyName")}
              value={newFamilyName}
              onValueChange={setNewFamilyName}
              placeholder="Ex: Família Silva, Casal GeLu"
              required
              autoFocus
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-200/60">
              <ActionButton
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
              >
                {t("cancel")}
              </ActionButton>
              <ActionButton type="submit" disabled={creating}>
                {creating ? t("creating") : t("create")}
              </ActionButton>
            </div>
          </form>
        </Modal>

        {/* MODAL: Editar Família */}
        <Modal
          isOpen={!!editingFamily}
          onClose={() => setEditingFamily(null)}
          title={t("editFamily")}
          subtitle="Atualize o nome da família."
          maxWidth="md"
        >
          <form onSubmit={handleUpdate} className="space-y-4">
            <TextInput
              label={t("familyName")}
              value={editName}
              onValueChange={setEditName}
              placeholder="Ex: Família Silva"
              required
              autoFocus
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-200/60">
              <ActionButton
                type="button"
                variant="outline"
                onClick={() => setEditingFamily(null)}
              >
                {t("cancel")}
              </ActionButton>
              <ActionButton type="submit" disabled={saving}>
                {saving ? t("saving") : t("save")}
              </ActionButton>
            </div>
          </form>
        </Modal>

        {/* MODAL: Adicionar Membro */}
        <Modal
          isOpen={!!addMemberFamily}
          onClose={() => setAddMemberFamily(null)}
          title={`Adicionar Membro — ${addMemberFamily?.name}`}
          subtitle="Informe o e-mail cadastrado da pessoa que deseja convidar."
          maxWidth="md"
        >
          <form onSubmit={handleAddMember} className="space-y-4">
            <TextInput
              label="E-mail do Membro"
              type="email"
              value={addMemberEmail}
              onValueChange={setAddMemberEmail}
              placeholder="exemplo@email.com"
              required
              autoFocus
            />

            <SelectField
              label="Papel / Permissão"
              value={addMemberRole}
              onValueChange={setAddMemberRole}
              options={[
                { label: "Membro (pode criar e editar rotinas)", value: "MEMBER" },
                { label: "Administrador (gerencia membros)", value: "ADMIN" },
                { label: "Visualizador (apenas leitura)", value: "VIEWER" },
              ]}
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-200/60">
              <ActionButton
                type="button"
                variant="outline"
                onClick={() => setAddMemberFamily(null)}
              >
                {t("cancel")}
              </ActionButton>
              <ActionButton type="submit" disabled={addingMember}>
                {addingMember ? t("adding") : t("addMember")}
              </ActionButton>
            </div>
          </form>
        </Modal>

        {/* DIALOG: Confirmar Exclusão de Família */}
        <ConfirmDialog
          isOpen={!!familyToDelete}
          onClose={() => setFamilyToDelete(null)}
          onConfirm={confirmDeleteFamily}
          title={`Excluir Família "${familyToDelete?.name}"?`}
          description={
            <span>
              Tem certeza que deseja excluir esta família?{" "}
              <strong className="text-red-700">Esta ação é irreversível</strong> e
              removerá os vínculos de todos os membros e registros associados.
            </span>
          }
          confirmLabel="Excluir Família"
          loading={deletingFamily}
          variant="danger"
        />

        {/* DIALOG: Confirmar Remoção de Membro */}
        <ConfirmDialog
          isOpen={!!memberToRemove}
          onClose={() => setMemberToRemove(null)}
          onConfirm={confirmRemoveMember}
          title={`Remover ${memberToRemove?.member.userName}?`}
          description={
            <span>
              Tem certeza que deseja remover{" "}
              <strong>{memberToRemove?.member.userName}</strong> (
              <code className="text-stone-700">
                {memberToRemove?.member.userEmail}
              </code>
              ) da família <strong>{memberToRemove?.familyName}</strong>?
            </span>
          }
          confirmLabel="Remover Membro"
          loading={removingMember}
          variant="danger"
        />

        {/* MODAL: Histórico e Auditoria */}
        <Modal
          isOpen={!!auditFamily}
          onClose={() => setAuditFamily(null)}
          title={`Histórico da Família — ${auditFamily?.name}`}
          subtitle="Trilha de auditoria das ações e alterações realizadas."
          maxWidth="lg"
        >
          {loadingAudit ? (
            <div className="py-8 text-center text-sm text-stone-500">
              Carregando histórico de auditoria...
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="py-8 text-center text-sm text-stone-500">
              Nenhuma ação registrada nesta família ainda.
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-3 pr-1">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-2xl border border-stone-200/80 dark:border-stone-700 bg-white/90 dark:bg-[#25201c] p-3.5 shadow-sm flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                        {log.userName}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          log.action === "CREATE"
                            ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                            : log.action === "DELETE"
                            ? "bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300"
                            : "bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300"
                        }`}
                      >
                        {log.action}
                      </span>
                    </div>
                    <p className="text-xs text-stone-700 dark:text-stone-300 font-medium leading-relaxed">
                      {log.details || log.entityType}
                    </p>
                  </div>

                  <span className="text-[10px] text-stone-400 shrink-0 font-medium">
                    {new Date(log.createdAt).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Modal>

        {/* MODAL: Convidar por E-mail & Link */}
        <Modal
          isOpen={!!inviteModalFamily}
          onClose={() => {
            setInviteModalFamily(null);
            setGeneratedInviteLink(null);
          }}
          title={`Convidar para ${inviteModalFamily?.name}`}
          subtitle="Gere um convite seguro com token e envie para a pessoa entrar na família."
          maxWidth="md"
        >
          {generatedInviteLink ? (
            <div className="space-y-4 py-2">
              <div className="rounded-2xl border-2 border-emerald-300 dark:border-emerald-700 bg-emerald-50/80 dark:bg-emerald-950/30 p-4 text-center">
                <span className="text-3xl block mb-1">🎉</span>
                <h4 className="font-display text-lg font-bold text-emerald-950 dark:text-emerald-200">
                  Convite Criado com Sucesso!
                </h4>
                <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-1 max-w-sm mx-auto">
                  Compartilhe o link abaixo com a pessoa convidada. Ao clicar, ela poderá aceitar e entrar imediatamente na família.
                </p>
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-[#1a1714] p-2 text-xs font-mono break-all text-stone-800 dark:text-stone-200">
                  <span className="flex-1 truncate">{generatedInviteLink}</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(generatedInviteLink);
                        toast.success("Link copiado para a área de transferência!");
                      }
                    }}
                    className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors cursor-pointer"
                  >
                    Copiar
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <ActionButton
                  type="button"
                  onClick={() => {
                    setInviteModalFamily(null);
                    setGeneratedInviteLink(null);
                  }}
                >
                  Concluir
                </ActionButton>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSendInvite} className="space-y-4">
              <TextInput
                label="E-mail da Pessoa Convidada"
                type="email"
                value={inviteEmail}
                onValueChange={setInviteEmail}
                placeholder="exemplo@email.com"
                required
                autoFocus
                hint="Um token seguro e único de 7 dias será associado a este e-mail."
              />

              <SelectField
                label="Papel / Permissão no Espaço"
                value={inviteRole}
                onValueChange={setInviteRole}
                options={[
                  { label: "Membro (pode criar e editar rotinas)", value: "MEMBER" },
                  { label: "Administrador (gerencia membros)", value: "ADMIN" },
                  { label: "Visualizador (apenas leitura)", value: "VIEWER" },
                ]}
              />

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-200/60 dark:border-stone-800">
                <ActionButton
                  type="button"
                  variant="outline"
                  onClick={() => setInviteModalFamily(null)}
                >
                  Cancelar
                </ActionButton>
                <ActionButton type="submit" disabled={sendingInvite}>
                  {sendingInvite ? "Gerando..." : "Gerar Link de Convite"}
                </ActionButton>
              </div>
            </form>
          )}
        </Modal>
      </main>
    </AppShell>
  );
}
