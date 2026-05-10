"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { resetPassword } from "@/services/auth";

export default function ResetPasswordPage() {
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    setToken(searchParams.get("token") ?? "");
  }, []);

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setStatus("");

    try {
      await resetPassword({ token, newPassword });
      setStatus("Senha redefinida com sucesso. Voce ja pode entrar com a nova senha.");
      setNewPassword("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Falha ao redefinir senha.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <section className="mx-auto max-w-md">
        <Link className="text-sm font-semibold text-leaf-700" href="/">
          Gelu - Menu
        </Link>
        <form
          className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
          onSubmit={handleResetPassword}
        >
          <h1 className="text-2xl font-semibold text-ink">Redefinir senha</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Use o token recebido e escolha uma nova senha.
          </p>

          <label className="mt-5 block text-sm font-medium text-slate-700">
            Token
            <textarea
              className="mt-2 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-leaf-600"
              onChange={(event) => setToken(event.target.value)}
              required
              value={token}
            />
          </label>
          <label className="mt-4 block text-sm font-medium text-slate-700">
            Nova senha
            <input
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-leaf-600"
              maxLength={72}
              minLength={8}
              onChange={(event) => setNewPassword(event.target.value)}
              required
              type="password"
              value={newPassword}
            />
          </label>

          <button
            className="mt-6 w-full rounded-md bg-leaf-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            disabled={loading}
            type="submit"
          >
            {loading ? "Redefinindo..." : "Redefinir senha"}
          </button>

          {status ? (
            <p className="mt-4 rounded-md bg-leaf-50 p-3 text-sm text-leaf-700">{status}</p>
          ) : null}
          {error ? (
            <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>
          ) : null}

          <p className="mt-4 text-center text-sm text-slate-600">
            Voltar para{" "}
            <Link className="font-semibold text-leaf-700" href="/login">
              login
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
