"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/layout/AdminShell";
import { PaperCard } from "@/components/ui/PaperCard";
import { ActionButton } from "@/components/ui/ActionButton";
import { NotebookPageHeader } from "@/components/ui/Notebook";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TextInput, SelectField, TextAreaField } from "@/components/ui/FormField";
import { InfoHint } from "@/components/ui/Tooltip";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { useToast } from "@/components/ui/Toast";
import { getCurrentUser, getValidSession } from "@/services/auth";
import {
  getAdminMetrics,
  getAdminUsers,
  getAdminFamilies,
  listSupportTickets,
  updateSupportTicketStatus,
  getAdminSettings,
  updateAdminSettings,
  getAdminAiUsage,
  getUserAiUsage,
  exportUserData,
  anonymizeUser,
  logPiiReveal,
  testAdminGeminiConnection,
  getAdminAuditLogs,
  getAdminTeam,
  createAdminTeamMember,
  updateAdminTeamMemberRole,
  updateAdminTeamMemberStatus,
  deleteAdminTeamMember,
  logPiiRevealWithReason,
} from "@/services/admin";
import type {
  AdminFamilyResponse,
  AdminMetricsResponse,
  AdminRole,
  AdminTeamMemberResponse,
  AdminUserResponse,
  AiUsageSummaryResponse,
  SupportTicketResponse,
  SystemAuditLogResponse,
  SystemSettingResponse,
  UserAiUsageResponse,
  UserDataExportResponse,
} from "@/types/api";

type TabType =
  | "OVERVIEW"
  | "AI_METRICS"
  | "USERS_FAMILIES"
  | "LGPD_GOVERNANCE"
  | "TEAM"
  | "TICKETS"
  | "SETTINGS"
  | "AUDIT";

