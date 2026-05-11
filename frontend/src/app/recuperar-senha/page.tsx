"use client";

import {
  AuthDivider,
  AuthNotebookShell,
  AuthPanelHeader,
  AuthStickerButton,
  AuthStickerLink,
  AuthTextInput
} from "@/components/layout/AuthNotebookShell";
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
    <AuthNotebookShell featureLabel="Bilhete de acesso">
      <form onSubmit={handleForgotPassword}>
        <AuthPanelHeader
          eyebrow="Recuperacao de acesso"
          title="Vamos preparar uma nova senha"
          subtitle="Informe seu e-mail e, se ele existir, enviaremos o caminho de volta para o caderno."
        />

        <div className="mt-8">
          <AuthTextInput
            label="Seu e-mail"
            marker="edit"
            maxLength={180}
            placeholder="escreva seu e-mail aqui..."
            required
            type="email"
            value={email}
            onValueChange={setEmail}
          />
        </div>

        <div className="mt-8 space-y-5">
          <AuthStickerButton disabled={loading} type="submit">
            {loading ? "Enviando..." : "Solicitar"}
          </AuthStickerButton>
          <AuthDivider label="lembrou?" />
          <AuthStickerLink href="/login">Voltar ao Login</AuthStickerLink>
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

        {resetToken ? (
          <div className="mt-5 rounded-xl border-2 border-outline bg-primary-fixed p-4 text-on-primary-fixed">
            <p className="text-xs font-bold uppercase tracking-wide">Token dev</p>
            <p className="mt-2 break-all text-xs">{resetToken}</p>
            <div className="mt-4">
              <AuthStickerLink
                href={`/redefinir-senha?token=${encodeURIComponent(resetToken)}`}
                variant="secondary"
              >
                Redefinir
              </AuthStickerLink>
            </div>
          </div>
        ) : null}
      </form>
    </AuthNotebookShell>
  );
}
