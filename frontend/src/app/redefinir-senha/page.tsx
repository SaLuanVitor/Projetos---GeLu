"use client";

import { PublicShell } from "@/components/layout/PublicShell";
import { ActionButton, ActionLink } from "@/components/ui/ActionButton";
import { TextAreaField, TextInput } from "@/components/ui/FormField";
import { PaperCard } from "@/components/ui/PaperCard";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { resetPassword } from "@/services/auth";
import { FormEvent, useEffect, useState } from "react";

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
    <PublicShell actionHref="/login" actionLabel="Entrar">
      <main className="mx-auto grid max-w-5xl gap-8 px-5 py-10 lg:grid-cols-[1fr_430px]">
        <section className="flex flex-col justify-center">
          <p className="text-sm font-bold uppercase tracking-wide text-secondary">Nova senha</p>
          <h1 className="mt-3 font-display text-5xl font-extrabold leading-tight text-primary">
            Troque a chave do seu caderno com seguranca.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-on-surface-variant">
            Cole o token recebido e escolha uma senha forte para voltar ao planejamento.
          </p>
          <ActionLink className="mt-6 w-fit" href="/login" variant="outline">
            Voltar ao login
          </ActionLink>
        </section>

        <PaperCard tape="orange">
          <form onSubmit={handleResetPassword}>
            <h2 className="font-display text-3xl font-bold text-tertiary">Redefinir senha</h2>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              O token e usado uma unica vez.
            </p>

            <div className="mt-6 space-y-5">
              <TextAreaField label="Token" required value={token} onValueChange={setToken} />
              <TextInput
                label="Nova senha"
                maxLength={72}
                minLength={8}
                required
                type="password"
                value={newPassword}
                onValueChange={setNewPassword}
              />
            </div>

            <ActionButton className="mt-6 w-full" disabled={loading} type="submit">
              {loading ? "Redefinindo..." : "Redefinir senha"}
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
    </PublicShell>
  );
}
