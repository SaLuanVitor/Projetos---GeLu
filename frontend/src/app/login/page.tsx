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
import { loginUser } from "@/services/auth";
import { saveSession } from "@/services/session";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setStatus("");

    try {
      const auth = await loginUser({ email, password });
      saveSession(auth);
      setStatus("Login realizado com sucesso.");
      router.push("/dashboard");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Falha ao entrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthNotebookShell>
      <form onSubmit={handleLogin}>
        <AuthPanelHeader
          title="Bem-vindo ao caderno"
          subtitle="Entre para ver o que tem pro jantar hoje."
        />

        <div className="mt-8 space-y-6">
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
            labelAction={
              <Link className="font-bold text-primary hover:underline" href="/recuperar-senha">
                Esqueci minha senha
              </Link>
            }
            marker="lock"
            maxLength={72}
            minLength={8}
            placeholder="sua senha secreta..."
            required
            type="password"
            value={password}
            onValueChange={setPassword}
          />
        </div>

        <div className="mt-8 space-y-5">
          <AuthStickerButton disabled={loading} type="submit">
            {loading ? "Entrando..." : "Entrar"}
          </AuthStickerButton>
          <AuthDivider />
          <AuthStickerLink href="/cadastro">Criar Conta</AuthStickerLink>
        </div>

        <p className="mt-8 text-center text-base leading-7 text-on-surface-variant">
          Ainda nao faz parte da nossa mesa?
          <br />
          <Link className="font-bold text-primary hover:underline" href="/cadastro">
            Venha cozinhar com a gente!
          </Link>
        </p>

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
