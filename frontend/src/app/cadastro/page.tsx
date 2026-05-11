"use client";

import { AppShell } from "@/components/layout/AppShell";
import { ActionButton, ActionLink } from "@/components/ui/ActionButton";
import { PaperCard } from "@/components/ui/PaperCard";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { TextInput } from "@/components/ui/FormField";
import { registerUser } from "@/services/auth";
import { FormEvent, useState } from "react";

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
    <AppShell>
      <main className="mx-auto grid max-w-5xl gap-8 px-5 py-10 lg:grid-cols-[1fr_430px]">
        <section className="flex flex-col justify-center">
          <p className="text-sm font-bold uppercase tracking-wide text-secondary">
            Comece seu caderno
          </p>
          <h1 className="mt-3 font-display text-5xl font-extrabold leading-tight text-primary">
            Crie uma conta para guardar receitas, peso e planos da familia.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-on-surface-variant">
            O cadastro abre o espaco pessoal do Gelu - Menu com seguranca e pronto para as proximas
            sprints do planner alimentar.
          </p>
          <ActionLink className="mt-6 w-fit" href="/login" variant="outline">
            Ja tenho conta
          </ActionLink>
        </section>

        <PaperCard tape="green">
          <form onSubmit={handleRegister}>
            <h2 className="font-display text-3xl font-bold text-tertiary">Criar conta</h2>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              Preencha os dados como quem abre a primeira pagina de um livro de receitas.
            </p>

            <div className="mt-6 space-y-5">
              <TextInput
                label="Nome"
                maxLength={150}
                required
                value={name}
                onValueChange={setName}
              />
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
              {loading ? "Criando..." : "Criar conta"}
            </ActionButton>

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
    </AppShell>
  );
}
