"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { loginUser, refreshAuthToken } from "@/services/auth";
import {
  clearSession,
  loadSession,
  saveSession,
  type StoredSession,
  updateSessionTokens
} from "@/services/session";

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
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <section className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col justify-center">
          <Link className="text-sm font-semibold text-leaf-700" href="/">
            Gelu - Menu
          </Link>
          <h1 className="mt-4 text-3xl font-semibold text-ink">Entrar na sua conta</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
            Acesse o ambiente para organizar receitas, dietas, treinos e sugestoes assistivas.
          </p>

          {session ? (
            <div className="mt-8 rounded-lg border border-leaf-100 bg-white p-5">
              <p className="text-sm font-semibold text-ink">Sessao ativa</p>
              <p className="mt-2 text-sm text-slate-600">{session.user.name}</p>
              <p className="text-sm text-slate-600">{session.user.email}</p>
              <p className="mt-3 text-xs text-slate-500">
                Atualizada em {new Date(session.updatedAt).toLocaleString("pt-BR")}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  className="rounded-md bg-leaf-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  disabled={loading}
                  onClick={handleRefresh}
                  type="button"
                >
                  Renovar token
                </button>
                <button
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                  onClick={handleLogout}
                  type="button"
                >
                  Sair localmente
                </button>
                <Link
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                  href="/perfil"
                >
                  Perfil
                </Link>
              </div>
            </div>
          ) : null}
        </div>

        <form
          className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
          onSubmit={handleLogin}
        >
          <h2 className="text-lg font-semibold text-ink">Login</h2>
          <label className="mt-5 block text-sm font-medium text-slate-700">
            E-mail
            <input
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-leaf-600"
              maxLength={180}
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>
          <label className="mt-4 block text-sm font-medium text-slate-700">
            Senha
            <input
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-leaf-600"
              maxLength={72}
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>

          <button
            className="mt-6 w-full rounded-md bg-leaf-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            disabled={loading}
            type="submit"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>

          <div className="mt-4 flex items-center justify-between text-sm">
            <Link className="font-medium text-leaf-700" href="/cadastro">
              Criar conta
            </Link>
            <Link className="font-medium text-leaf-700" href="/recuperar-senha">
              Esqueci a senha
            </Link>
          </div>

          {status ? (
            <p className="mt-4 rounded-md bg-leaf-50 p-3 text-sm text-leaf-700">{status}</p>
          ) : null}
          {error ? (
            <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>
          ) : null}
        </form>
      </section>
    </main>
  );
}
