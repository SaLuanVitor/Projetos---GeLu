"use client";

import { AppShell } from "@/components/layout/AppShell";
import { ActionButton, ActionLink } from "@/components/ui/ActionButton";
import { TextInput } from "@/components/ui/FormField";
import { PaperCard } from "@/components/ui/PaperCard";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { forgotPassword } from "@/services/auth";
import { FormEvent, useState } from "react";

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
    <AppShell>
      <main className="mx-auto grid max-w-5xl gap-8 px-5 py-10 lg:grid-cols-[1fr_430px]">
        <section className="flex flex-col justify-center">
          <p className="text-sm font-bold uppercase tracking-wide text-secondary">
            Recuperacao de acesso
          </p>
          <h1 className="mt-3 font-display text-5xl font-extrabold leading-tight text-primary">
            Vamos preparar uma nova senha para seu caderno.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-on-surface-variant">
            Em ambiente local, o token de desenvolvimento aparece na tela para facilitar a
            validacao.
          </p>
          <ActionLink className="mt-6 w-fit" href="/login" variant="outline">
            Voltar ao login
          </ActionLink>
        </section>

        <PaperCard tape="brown">
          <form onSubmit={handleForgotPassword}>
            <h2 className="font-display text-3xl font-bold text-tertiary">Recuperar senha</h2>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              Informe o e-mail cadastrado para iniciar a redefinicao.
            </p>

            <div className="mt-6">
              <TextInput
                label="E-mail"
                maxLength={180}
                required
                type="email"
                value={email}
                onValueChange={setEmail}
              />
            </div>

            <ActionButton className="mt-6 w-full" disabled={loading} type="submit">
              {loading ? "Enviando..." : "Solicitar recuperacao"}
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

            {resetToken ? (
              <div className="mt-5 rounded-lg border-2 border-outline bg-primary-fixed p-4 text-on-primary-fixed">
                <p className="text-xs font-bold uppercase tracking-wide">Token dev</p>
                <p className="mt-2 break-all text-xs">{resetToken}</p>
                <ActionLink
                  className="mt-4"
                  href={`/redefinir-senha?token=${encodeURIComponent(resetToken)}`}
                  variant="secondary"
                >
                  Redefinir senha
                </ActionLink>
              </div>
            ) : null}
          </form>
        </PaperCard>
      </main>
    </AppShell>
  );
}
