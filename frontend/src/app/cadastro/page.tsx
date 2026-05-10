"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { registerUser } from "@/services/auth";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setStatus("");

    try {
      await registerUser({ name, email, password });
      setStatus("Conta criada com sucesso. Voce ja pode entrar.");
      setName("");
      setEmail("");
      setPassword("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Falha ao criar conta.");
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
          onSubmit={handleRegister}
        >
          <h1 className="text-2xl font-semibold text-ink">Criar conta</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Comece com nome, e-mail e uma senha segura.
          </p>

          <label className="mt-5 block text-sm font-medium text-slate-700">
            Nome
            <input
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-leaf-600"
              maxLength={150}
              onChange={(event) => setName(event.target.value)}
              required
              type="text"
              value={name}
            />
          </label>
          <label className="mt-4 block text-sm font-medium text-slate-700">
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
            {loading ? "Criando..." : "Criar conta"}
          </button>

          <p className="mt-4 text-center text-sm text-slate-600">
            Ja tem conta?{" "}
            <Link className="font-semibold text-leaf-700" href="/login">
              Entrar
            </Link>
          </p>

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
