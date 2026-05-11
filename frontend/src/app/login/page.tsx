"use client";

import { PublicShell } from "@/components/layout/PublicShell";
import { ActionButton, ActionLink } from "@/components/ui/ActionButton";
import { TextInput } from "@/components/ui/FormField";
import { PaperCard } from "@/components/ui/PaperCard";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { loginUser, refreshAuthToken } from "@/services/auth";
import {
  clearSession,
  loadSession,
  saveSession,
  type StoredSession,
  updateSessionTokens
} from "@/services/session";
import { FormEvent, useEffect, useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [session, setSession] = useState<StoredSession | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSession(loadSession());
  }, []);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setStatus("");

    try {
      const auth = await loginUser({ email, password });
      setSession(saveSession(auth));
      setStatus("Login realizado com sucesso.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Falha ao entrar.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    if (!session) {
      return;
    }

    setLoading(true);
    setError("");
    setStatus("");

    try {
      const tokens = await refreshAuthToken({ refreshToken: session.refreshToken });
      setSession(updateSessionTokens(session, tokens));
      setStatus("Token renovado com sucesso.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Falha ao renovar token.");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    clearSession();
    setSession(null);
    setStatus("Sessao local encerrada.");
  }

  return (
    <PublicShell actionHref="/cadastro" actionLabel="Criar conta">
      <main className="mx-auto grid max-w-5xl gap-8 px-5 py-10 lg:grid-cols-[1fr_430px]">
        <section className="flex flex-col justify-center">
          <p className="text-sm font-bold uppercase tracking-wide text-secondary">
            Voltar para a cozinha
          </p>
          <h1 className="mt-3 font-display text-5xl font-extrabold leading-tight text-primary">
            Entre para continuar seu diario alimentar.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-on-surface-variant">
            A conta conecta seus dados de perfil, peso e sessoes futuras em uma experiencia simples
            e acolhedora.
          </p>

          {session ? (
            <PaperCard className="mt-8 max-w-xl" tape="green">
              <p className="text-sm font-bold uppercase tracking-wide text-secondary">
                Sessao ativa
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold text-tertiary">
                {session.user.name}
              </h2>
              <p className="mt-1 text-sm text-on-surface-variant">{session.user.email}</p>
              <p className="mt-3 text-xs text-on-surface-variant">
                Atualizada em {new Date(session.updatedAt).toLocaleString("pt-BR")}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <ActionButton disabled={loading} onClick={handleRefresh} type="button">
                  Renovar token
                </ActionButton>
                <ActionButton onClick={handleLogout} type="button" variant="outline">
                  Sair localmente
                </ActionButton>
                <ActionLink href="/perfil" variant="secondary">
                  Perfil
                </ActionLink>
              </div>
            </PaperCard>
          ) : null}
        </section>

        <PaperCard tape="orange">
          <form onSubmit={handleLogin}>
            <h2 className="font-display text-3xl font-bold text-tertiary">Login</h2>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              Use e-mail e senha para abrir o seu caderno.
            </p>

            <div className="mt-6 space-y-5">
              <TextInput
                label="E-mail"
                maxLength={180}
                required
                type="email"
                value={email}
                onValueChange={setEmail}
              />
              <TextInput
                label="Senha"
                maxLength={72}
                minLength={8}
                required
                type="password"
                value={password}
                onValueChange={setPassword}
              />
            </div>

            <ActionButton className="mt-6 w-full" disabled={loading} type="submit">
              {loading ? "Entrando..." : "Entrar"}
            </ActionButton>

            <div className="mt-5 flex items-center justify-between gap-4 text-sm font-bold text-primary">
              <ActionLink href="/cadastro" variant="outline">
                Criar conta
              </ActionLink>
              <ActionLink href="/recuperar-senha" variant="outline">
                Esqueci a senha
              </ActionLink>
            </div>

            {status ? (
              <StatusMessage className="mt-4" variant="success">
                {status}
              </StatusMessage>
            ) : null}
            {error ? (
              <StatusMessage className="mt-4" variant="error">
                {error}
              </StatusMessage>
            ) : null}
          </form>
        </PaperCard>
      </main>
    </PublicShell>
  );
}
