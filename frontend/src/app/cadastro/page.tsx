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
    <AuthNotebookShell featureLabel="Nova receita da casa">
      <form onSubmit={handleRegister}>
        <AuthPanelHeader
          eyebrow="Comece seu caderno"
          title="Crie sua conta"
          subtitle="Entre para a mesa e guarde receitas, perfil e evolucao em familia."
        />

        <div className="mt-8 space-y-5">
          <AuthTextInput
            label="Seu nome"
            marker="nome"
            maxLength={150}
            placeholder="como vamos te chamar?"
            required
            value={name}
            onValueChange={setName}
          />
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
          <AuthTextInput
            label="Sua senha"
            marker="lock"
            maxLength={72}
            minLength={8}
            placeholder="minimo de 8 caracteres..."
            required
            type="password"
            value={password}
            onValueChange={setPassword}
          />
        </div>

        <div className="mt-8 space-y-5">
          <AuthStickerButton disabled={loading} type="submit" variant="secondary">
            {loading ? "Criando..." : "Criar Conta"}
          </AuthStickerButton>
          <AuthDivider label="ja tem cadastro?" />
          <AuthStickerLink href="/login" variant="primary">
            Entrar
          </AuthStickerLink>
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
