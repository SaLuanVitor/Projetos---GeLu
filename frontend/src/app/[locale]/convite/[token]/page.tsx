"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PaperCard } from "@/components/ui/PaperCard";
import { ActionButton } from "@/components/ui/ActionButton";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { useToast } from "@/components/ui/Toast";
import { getValidSession } from "@/services/auth";
import {
  acceptFamilyInvite,
  getFamilyInviteByToken,
  rejectFamilyInvite,
} from "@/services/families";
import type { FamilyInviteResponse } from "@/types/api";

export default function InvitePage() {
  const params = useParams();
  const token = typeof params.token === "string" ? params.token : "";
  const router = useRouter();
  const toast = useToast();

  const [invite, setInvite] = useState<FamilyInviteResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!token) {
        setError("Token de convite inválido.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const session = await getValidSession();
        if (active) {
          setIsAuthenticated(Boolean(session));
        }

        const data = await getFamilyInviteByToken(token);
        if (active) {
          setInvite(data);
        }
      } catch (err: unknown) {
        if (!active) return;
        const msg =
          err instanceof Error
            ? err.message
            : "Este convite não foi encontrado ou expirou.";
        setError(msg);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    try {
      setProcessing(true);
      const session = await getValidSession();
      if (!session) {
        router.replace("/login");
        return;
      }
      await acceptFamilyInvite(session.accessToken, token);
      toast.success(`🎉 Bem-vindo(a) à família ${invite?.familyName}!`);
      router.replace("/familia");
    } catch (err: unknown) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Não foi possível aceitar o convite."
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!token) return;
    try {
      setProcessing(true);
      const session = await getValidSession();
      if (session) {
        await rejectFamilyInvite(session.accessToken, token);
      }
      toast.info("Convite recusado.");
      router.replace("/dashboard");
    } catch {
      toast.error("Erro ao recusar convite.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AppShell>
      <main className="mx-auto max-w-lg px-4 py-16 sm:px-6">
        {loading ? (
          <StatusMessage>Carregando informações do convite...</StatusMessage>
        ) : error ? (
          <PaperCard className="p-8 text-center" tape="orange">
            <span className="text-4xl block mb-3">⚠️</span>
            <h2 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100">
              Convite Indisponível
            </h2>
            <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
              {error}
            </p>
            <div className="mt-6">
              <ActionButton onClick={() => router.replace("/dashboard")}>
                Ir para o Início
              </ActionButton>
            </div>
          </PaperCard>
        ) : invite ? (
          <PaperCard className="p-8 text-center relative" tape="green">
            <span className="text-5xl block mb-2">🏡</span>

            <span className="inline-block rounded-full px-3 py-1 text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 mb-3">
              Convite de Família
            </span>

            <h2 className="font-display text-3xl font-extrabold text-stone-900 dark:text-stone-100">
              {invite.familyName}
            </h2>

            <p className="mt-3 text-sm text-stone-600 dark:text-stone-300 leading-relaxed max-w-md mx-auto">
              <strong className="text-stone-900 dark:text-stone-100">
                {invite.invitedByUserName}
              </strong>{" "}
              convidou você para fazer parte do espaço da família como{" "}
              <strong className="text-amber-800 dark:text-amber-300">
                {invite.role}
              </strong>
              .
            </p>

            <div className="mt-6 rounded-2xl border border-stone-200 dark:border-stone-700/80 bg-stone-50/80 dark:bg-[#25201c] p-4 text-xs text-stone-500 dark:text-stone-400 text-left space-y-1">
              <p>
                <strong>E-mail convidado:</strong> {invite.invitedEmail}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                <span
                  className={
                    invite.status === "PENDING"
                      ? "text-emerald-600 dark:text-emerald-400 font-bold"
                      : "text-stone-500 font-bold"
                  }
                >
                  {invite.status === "PENDING" ? "Aguardando Resposta" : invite.status}
                </span>
              </p>
              <p>
                <strong>Expira em:</strong>{" "}
                {new Date(invite.expiresAt).toLocaleDateString("pt-BR")}
              </p>
            </div>

            {invite.status !== "PENDING" ? (
              <div className="mt-6">
                <p className="text-sm font-semibold text-stone-600 dark:text-stone-400 mb-4">
                  Este convite já foi {invite.status.toLowerCase()}.
                </p>
                <ActionButton onClick={() => router.replace("/dashboard")}>
                  Ir para o Início
                </ActionButton>
              </div>
            ) : !isAuthenticated ? (
              <div className="mt-8 space-y-3">
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Faça login para aceitar este convite e entrar na família.
                </p>
                <ActionButton
                  className="w-full"
                  onClick={() => router.push("/login")}
                >
                  Fazer Login para Entrar
                </ActionButton>
              </div>
            ) : (
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <ActionButton
                  type="button"
                  variant="outline"
                  onClick={handleReject}
                  disabled={processing}
                >
                  Recusar Convite
                </ActionButton>
                <ActionButton
                  type="button"
                  onClick={handleAccept}
                  disabled={processing}
                >
                  {processing ? "Entrando..." : "Aceitar Convite e Entrar"}
                </ActionButton>
              </div>
            )}
          </PaperCard>
        ) : null}
      </main>
    </AppShell>
  );
}