export default function BackofficeDashboardPage() {
  const { showToast } = useToast();
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<AdminRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("OVERVIEW");

  // Modo Privacidade LGPD (Data Masking)
  const [lgpdPrivacyMode, setLgpdPrivacyMode] = useState<boolean>(true);
  const [showPiiReasonModal, setShowPiiReasonModal] = useState<boolean>(false);
  const [piiReason, setPiiReason] = useState<string>("");
  const [confirmingPii, setConfirmingPii] = useState<boolean>(false);
  const [revealSecondsLeft, setRevealSecondsLeft] = useState<number>(0);

  // Equipe & Gestão de Acessos (RBAC)
  const [team, setTeam] = useState<AdminTeamMemberResponse[]>([]);
  const [loadingTeam, setLoadingTeam] = useState<boolean>(false);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState<boolean>(false);
  const [newTeamName, setNewTeamName] = useState<string>("");
  const [newTeamEmail, setNewTeamEmail] = useState<string>("");
  const [newTeamPassword, setNewTeamPassword] = useState<string>("");
  const [newTeamRole, setNewTeamRole] = useState<AdminRole>("SUPPORT");
  const [creatingMember, setCreatingMember] = useState<boolean>(false);

  // Editar cargo de operador
  const [memberToEditRole, setMemberToEditRole] = useState<AdminTeamMemberResponse | null>(null);
  const [selectedRole, setSelectedRole] = useState<AdminRole>("SUPPORT");
  const [updatingRole, setUpdatingRole] = useState<boolean>(false);

  // Excluir operador
  const [memberToDelete, setMemberToDelete] = useState<AdminTeamMemberResponse | null>(null);
  const [deletingMember, setDeletingMember] = useState<boolean>(false);

  // Dados das abas
  const [metrics, setMetrics] = useState<AdminMetricsResponse | null>(null);
  const [users, setUsers] = useState<AdminUserResponse[]>([]);
  const [families, setFamilies] = useState<AdminFamilyResponse[]>([]);
  const [tickets, setTickets] = useState<SupportTicketResponse[]>([]);
  const [settings, setSettings] = useState<SystemSettingResponse[]>([]);
  const [aiUsage, setAiUsage] = useState<AiUsageSummaryResponse | null>(null);
  const [userAiUsage, setUserAiUsage] = useState<UserAiUsageResponse[]>([]);
  const [auditLogs, setAuditLogs] = useState<SystemAuditLogResponse[]>([]);

  // Filtros
  const [userSearch, setUserSearch] = useState("");
  const [ticketStatusFilter, setTicketStatusFilter] = useState("ALL");

  // Modal de Família (detalhes)
  const [selectedFamily, setSelectedFamily] = useState<AdminFamilyResponse | null>(null);

  // Modal de Atendimento a Chamado
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketResponse | null>(null);
  const [modStatus, setModStatus] = useState("IN_PROGRESS");
  const [modNotes, setModNotes] = useState("");
  const [updatingTicket, setUpdatingTicket] = useState(false);

  // Modal de Exportação de Dados LGPD
  const [exportDataResult, setExportDataResult] = useState<UserDataExportResponse | null>(null);
  const [exportingUserId, setExportingUserId] = useState<string | null>(null);

  // Confirmação de Anonimização LGPD
  const [userToAnonymize, setUserToAnonymize] = useState<AdminUserResponse | null>(null);
  const [anonymizing, setAnonymizing] = useState(false);

  // Configurações form
  const [supportEmail, setSupportEmail] = useState("");
  const [supportPhone, setSupportPhone] = useState("");
  const [supportWhatsapp, setSupportWhatsapp] = useState("");
  const [supportHours, setSupportHours] = useState("");
  const [broadcastBanner, setBroadcastBanner] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [geminiModel, setGeminiModel] = useState("gemini-2.5-flash");
  const [aiDailyLimitFamily, setAiDailyLimitFamily] = useState("15");
  const [aiDailyLimitUser, setAiDailyLimitUser] = useState("10");
  const [savingSettings, setSavingSettings] = useState(false);

  // Teste de IA
  const [testingAi, setTestingAi] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs: number;
  } | null>(null);

  // Funções de Mascaramento LGPD
  const maskEmail = useCallback(
    (email: string) => {
      if (!lgpdPrivacyMode || !email) return email;
      const parts = email.split("@");
      if (parts.length !== 2) return "***";
      const user = parts[0];
      const domain = parts[1];
      const maskedUser =
        user.length <= 2
          ? user.charAt(0) + "***"
          : user.substring(0, 2) + "***" + user.slice(-1);
      const domainParts = domain.split(".");
      const maskedDomain =
        domainParts.length > 1
          ? domainParts[0].charAt(0) + "***." + domainParts.slice(1).join(".")
          : "***";
      return `${maskedUser}@${maskedDomain}`;
    },
    [lgpdPrivacyMode]
  );

  const maskName = useCallback(
    (name: string) => {
      if (!lgpdPrivacyMode || !name) return name;
      const parts = name.trim().split(" ");
      if (parts.length === 1) {
        return parts[0].length <= 2 ? parts[0] : parts[0].substring(0, 2) + "***";
      }
      return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.***`;
    },
    [lgpdPrivacyMode]
  );

  const maskIp = useCallback(
    (ip?: string | null) => {
      if (!lgpdPrivacyMode || !ip) return ip || "N/D";
      const parts = ip.split(".");
      if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.***.***`;
      }
      return "***";
    },
    [lgpdPrivacyMode]
  );

  useEffect(() => {
    if (revealSecondsLeft <= 0) {
      if (!lgpdPrivacyMode) {
        setLgpdPrivacyMode(true);
        showToast("Sessão de revelação de dados expirada por segurança.", "info");
      }
      return;
    }
    const timer = setInterval(() => {
      setRevealSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setLgpdPrivacyMode(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [revealSecondsLeft, lgpdPrivacyMode, showToast]);

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleConfirmPiiReveal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!piiReason.trim() || piiReason.trim().length < 5) {
      showToast("Informe uma justificativa válida com pelo menos 5 caracteres.", "error");
      return;
    }
    setConfirmingPii(true);
    try {
      if (sessionToken) {
        const targetId = users.length > 0 ? users[0].id : "00000000-0000-0000-0000-000000000000";
        await logPiiRevealWithReason(sessionToken, {
          targetUserId: targetId,
          reason: piiReason.trim(),
        });
      }
      setLgpdPrivacyMode(false);
      setShowPiiReasonModal(false);
      setPiiReason("");
      setRevealSecondsLeft(600); // 10 minutos
      showToast("Modo Privacidade desativado por 10 minutos. Acesso auditado com sucesso.", "info");
    } catch {
      showToast("Falha ao registrar auditoria de revelação de dados.", "error");
    } finally {
      setConfirmingPii(false);
    }
  };

  const handleCreateTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionToken) return;
    if (!newTeamName.trim() || !newTeamEmail.trim() || !newTeamPassword.trim()) {
      showToast("Preencha todos os campos obrigatórios.", "error");
      return;
    }
    if (newTeamPassword.trim().length < 6) {
      showToast("A senha provisória deve ter no mínimo 6 caracteres.", "error");
      return;
    }

    setCreatingMember(true);
    try {
      await createAdminTeamMember(sessionToken, {
        name: newTeamName.trim(),
        email: newTeamEmail.trim(),
        password: newTeamPassword.trim(),
        role: newTeamRole,
      });
      showToast("Novo operador cadastrado com sucesso!", "success");
      setShowCreateTeamModal(false);
      setNewTeamName("");
      setNewTeamEmail("");
      setNewTeamPassword("");
      setNewTeamRole("SUPPORT");
      const updated = await getAdminTeam(sessionToken);
      setTeam(updated);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Falha ao criar operador.", "error");
    } finally {
      setCreatingMember(false);
    }
  };

  const handleUpdateMemberRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionToken || !memberToEditRole) return;

    setUpdatingRole(true);
    try {
      await updateAdminTeamMemberRole(sessionToken, memberToEditRole.id, selectedRole);
      showToast(`Perfil de ${memberToEditRole.name} atualizado para ${selectedRole}!`, "success");
      setMemberToEditRole(null);
      const updated = await getAdminTeam(sessionToken);
      setTeam(updated);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Falha ao alterar perfil.", "error");
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleToggleMemberStatus = async (member: AdminTeamMemberResponse) => {
    if (!sessionToken) return;
    try {
      await updateAdminTeamMemberStatus(sessionToken, member.id, !member.active);
      showToast(`Operador ${member.name} ${!member.active ? "ativado" : "desativado"} com sucesso.`, "info");
      const updated = await getAdminTeam(sessionToken);
      setTeam(updated);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Falha ao alterar status.", "error");
    }
  };

  const handleDeleteMember = async () => {
    if (!sessionToken || !memberToDelete) return;
    setDeletingMember(true);
    try {
      await deleteAdminTeamMember(sessionToken, memberToDelete.id);
      showToast(`Operador ${memberToDelete.name} excluído do backoffice.`, "success");
      setMemberToDelete(null);
      const updated = await getAdminTeam(sessionToken);
      setTeam(updated);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Falha ao excluir operador.", "error");
    } finally {
      setDeletingMember(false);
    }
  };

  const checkAuthAndLoad = useCallback(async () => {
    setLoading(true);
    try {
      const session = await getValidSession();
      if (!session) {
        setIsSuperAdmin(false);
        setLoading(false);
        return;
      }

      setSessionToken(session.accessToken);
      const user = await getCurrentUser(session.accessToken);
      const isSuper = !!user?.isSuperAdmin;
      const role = user?.adminRole ?? (isSuper ? "SUPER_ADMIN" : null);
      setIsSuperAdmin(isSuper);
      setCurrentUserRole(role);

      if (!isSuper && !role) {
        setLoading(false);
        return;
      }

      // Carregar todas as informações do painel
      const [
        metricsData,
        usersData,
        familiesData,
        ticketsData,
        settingsData,
        aiUsageData,
        userAiData,
        auditLogsData,
        teamData,
      ] = await Promise.all([
        getAdminMetrics(session.accessToken).catch(() => null),
        getAdminUsers(session.accessToken).catch(() => []),
        getAdminFamilies(session.accessToken).catch(() => []),
        listSupportTickets(session.accessToken).catch(() => []),
        getAdminSettings(session.accessToken).catch(() => []),
        getAdminAiUsage(session.accessToken).catch(() => null),
        getUserAiUsage(session.accessToken).catch(() => []),
        getAdminAuditLogs(session.accessToken).catch(() => []),
        getAdminTeam(session.accessToken).catch(() => []),
      ]);

      setMetrics(metricsData);
      setUsers(usersData);
      setFamilies(familiesData);
      setTickets(ticketsData);
      setSettings(settingsData);
      setAiUsage(aiUsageData);
      setUserAiUsage(userAiData);
      setAuditLogs(auditLogsData);
      setTeam(teamData);

      // Preencher formulário de configurações
      if (settingsData && settingsData.length > 0) {
        const getVal = (k: string, def = "") =>
          settingsData.find((s) => s.key === k)?.value ?? def;
        setSupportEmail(getVal("support_email"));
        setSupportPhone(getVal("support_phone"));
        setSupportWhatsapp(getVal("support_whatsapp"));
        setSupportHours(getVal("support_hours"));
        setBroadcastBanner(getVal("broadcast_banner"));
        setGeminiKey(getVal("gemini_api_key"));
        setGeminiModel(getVal("gemini_model", "gemini-2.5-flash"));
        setAiDailyLimitFamily(getVal("ai_daily_limit_family", "15"));
        setAiDailyLimitUser(getVal("ai_daily_limit_user", "10"));
      }
    } catch {
      setIsSuperAdmin(false);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    checkAuthAndLoad();
  }, [checkAuthAndLoad]);

  const handleUpdateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionToken || !selectedTicket) return;

    setUpdatingTicket(true);
    try {
      await updateSupportTicketStatus(sessionToken, selectedTicket.id, {
        status: modStatus,
        adminNotes: modNotes.trim() || undefined,
      });

      showToast("Status do chamado atualizado com sucesso!", "success");
      setSelectedTicket(null);
      const updatedTickets = await listSupportTickets(sessionToken);
      setTickets(updatedTickets);
    } catch {
      showToast("Não foi possível atualizar o chamado.", "error");
    } finally {
      setUpdatingTicket(false);
    }
  };

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!sessionToken) return;

    setSavingSettings(true);
    try {
      const payload: Record<string, string> = {
        support_email: supportEmail.trim(),
        support_phone: supportPhone.trim(),
        support_whatsapp: supportWhatsapp.trim(),
        support_hours: supportHours.trim(),
        broadcast_banner: broadcastBanner.trim(),
        gemini_model: geminiModel.trim(),
        ai_daily_limit_family: aiDailyLimitFamily.trim() || "15",
        ai_daily_limit_user: aiDailyLimitUser.trim() || "10",
      };

      if (geminiKey.trim()) {
        payload.gemini_api_key = geminiKey.trim();
      }

      await updateAdminSettings(sessionToken, payload);
      showToast("Configurações do sistema salvas com sucesso!", "success");
      const updatedSettings = await getAdminSettings(sessionToken);
      setSettings(updatedSettings);
    } catch {
      showToast("Erro ao salvar configurações do sistema.", "error");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleTestAi = async () => {
    if (!sessionToken) return;
    setTestingAi(true);
    setTestResult(null);

    try {
      const res = await testAdminGeminiConnection(sessionToken, {
        apiKey: geminiKey.trim() || undefined,
        model: geminiModel,
      });
      setTestResult(res);
      if (res.success) {
        showToast(
          `Conexão com Google AI bem-sucedida! Latência: ${res.latencyMs}ms`,
          "success"
        );
      } else {
        showToast("Falha no teste com a Google AI.", "error");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      setTestResult({ success: false, message: msg, latencyMs: 0 });
      showToast("Erro ao testar Google AI.", "error");
    } finally {
      setTestingAi(false);
    }
  };

  const handleExportUserData = async (userId: string) => {
    if (!sessionToken) return;
    try {
      setExportingUserId(userId);
      const data = await exportUserData(sessionToken, userId);
      setExportDataResult(data);
      showToast("Relatório de Portabilidade LGPD gerado!", "success");
    } catch {
      showToast("Erro ao exportar dados do titular.", "error");
    } finally {
      setExportingUserId(null);
    }
  };

  const handleConfirmAnonymize = async () => {
    if (!sessionToken || !userToAnonymize) return;
    try {
      setAnonymizing(true);
      await anonymizeUser(sessionToken, userToAnonymize.id);
      showToast("Usuário anonimizado com sucesso conforme LGPD!", "success");
      setUserToAnonymize(null);
      await checkAuthAndLoad();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao anonimizar.";
      showToast(msg, "error");
    } finally {
      setAnonymizing(false);
    }
  };

  const handleDownloadExportJson = () => {
    if (!exportDataResult) return;
    const jsonStr = JSON.stringify(exportDataResult, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `portabilidade_lgpd_${exportDataResult.userId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <AdminShell>
        <div className="flex flex-col items-center justify-center py-24">
          <div className="text-3xl animate-bounce mb-3">🛡️</div>
          <p className="text-stone-500 font-bold text-sm">Carregando painel administrativo...</p>
        </div>
      </AdminShell>
    );
  }

  if (isSuperAdmin === false) {
    return (
      <AdminShell>
        <div className="mx-auto max-w-lg py-16 text-center">
          <PaperCard tape="orange">
            <span className="text-5xl block mb-4">⛔</span>
            <h1 className="font-display text-2xl font-black text-stone-900 dark:text-stone-100">
              Acesso Negado
            </h1>
            <p className="mt-3 text-sm text-stone-600 dark:text-stone-300">
              Esta área é restrita aos administradores do sistema GeLu. A sua conta atual não possui privilégios de <strong>Super Admin</strong>.
            </p>
            <div className="mt-6 flex justify-center">
              <Link
                href="/login"
                className="px-4 py-2 rounded-xl bg-primary text-white font-bold text-xs shadow-md hover:bg-primary-hover"
              >
                Fazer login como Super Admin
              </Link>
            </div>
          </PaperCard>
        </div>
      </AdminShell>
    );
  }

  const filteredUsers = users.filter((u) => {
    if (!userSearch) return true;
    const term = userSearch.toLowerCase();
    return u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term);
  });

  const filteredTickets = tickets.filter((t) => {
    if (ticketStatusFilter === "ALL") return true;
    return t.status === ticketStatusFilter;
  });

  const maxUserTokens = Math.max(...userAiUsage.map((u) => u.totalTokens), 1);

  return (
    <AdminShell>
      <div className="mx-auto max-w-6xl space-y-6 pb-12">
        {/* Cabeçalho do Painel */}
        <NotebookPageHeader
          eyebrow="PORTAL DE GOVERNANÇA & SUPER ADMIN"
          title="Painel Administrativo do Sistema"
          subtitle="Gestão de contas, famílias, helpdesk global, monitoramento de IA e conformidade LGPD."
        />

        {/* Barra de Governança LGPD (Toggle de Privacidade) */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-surface dark:bg-[#1f1a16] p-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/60 text-lg border border-amber-300 dark:border-amber-800 shrink-0">
              🔒
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                  Proteção de Dados Pessoais (LGPD)
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                    lgpdPrivacyMode
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                  }`}
                >
                  {lgpdPrivacyMode ? "● Mascaramento Ativo" : "○ Dados Revelados (Auditado)"}
                </span>
              </div>
              <p className="text-xs font-bold text-stone-800 dark:text-stone-200 mt-0.5">
                {lgpdPrivacyMode
                  ? "E-mails, nomes completos e endereços IP mascarados para atender à Lei 13.709/2018."
                  : "Atenção: Os dados pessoais dos titulares estão visíveis na tela. Ação registrada no log."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (lgpdPrivacyMode) {
                setShowPiiReasonModal(true);
              } else {
                setLgpdPrivacyMode(true);
                setRevealSecondsLeft(0);
                showToast("Modo Privacidade LGPD reativado com mascaramento total.", "success");
              }
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-2xs active:scale-[0.98] ${
              lgpdPrivacyMode
                ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                : "border-amber-400 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 hover:bg-amber-100 animate-pulse"
            }`}
          >
            <span>
              {lgpdPrivacyMode
                ? "👁️ Revelar Dados Pessoais"
                : `🔒 Ocultar Dados (${formatCountdown(revealSecondsLeft)})`}
            </span>
          </button>
        </div>

        {/* Abas de Navegação — Sem Barra de Rolagem Horizontal */}
        <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-stone-200 dark:border-stone-800">
          {[
            { id: "OVERVIEW", label: "📊 Visão Geral & Health" },
            { id: "AI_METRICS", label: `📈 Consumo & Métricas IA` },
            { id: "USERS_FAMILIES", label: `👥 Usuários (${users.length}) & Famílias (${families.length})` },
            { id: "LGPD_GOVERNANCE", label: "🔒 Governança & LGPD" },
            { id: "TEAM", label: `👔 Equipe & Acessos (${team.length})` },
            { id: "TICKETS", label: `💬 Chamados Globais (${tickets.length})` },
            { id: "SETTINGS", label: "⚙️ Configurações Globais" },
            { id: "AUDIT", label: "📜 Auditoria do Sistema" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "bg-primary text-white shadow-sm"
                  : "bg-surface dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:border-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ABA 1: VISÃO GERAL & HEALTHCHECK */}
        {activeTab === "OVERVIEW" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {[
                { label: "Usuários", value: metrics?.totalUsers ?? 0, icon: "👤" },
                { label: "Famílias", value: metrics?.totalFamilies ?? 0, icon: "🏠" },
                { label: "Receitas", value: metrics?.totalRecipes ?? 0, icon: "📖" },
                { label: "Dietas Criadas", value: metrics?.totalWeeklyDiets ?? 0, icon: "🥗" },
                { label: "Treinos", value: metrics?.totalWorkoutsLogged ?? 0, icon: "💪" },
                {
                  label: "Chamados Abertos",
                  value: metrics?.openSupportTickets ?? 0,
                  icon: "📬",
                  highlight: (metrics?.openSupportTickets ?? 0) > 0,
                },
              ].map((card) => (
                <div
                  key={card.label}
                  className={`p-4 rounded-2xl border bg-surface dark:bg-stone-900 text-center ${
                    card.highlight
                      ? "border-amber-400 bg-amber-50/50 dark:bg-amber-950/20"
                      : "border-stone-200 dark:border-stone-800"
                  }`}
                >
                  <div className="text-xl mb-1">{card.icon}</div>
                  <div className="text-xs text-stone-500 dark:text-stone-400 uppercase font-semibold">
                    {card.label}
                  </div>
                  <div className="text-2xl font-black text-stone-900 dark:text-stone-100 mt-1">
                    {card.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Painel de Healthcheck de Serviços */}
            <PaperCard tape="orange">
              <h2 className="font-display text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <span>🩺</span> Integridade dos Serviços da Plataforma (Healthcheck)
              </h2>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-stone-900 dark:text-stone-100">
                      🐘 PostgreSQL
                    </span>
                    <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-1 font-semibold">
                    Conexão Ativa & Saudável
                  </p>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Pool HikariCP operacional • Migrations V015 aplicadas.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-stone-900 dark:text-stone-100">
                      🤖 Google Gemini API
                    </span>
                    <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-1 font-semibold">
                    {geminiModel} • Ativo
                  </p>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Free Tier configurado • 100% de sucesso nas últimas requisições.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-stone-900 dark:text-stone-100">
                      ⚡ WebSocket (STOMP)
                    </span>
                    <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-1 font-semibold">
                    Broker Operando
                  </p>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Sincronização em tempo real para agenda, cardápio e notas.
                  </p>
                </div>
              </div>
            </PaperCard>

            {/* Ações Rápidas */}
            <PaperCard tape="orange">
              <h2 className="font-display text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <span>⚡</span> Ações Rápidas da Administração
              </h2>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab("USERS_FAMILIES")}
                  className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50 text-left hover:border-primary transition-all cursor-pointer"
                >
                  <div className="font-bold text-sm text-stone-900 dark:text-stone-100">
                    👥 Inspecionar Usuários & Famílias
                  </div>
                  <div className="text-xs text-stone-500 mt-1">
                    Ver detalhes de membros e vínculos familiares.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("AI_METRICS")}
                  className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50 text-left hover:border-primary transition-all cursor-pointer"
                >
                  <div className="font-bold text-sm text-stone-900 dark:text-stone-100">
                    📈 Consumo Individual de IA
                  </div>
                  <div className="text-xs text-stone-500 mt-1">
                    Gráficos por usuário, tokens e estimativa de custos.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("LGPD_GOVERNANCE")}
                  className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50 text-left hover:border-primary transition-all cursor-pointer"
                >
                  <div className="font-bold text-sm text-stone-900 dark:text-stone-100">
                    🔒 Governança & LGPD
                  </div>
                  <div className="text-xs text-stone-500 mt-1">
                    Exportação de dados (Art. 18) e anonimização de contas.
                  </div>
                </button>
              </div>
            </PaperCard>
          </div>
        )}

        {/* ABA 2: CONSUMO & MÉTRICAS IA */}
        {activeTab === "AI_METRICS" && (
          <div className="space-y-6">
            {/* Resumo de Consumo de Tokens */}
            <PaperCard tape="orange">
              <h2 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100 pb-3 border-b border-surface-variant flex items-center gap-2">
                <span>🤖</span> Resumo Geral de Tokens & Custos
              </h2>

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-surface text-center">
                  <div className="text-xs text-stone-400 font-semibold uppercase">Total de Chamadas</div>
                  <div className="text-2xl font-black text-stone-900 dark:text-stone-100 mt-1">
                    {aiUsage?.totalRequests ?? 0}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-surface text-center">
                  <div className="text-xs text-stone-400 font-semibold uppercase">Total de Tokens</div>
                  <div className="text-2xl font-black text-stone-900 dark:text-stone-100 mt-1">
                    {(aiUsage?.totalTokens ?? 0).toLocaleString("pt-BR")}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-surface text-center">
                  <div className="text-xs text-stone-400 font-semibold uppercase">Entrada / Saída</div>
                  <div className="text-sm font-bold text-stone-700 dark:text-stone-300 mt-2">
                    In: {(aiUsage?.promptTokens ?? 0).toLocaleString("pt-BR")} | Out: {(aiUsage?.completionTokens ?? 0).toLocaleString("pt-BR")}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-surface text-center">
                  <div className="text-xs text-stone-400 font-semibold uppercase">Custo Estimado</div>
                  <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">
                    {aiUsage?.estimatedCostBrl ?? "R$ 0,00"}
                  </div>
                </div>
              </div>
            </PaperCard>

            {/* Gráfico de Consumo Individual por Usuário */}
            <PaperCard tape="orange">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-surface-variant">
                <div>
                  <h2 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <span>📊</span> Gráfico de Consumo Individual de IA por Usuário
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Comparativo de volume de tokens e custo proporcional por conta titular.
                  </p>
                </div>
                <span className="text-xs font-bold text-stone-400">
                  {userAiUsage.length} usuários com consumo registrado
                </span>
              </div>

              {userAiUsage.length === 0 ? (
                <div className="text-center py-12 text-stone-400 text-xs">
                  Nenhum consumo individual registrado ainda. Faça uma sugestão na IA para gerar dados!
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  {userAiUsage.map((u, idx) => {
                    const percentage = Math.max(Math.round((u.totalTokens / maxUserTokens) * 100), 4);
                    return (
                      <div
                        key={u.userId}
                        className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-surface dark:bg-stone-900/40 space-y-2.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/60 text-xs font-black text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
                              {idx + 1}
                            </span>
                            <div>
                              <span className="font-bold text-sm text-stone-900 dark:text-stone-100">
                                {maskName(u.userName)}
                              </span>
                              <span className="ml-2 font-mono text-xs text-stone-400">
                                ({maskEmail(u.userEmail)})
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-xs">
                            <span className="px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-semibold">
                              {u.familyName || "Pessoal"}
                            </span>
                            <span className="font-extrabold text-amber-700 dark:text-amber-400">
                              {u.totalTokens.toLocaleString("pt-BR")} tokens
                            </span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              {u.estimatedCostBrl}
                            </span>
                          </div>
                        </div>

                        {/* Barra de Progresso Visual */}
                        <div className="w-full bg-stone-100 dark:bg-stone-800 rounded-full h-3 overflow-hidden p-0.5">
                          <div
                            className="bg-gradient-to-r from-amber-500 to-primary h-2 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>

                        <div className="flex justify-between items-center text-[11px] text-stone-400">
                          <span>{u.requestCount} requisições realizadas</span>
                          <span>
                            Último uso:{" "}
                            {u.lastUsedAt
                              ? new Date(u.lastUsedAt).toLocaleString("pt-BR")
                              : "N/D"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </PaperCard>

            {/* Configuração Gemini */}
            <PaperCard tape="orange">
              <h2 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100 pb-3 border-b border-surface-variant flex items-center gap-2">
                <span>⚙️</span> Parâmetros do Google Gemini AI
              </h2>

              <div className="mt-4 p-4 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/20 text-xs text-amber-900 dark:text-amber-200">
                💡 <strong>Dica de Custos:</strong> No Google AI Studio, o <strong>Gemini 2.5 Flash</strong> possui cota 100% gratuita de até 15 requisições/minuto e 1 milhão de tokens por minuto.
              </div>

              <div className="mt-5 space-y-4 max-w-xl">
                <TextInput
                  id="geminiKey"
                  label="Chave da API (GEMINI_API_KEY)"
                  type="password"
                  placeholder="AIzaSy... ou AQ..."
                  value={geminiKey}
                  onValueChange={setGeminiKey}
                />

                <SelectField
                  id="geminiModel"
                  label="Modelo Selecionado"
                  value={geminiModel}
                  onValueChange={setGeminiModel}
                  options={[
                    { label: "Gemini 2.5 Flash (Recomendado - Gratuito & Rápido)", value: "gemini-2.5-flash" },
                    { label: "Gemini Flash Latest (Versão contínua)", value: "gemini-flash-latest" },
                    { label: "Gemini 2.5 Pro (Mais potente)", value: "gemini-2.5-pro" },
                  ]}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-surface-variant">
                  <div>
                    <label htmlFor="aiDailyLimitFamily" className="text-sm font-bold text-stone-700 dark:text-stone-300 block mb-1">
                      Limite Diário por Família
                    </label>
                    <TextInput
                      id="aiDailyLimitFamily"
                      type="number"
                      placeholder="15"
                      value={aiDailyLimitFamily}
                      onValueChange={setAiDailyLimitFamily}
                    />
                  </div>

                  <div>
                    <label htmlFor="aiDailyLimitUser" className="text-sm font-bold text-stone-700 dark:text-stone-300 block mb-1">
                      Limite Diário por Usuário
                    </label>
                    <TextInput
                      id="aiDailyLimitUser"
                      type="number"
                      placeholder="10"
                      value={aiDailyLimitUser}
                      onValueChange={setAiDailyLimitUser}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <ActionButton
                    onClick={handleTestAi}
                    variant="outline"
                    disabled={testingAi}
                  >
                    {testingAi ? "Testando Conexão..." : "⚡ Testar Conexão com Google AI"}
                  </ActionButton>
                  <ActionButton
                    onClick={handleSaveSettings}
                    variant="primary"
                    disabled={savingSettings}
                  >
                    {savingSettings ? "Salvando..." : "Salvar Configuração"}
                  </ActionButton>
                </div>

                {testResult && (
                  <div
                    className={`p-3 rounded-xl border text-xs font-semibold ${
                      testResult.success
                        ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
                        : "border-red-300 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-200"
                    }`}
                  >
                    {testResult.message} (Latência: {testResult.latencyMs}ms)
                  </div>
                )}
              </div>
            </PaperCard>
          </div>
        )}

        {/* ABA 3: USUÁRIOS & FAMÍLIAS */}
        {activeTab === "USERS_FAMILIES" && (
          <div className="space-y-6">
            <PaperCard tape="orange">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-surface-variant">
                <div>
                  <h2 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100">
                    Contas de Usuários ({users.length})
                  </h2>
                  <p className="text-xs text-stone-500">
                    Listagem de todas as contas registradas no GeLu.
                  </p>
                </div>
                <div className="w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Buscar por nome ou e-mail..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-surface text-xs"
                  />
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-700 dark:text-stone-300">
                  <thead className="bg-stone-100 dark:bg-stone-800 text-stone-500 uppercase font-semibold">
                    <tr>
                      <th className="p-3">Nome</th>
                      <th className="p-3">E-mail</th>
                      <th className="p-3">Famílias</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Criado em</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-stone-400">
                          Nenhum usuário encontrado.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-stone-50 dark:hover:bg-stone-900/40">
                          <td className="p-3 font-bold text-stone-900 dark:text-stone-100">
                            {maskName(u.name)}
                          </td>
                          <td className="p-3 font-mono text-stone-500">{maskEmail(u.email)}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 font-semibold">
                              {u.familiesCount}
                            </span>
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                u.active
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                  : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                              }`}
                            >
                              {u.active ? "Ativo" : "Inativo / Anonimizado"}
                            </span>
                          </td>
                          <td className="p-3 text-stone-400">
                            {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </PaperCard>

            <PaperCard tape="orange">
              <h2 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100 pb-3 border-b border-surface-variant">
                Famílias Cadastradas ({families.length})
              </h2>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {families.map((fam) => (
                  <div
                    key={fam.id}
                    className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-surface dark:bg-stone-900/30 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-sm text-stone-900 dark:text-stone-100">
                        🏠 {fam.name}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-extrabold">
                        {fam.membersCount} {fam.membersCount === 1 ? "membro" : "membros"}
                      </span>
                    </div>

                    <div className="text-xs text-stone-500">
                      <strong>Dono:</strong> {maskName(fam.ownerName)} ({maskEmail(fam.ownerEmail)})
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedFamily(fam)}
                      className="text-xs text-primary font-bold hover:underline cursor-pointer"
                    >
                      Ver detalhes dos membros →
                    </button>
                  </div>
                ))}
              </div>
            </PaperCard>
          </div>
        )}

        {/* ABA 4: GOVERNANÇA & LGPD */}
        {activeTab === "LGPD_GOVERNANCE" && (
          <div className="space-y-6">
            <PaperCard tape="orange">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-surface-variant">
                <div>
                  <h2 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <span>🛡️</span> Portal dos Direitos dos Titulares de Dados (LGPD)
                  </h2>
                  <p className="text-xs text-stone-500">
                    Atendimento aos direitos de Portabilidade (Art. 18, II) e Anonimização/Esquecimento (Art. 18, VI) da Lei 13.709/2018.
                  </p>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-700 dark:text-stone-300">
                  <thead className="bg-stone-100 dark:bg-stone-800 text-stone-500 uppercase font-semibold">
                    <tr>
                      <th className="p-3">Titular</th>
                      <th className="p-3">E-mail Cadastrado</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Ações de Conformidade LGPD</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-stone-50 dark:hover:bg-stone-900/40">
                        <td className="p-3 font-bold text-stone-900 dark:text-stone-100">
                          {maskName(u.name)}
                        </td>
                        <td className="p-3 font-mono text-stone-500">{maskEmail(u.email)}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              u.active
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300"
                            }`}
                          >
                            {u.active ? "Ativo" : "Anonimizado"}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleExportUserData(u.id)}
                              disabled={exportingUserId === u.id}
                              className="px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 font-bold hover:bg-stone-100 transition-all cursor-pointer"
                            >
                              {exportingUserId === u.id ? "Exportando..." : "📥 Exportar Dados"}
                            </button>

                            {u.active && (
                              <button
                                type="button"
                                onClick={() => setUserToAnonymize(u)}
                                className="px-2.5 py-1.5 rounded-lg border border-red-300 dark:border-red-900/60 bg-red-50/70 dark:bg-red-950/40 text-red-700 dark:text-red-400 font-bold hover:bg-red-100 transition-all cursor-pointer"
                              >
                                🚫 Anonimizar Conta
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </PaperCard>
          </div>
        )}

        {/* ABA: EQUIPE & ACESSOS (RBAC) */}
        {activeTab === "TEAM" && (
          <div className="space-y-6">
            <PaperCard tape="orange">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-surface-variant">
                <div>
                  <h2 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <span>👔</span> Gestão da Equipe & Controle de Acesso (RBAC)
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                    Crie contas de operadores com perfis granulares, proteja o Super Admin e gerencie salvaguardas de acesso.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCreateTeamModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-primary text-white shadow-md hover:bg-primary-hover transition-all cursor-pointer"
                >
                  <span>+ Novo Operador</span>
                </button>
              </div>

              {/* Cards de Resumo da Equipe */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
                <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60">
                  <div className="text-[11px] font-bold text-stone-500 uppercase">Total Operadores</div>
                  <div className="text-2xl font-black text-stone-900 dark:text-stone-100 mt-1">{team.length}</div>
                </div>
                <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20">
                  <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase">Super Admins</div>
                  <div className="text-2xl font-black text-amber-900 dark:text-amber-200 mt-1">
                    {team.filter((m) => m.role === "SUPER_ADMIN").length}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20">
                  <div className="text-[11px] font-bold text-blue-700 dark:text-blue-400 uppercase">Admins Operacionais</div>
                  <div className="text-2xl font-black text-blue-900 dark:text-blue-200 mt-1">
                    {team.filter((m) => m.role === "ADMIN").length}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl border border-teal-200 dark:border-teal-900/50 bg-teal-50/50 dark:bg-teal-950/20">
                  <div className="text-[11px] font-bold text-teal-700 dark:text-teal-400 uppercase">Suporte & Leitura</div>
                  <div className="text-2xl font-black text-teal-900 dark:text-teal-200 mt-1">
                    {team.filter((m) => m.role === "SUPPORT" || m.role === "READ_ONLY").length}
                  </div>
                </div>
              </div>

              {/* Tabela de Membros da Equipe */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-700 dark:text-stone-300">
                  <thead className="bg-stone-100 dark:bg-stone-800 text-stone-500 uppercase font-semibold">
                    <tr>
                      <th className="p-3">Operador</th>
                      <th className="p-3">Cargo / Perfil</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Cadastrado em</th>
                      <th className="p-3 text-right">Ações & Salvaguardas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                    {team.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-stone-400">
                          {loadingTeam ? "Carregando equipe..." : "Nenhum operador cadastrado além do Super Admin."}
                        </td>
                      </tr>
                    ) : (
                      team.map((member) => {
                        const roleBadges: Record<AdminRole, { label: string; cls: string; desc: string }> = {
                          SUPER_ADMIN: {
                            label: "👑 Super Admin",
                            cls: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700",
                            desc: "Acesso irrestrito a configurações, chaves de IA e gestão de equipe",
                          },
                          ADMIN: {
                            label: "🛡️ Admin Operacional",
                            cls: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-700",
                            desc: "Gestão completa de usuários, famílias, receitas e chamados",
                          },
                          SUPPORT: {
                            label: "🎧 Suporte & Atendimento",
                            cls: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-300 dark:border-teal-700",
                            desc: "Moderação e resposta a chamados de suporte do sistema",
                          },
                          READ_ONLY: {
                            label: "👁️ Somente Leitura / Auditor",
                            cls: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-700",
                            desc: "Consulta a métricas e relatórios sem permissão de edição",
                          },
                        };

                        const badge = roleBadges[member.role] || roleBadges.SUPPORT;

                        return (
                          <tr key={member.id} className="hover:bg-stone-50 dark:hover:bg-stone-900/40">
                            <td className="p-3">
                              <div className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                                <span>{member.name}</span>
                                {member.isSelf && (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300">
                                    (Você)
                                  </span>
                                )}
                              </div>
                              <div className="font-mono text-stone-500 dark:text-stone-400 text-[11px]">
                                {maskEmail(member.email)}
                              </div>
                            </td>

                            <td className="p-3">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${badge.cls}`}>
                                {badge.label}
                              </span>
                            </td>

                            <td className="p-3">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                  member.active
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                    : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                                }`}
                              >
                                {member.active ? "● Ativo" : "○ Inativo"}
                              </span>
                            </td>

                            <td className="p-3 text-stone-500 whitespace-nowrap">
                              {new Date(member.createdAt).toLocaleDateString("pt-BR")}
                            </td>

                            <td className="p-3 text-right">
                              {member.isMasterSuperAdmin ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                  👑 Dono do Sistema (Inviolável)
                                </span>
                              ) : member.isSelf ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-stone-100 dark:bg-stone-800 text-stone-500 border border-stone-200 dark:border-stone-700">
                                  🔒 Sua Conta (Auto-protegida)
                                </span>
                              ) : (
                                <div className="inline-flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setMemberToEditRole(member);
                                      setSelectedRole(member.role);
                                    }}
                                    className="px-2.5 py-1 rounded-lg border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 font-semibold text-xs cursor-pointer"
                                  >
                                    Editar Perfil
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleToggleMemberStatus(member)}
                                    className={`px-2.5 py-1 rounded-lg border font-semibold text-xs cursor-pointer ${
                                      member.active
                                        ? "border-amber-300 text-amber-800 dark:text-amber-400 hover:bg-amber-50"
                                        : "border-emerald-300 text-emerald-800 dark:text-emerald-400 hover:bg-emerald-50"
                                    }`}
                                  >
                                    {member.active ? "Desativar" : "Ativar"}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setMemberToDelete(member)}
                                    className="px-2.5 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 font-semibold text-xs cursor-pointer"
                                  >
                                    Excluir
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </PaperCard>
          </div>
        )}

        {/* ABA 5: CHAMADOS GLOBAIS */}
        {activeTab === "TICKETS" && (
          <PaperCard tape="orange">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-surface-variant">
              <div>
                <h2 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100">
                  Chamados de Suporte ({tickets.length})
                </h2>
                <p className="text-xs text-stone-500">
                  Helpdesk de usuários de todas as famílias registradas.
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
                    onClick={() => setTicketStatusFilter(f.value)}
                    className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                      ticketStatusFilter === f.value
                        ? "border-primary bg-primary text-white"
                        : "border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-stone-600 dark:text-stone-300"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {filteredTickets.length === 0 ? (
                <div className="text-center py-10 text-stone-400 text-sm">
                  Nenhum chamado com o filtro selecionado.
                </div>
              ) : (
                filteredTickets.map((t) => (
                  <div
                    key={t.id}
                    className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-surface dark:bg-stone-900/40 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            t.status === "RESOLVED"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : t.status === "IN_PROGRESS"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                          }`}
                        >
                          {t.status === "RESOLVED"
                            ? "✅ Resolvido"
                            : t.status === "IN_PROGRESS"
                            ? "⏳ Em Andamento"
                            : "📬 Aberto"}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 uppercase">
                          {t.category}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedTicket(t);
                          setModStatus(t.status);
                          setModNotes(t.adminNotes || "");
                        }}
                        className="text-xs px-3 py-1 rounded-lg border border-primary bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors font-bold cursor-pointer"
                      >
                        Responder / Alterar Status
                      </button>
                    </div>

                    <div className="text-xs text-stone-500">
                      <strong>De:</strong> {maskName(t.userName)} ({maskEmail(t.userEmail)}) •{" "}
                      {new Date(t.createdAt).toLocaleString("pt-BR")}
                    </div>

                    <h3 className="font-display font-bold text-base text-stone-900 dark:text-stone-100">
                      {t.subject}
                    </h3>
                    <p className="text-sm text-stone-700 dark:text-stone-300 whitespace-pre-line">
                      {t.description}
                    </p>

                    {t.adminNotes && (
                      <div className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-xs text-stone-600 dark:text-stone-300">
                        <strong className="text-primary">Resposta registrada:</strong> {t.adminNotes}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </PaperCard>
        )}

        {/* ABA 6: CONFIGURAÇÕES GLOBAIS */}
        {activeTab === "SETTINGS" && (
          <PaperCard tape="orange">
            <h2 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100 pb-3 border-b border-surface-variant flex items-center gap-2">
              <span>⚙️</span> Canais Oficiais de Suporte ao Usuário
            </h2>
            <p className="text-xs text-stone-500 mt-1 mb-5">
              Estes dados serão exibidos para todos os usuários na tela de Suporte e nos rodapés.
            </p>

            <form onSubmit={handleSaveSettings} className="space-y-4 max-w-xl">
              <TextInput
                id="supportEmail"
                label="E-mail Oficial de Suporte"
                value={supportEmail}
                onValueChange={setSupportEmail}
                placeholder="suporte@gelu.com.br"
                required
              />

              <TextInput
                id="supportPhone"
                label="Telefone / WhatsApp (Texto de exibição)"
                value={supportPhone}
                onValueChange={setSupportPhone}
                placeholder="(11) 99999-9999"
              />

              <TextInput
                id="supportWhatsapp"
                label="WhatsApp (Apenas números com DDD para link direto)"
                value={supportWhatsapp}
                onValueChange={setSupportWhatsapp}
                placeholder="5511999999999"
              />

              <TextInput
                id="supportHours"
                label="Horário de Atendimento"
                value={supportHours}
                onValueChange={setSupportHours}
                placeholder="Segunda a Sexta, das 09:00 às 18:00"
              />

              <TextAreaField
                id="broadcastBanner"
                label="Aviso Global do Sistema (Broadcast Banner)"
                value={broadcastBanner}
                onValueChange={setBroadcastBanner}
                placeholder="Deixe em branco para desativar. Ex: Manutenção programada hoje às 23h."
                rows={2}
              />

              <div className="pt-2">
                <ActionButton type="submit" variant="primary" disabled={savingSettings}>
                  {savingSettings ? "Gravando..." : "Salvar Configurações Globais"}
                </ActionButton>
              </div>
            </form>
          </PaperCard>
        )}

        {/* ABA 7: AUDITORIA */}
        {activeTab === "AUDIT" && (
          <PaperCard tape="orange">
            <h2 className="font-display text-lg font-bold text-stone-900 dark:text-stone-100 pb-3 border-b border-surface-variant flex items-center gap-2">
              <span>📜</span> Logs de Auditoria do Sistema ({auditLogs.length})
            </h2>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-700 dark:text-stone-300">
                <thead className="bg-stone-100 dark:bg-stone-800 text-stone-500 uppercase font-semibold">
                  <tr>
                    <th className="p-3">Data / Hora</th>
                    <th className="p-3">Autor</th>
                    <th className="p-3">IP</th>
                    <th className="p-3">Ação</th>
                    <th className="p-3">Detalhes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-stone-400">
                        Nenhum log gravado ainda.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-stone-50 dark:hover:bg-stone-900/40">
                        <td className="p-3 font-mono text-stone-400 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString("pt-BR")}
                        </td>
                        <td className="p-3 font-bold">{maskEmail(log.actorEmail)}</td>
                        <td className="p-3 font-mono text-stone-500">{maskIp(log.ipAddress)}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 font-semibold text-stone-600 dark:text-stone-300">
                            {log.action}
                          </span>
                        </td>
                        <td className="p-3">{log.details}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </PaperCard>
        )}

        {/* Modal de Membros da Família */}
        <Modal
          isOpen={!!selectedFamily}
          onClose={() => setSelectedFamily(null)}
          title={`Membros da Família: ${selectedFamily?.name ?? ""}`}
          subtitle={`Dono: ${maskName(selectedFamily?.ownerName || "")} (${maskEmail(selectedFamily?.ownerEmail || "")})`}
        >
          <div className="space-y-3 py-2">
            {selectedFamily?.members && selectedFamily.members.length > 0 ? (
              selectedFamily.members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-surface text-xs"
                >
                  <div>
                    <div className="font-bold text-stone-900 dark:text-stone-100">{maskName(m.name)}</div>
                    <div className="text-stone-500 font-mono">{maskEmail(m.email)}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    {m.role}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-stone-400 text-xs">
                Nenhum membro listado nesta família.
              </div>
            )}
          </div>
        </Modal>

        {/* Modal de Resposta a Chamado */}
        <Modal
          isOpen={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
          title="Moderar Chamado de Suporte"
          subtitle={`Assunto: "${selectedTicket?.subject ?? ""}" de ${maskName(selectedTicket?.userName ?? "")}`}
        >
          <form onSubmit={handleUpdateTicket} className="space-y-4">
            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900 text-xs text-stone-600 dark:text-stone-300 space-y-1">
              <div><strong>Descrição do Usuário:</strong></div>
              <p className="whitespace-pre-line">{selectedTicket?.description}</p>
            </div>

            <SelectField
              id="modStatus"
              label="Status do Chamado"
              value={modStatus}
              onValueChange={setModStatus}
              options={[
                { label: "📬 Aberto", value: "OPEN" },
                { label: "⏳ Em Andamento", value: "IN_PROGRESS" },
                { label: "✅ Resolvido / Concluído", value: "RESOLVED" },
              ]}
              required
            />

            <TextAreaField
              id="modNotes"
              label="Notas / Resposta da Administração (visível para o usuário)"
              placeholder="Ex: Olá! Já ajustamos sua permissão e o problema foi corrigido..."
              value={modNotes}
              onValueChange={setModNotes}
              rows={4}
            />

            <div className="flex justify-end gap-3 pt-3 border-t border-surface-variant">
              <ActionButton
                type="button"
                variant="outline"
                onClick={() => setSelectedTicket(null)}
              >
                Cancelar
              </ActionButton>
              <ActionButton
                type="submit"
                variant="primary"
                disabled={updatingTicket}
              >
                {updatingTicket ? "Salvando..." : "Salvar Resposta"}
              </ActionButton>
            </div>
          </form>
        </Modal>

        {/* Modal de Relatório de Portabilidade LGPD */}
        <Modal
          isOpen={!!exportDataResult}
          onClose={() => setExportDataResult(null)}
          title="Relatório de Portabilidade de Dados (Art. 18 LGPD)"
          subtitle="Pacote de dados pessoais estruturado conforme solicitação do titular."
          maxWidth="lg"
        >
          {exportDataResult && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200">
                <span className="font-bold">✓ Relatório Oficial Emitido:</span> {exportDataResult.lgpdDisclaimer}
              </div>

              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900">
                <div><strong>Titular:</strong> {exportDataResult.name}</div>
                <div><strong>E-mail:</strong> {exportDataResult.email}</div>
                <div><strong>ID do Titular:</strong> {exportDataResult.userId}</div>
                <div><strong>Data de Cadastro:</strong> {new Date(exportDataResult.createdAt).toLocaleDateString("pt-BR")}</div>
                <div><strong>Famílias Vinculadas:</strong> {exportDataResult.families.join(", ") || "Nenhuma"}</div>
                <div><strong>Total de Receitas:</strong> {exportDataResult.totalRecipesCreated}</div>
                <div><strong>Total de Dietas:</strong> {exportDataResult.totalDietsCreated}</div>
                <div><strong>Total de Treinos:</strong> {exportDataResult.totalWorkoutsLogged}</div>
                <div><strong>Requisições IA:</strong> {exportDataResult.totalAiRequests}</div>
                <div><strong>Emitido em:</strong> {new Date(exportDataResult.exportedAt).toLocaleString("pt-BR")}</div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={handleDownloadExportJson}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-primary text-white shadow-md hover:bg-primary-hover cursor-pointer"
                >
                  💾 Baixar Arquivo JSON Completo
                </button>

                <button
                  type="button"
                  onClick={() => setExportDataResult(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-100 cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* Modal de Confirmação de Anonimização LGPD */}
        <ConfirmDialog
          isOpen={!!userToAnonymize}
          onClose={() => setUserToAnonymize(null)}
          onConfirm={handleConfirmAnonymize}
          loading={anonymizing}
          title={`Anonimizar dados de "${userToAnonymize?.name}"?`}
          description={
            <div className="space-y-2">
              <p>
                Esta ação é <strong>definitiva e irreversível</strong> em atendimento ao Artigo 18, inciso VI da <strong>Lei Geral de Proteção de Dados (LGPD)</strong>.
              </p>
              <ul className="list-disc pl-4 text-xs space-y-1 text-red-700 dark:text-red-400">
                <li>O nome será substituído por &quot;Usuário Anonimizado (LGPD)&quot;.</li>
                <li>O e-mail será descartado e substituído por pseudônimo.</li>
                <li>Todos os dados biométricos (peso, altura, sexo, calorias) serão apagados.</li>
                <li>A conta será desativada e não poderá mais efetuar login.</li>
              </ul>
            </div>
          }
          confirmLabel="Sim, Anonimizar Definitivamente"
          cancelLabel="Cancelar"
          variant="danger"
        />

        {/* Modal de Justificativa para Revelar Dados Pessoais (LGPD) */}
        <Modal
          isOpen={showPiiReasonModal}
          onClose={() => setShowPiiReasonModal(false)}
          title="Justificativa de Acesso a Dados Pessoais (LGPD)"
          subtitle="Conformidade LGPD: Informe o motivo da revelação para registro no log de auditoria."
        >
          <form onSubmit={handleConfirmPiiReveal} className="space-y-4">
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-200 space-y-1">
              <span className="font-bold">⚠️ Atenção:</span> Por exigência da Lei Geral de Proteção de Dados (Art. 6º da Lei 13.709/2018), a consulta aos dados de contato e identificação de titulares é restrita a finalidades legítimas e será auditada com seu e-mail e data/hora. A visualização terá duração de <strong>10 minutos</strong>.
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                Motivos Frequentes:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Atendimento a chamado de suporte do titular",
                  "Investigação de erro de acesso ou autenticação",
                  "Solicitação formal do titular (Art. 18 LGPD)",
                  "Auditoria periódica de segurança e governança",
                ].map((reasonOption) => (
                  <button
                    key={reasonOption}
                    type="button"
                    onClick={() => setPiiReason(reasonOption)}
                    className="text-[11px] px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 cursor-pointer"
                  >
                    + {reasonOption}
                  </button>
                ))}
              </div>
            </div>

            <TextAreaField
              id="piiReason"
              label="Justificativa do Acesso (Obrigatório, mín. 5 caracteres)"
              placeholder="Ex: Atendimento ao chamado de suporte referente a alteração de plano familiar..."
              value={piiReason}
              onValueChange={setPiiReason}
              rows={3}
              required
            />

            <div className="flex justify-end gap-3 pt-3 border-t border-surface-variant">
              <ActionButton
                type="button"
                variant="outline"
                onClick={() => setShowPiiReasonModal(false)}
              >
                Cancelar
              </ActionButton>
              <ActionButton
                type="submit"
                variant="primary"
                disabled={confirmingPii || piiReason.trim().length < 5}
              >
                {confirmingPii ? "Gravando Auditoria..." : "Confirmar e Desmascarar"}
              </ActionButton>
            </div>
          </form>
        </Modal>

        {/* Modal de Criação de Operador */}
        <Modal
          isOpen={showCreateTeamModal}
          onClose={() => setShowCreateTeamModal(false)}
          title="Cadastrar Novo Operador do Backoffice"
          subtitle="Crie credenciais exclusivas de acesso administrativo e defina o perfil de permissões."
        >
          <form onSubmit={handleCreateTeamMember} className="space-y-4">
            <TextInput
              id="newTeamName"
              label="Nome Completo"
              placeholder="Ex: Carlos Oliveira"
              value={newTeamName}
              onValueChange={setNewTeamName}
              required
            />

            <TextInput
              id="newTeamEmail"
              type="email"
              label="E-mail de Acesso"
              placeholder="carlos@suaempresa.com"
              value={newTeamEmail}
              onValueChange={setNewTeamEmail}
              required
            />

            <TextInput
              id="newTeamPassword"
              type="password"
              label="Senha Provisória (mín. 6 caracteres)"
              placeholder="••••••••"
              value={newTeamPassword}
              onValueChange={setNewTeamPassword}
              required
            />

            <SelectField
              id="newTeamRole"
              label="Perfil de Permissões (RBAC)"
              value={newTeamRole}
              onValueChange={(val) => setNewTeamRole(val as AdminRole)}
              options={[
                { label: "👑 Super Admin (Acesso Irrestrito)", value: "SUPER_ADMIN" },
                { label: "🛡️ Admin Operacional (Usuários, Famílias e Chamados)", value: "ADMIN" },
                { label: "🎧 Suporte & Atendimento (Chamados e Consulta)", value: "SUPPORT" },
                { label: "👁️ Somente Leitura / Auditor (Métricas e Auditoria)", value: "READ_ONLY" },
              ]}
              required
            />

            <div className="flex justify-end gap-3 pt-3 border-t border-surface-variant">
              <ActionButton
                type="button"
                variant="outline"
                onClick={() => setShowCreateTeamModal(false)}
              >
                Cancelar
              </ActionButton>
              <ActionButton
                type="submit"
                variant="primary"
                disabled={creatingMember}
              >
                {creatingMember ? "Criando..." : "Criar Operador"}
              </ActionButton>
            </div>
          </form>
        </Modal>

        {/* Modal de Edição de Perfil */}
        <Modal
          isOpen={!!memberToEditRole}
          onClose={() => setMemberToEditRole(null)}
          title={`Alterar Perfil: ${memberToEditRole?.name ?? ""}`}
          subtitle={`E-mail: ${memberToEditRole?.email ?? ""}`}
        >
          <form onSubmit={handleUpdateMemberRole} className="space-y-4">
            <SelectField
              id="selectedRole"
              label="Selecione o Novo Perfil"
              value={selectedRole}
              onValueChange={(val) => setSelectedRole(val as AdminRole)}
              options={[
                { label: "👑 Super Admin (Acesso Irrestrito)", value: "SUPER_ADMIN" },
                { label: "🛡️ Admin Operacional (Usuários, Famílias e Chamados)", value: "ADMIN" },
                { label: "🎧 Suporte & Atendimento (Chamados e Consulta)", value: "SUPPORT" },
                { label: "👁️ Somente Leitura / Auditor (Métricas e Auditoria)", value: "READ_ONLY" },
              ]}
              required
            />

            <div className="flex justify-end gap-3 pt-3 border-t border-surface-variant">
              <ActionButton
                type="button"
                variant="outline"
                onClick={() => setMemberToEditRole(null)}
              >
                Cancelar
              </ActionButton>
              <ActionButton
                type="submit"
                variant="primary"
                disabled={updatingRole}
              >
                {updatingRole ? "Salvando..." : "Salvar Perfil"}
              </ActionButton>
            </div>
          </form>
        </Modal>

        {/* Modal de Confirmação de Exclusão de Operador */}
        <ConfirmDialog
          isOpen={!!memberToDelete}
          onClose={() => setMemberToDelete(null)}
          onConfirm={handleDeleteMember}
          loading={deletingMember}
          title={`Excluir operador "${memberToDelete?.name}"?`}
          description={
            <div className="space-y-2 text-xs">
              <p>O acesso deste operador ao Backoffice será revogado imediatamente.</p>
              <p className="font-semibold text-red-600">Esta ação é irreversível e ficará registrada no log de auditoria.</p>
            </div>
          }
          confirmLabel="Sim, Excluir Operador"
          cancelLabel="Cancelar"
          variant="danger"
        />
      </div>
    </AdminShell>
  );
}
