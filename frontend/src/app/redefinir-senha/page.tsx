"use client";

import {
  AuthDivider,
  AuthNotebookShell,
  AuthPanelHeader,
  AuthStickerButton,
  AuthStickerLink,
  AuthTextArea,
  AuthTextInput
} from "@/components/layout/AuthNotebookShell";
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
    <AuthNotebookShell featureLabel="Nova chave do caderno">
      <form onSubmit={handleResetPassword}>
        <AuthPanelHeader
          eyebrow="Nova senha"
          title="Troque a chave do seu caderno"
          subtitle="Cole o token recebido e escolha uma senha forte para voltar ao planejamento."
        />

        <div className="mt-8 space-y-5">
          <AuthTextArea
            label="Token"
            placeholder="cole o token aqui..."
            required
            value={token}
            onValueChange={setToken}
          />
          <AuthTextInput
            label="Nova senha"
            marker="lock"
            maxLength={72}
            minLength={8}
            placeholder="sua nova senha secreta..."
            required
            type="password"
            value={newPassword}
            onValueChange={setNewPassword}
          />
        </div>

        <div className="mt-8 space-y-5">
          <AuthStickerButton disabled={loading} type="submit">
            {loading ? "Redefinindo..." : "Redefinir"}
          </AuthStickerButton>
          <AuthDivider label="pronto para entrar?" />
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
      </form>
    </AuthNotebookShell>
  );
}
