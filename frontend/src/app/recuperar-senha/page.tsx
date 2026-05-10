"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { forgotPassword } from "@/services/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleForgotPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setStatus("");
    setResetToken("");

    try {
      const response = await forgotPassword({ email });
      if (response.accepted) {
        setStatus("Se o e-mail existir, as instrucoes de redefinicao serao enviadas.");
      }
      if (response.resetToken) {
        setResetToken(response.resetToken);
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Falha ao solicitar recuperacao."
      );
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
          onSubmit={handleForgotPassword}
        >
          <h1 className="text-2xl font-semibold text-ink">Recuperar senha</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Informe seu e-mail para iniciar a redefinicao de senha.
          </p>

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

          <button
            className="mt-6 w-full rounded-md bg-leaf-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            disabled={loading}
            type="submit"
          >
            {loading ? "Enviando..." : "Solicitar recuperacao"}
          </button>

          {status ? (
            <p className="mt-4 rounded-md bg-leaf-50 p-3 text-sm text-leaf-700">{status}</p>
          ) : null}
          {error ? (
            <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>
          ) : null}

          {resetToken ? (
            <div className="mt-4 rounded-md border border-leaf-100 bg-leaf-50 p-3">
              <p className="text-xs font-semibold uppercase text-leaf-700">Token dev</p>
              <p className="mt-2 break-all text-xs text-slate-700">{resetToken}</p>
              <Link
                className="mt-3 inline-flex rounded-md bg-leaf-700 px-3 py-2 text-sm font-semibold text-white"
                href={`/redefinir-senha?token=${encodeURIComponent(resetToken)}`}
              >
                Redefinir senha
              </Link>
            </div>
          ) : null}

          <p className="mt-4 text-center text-sm text-slate-600">
            Lembrou a senha?{" "}
            <Link className="font-semibold text-leaf-700" href="/login">
              Entrar
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
