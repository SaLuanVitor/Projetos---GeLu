"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "@/services/auth";
import { clearSession, saveSession } from "@/services/session";
import { TextInput } from "@/components/ui/FormField";
import { ActionButton } from "@/components/ui/ActionButton";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { PaperCard } from "@/components/ui/PaperCard";
import { ThemeHeaderButton } from "@/components/theme/ThemeHeaderButton";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const auth = await loginUser({ email: email.trim(), password });

      if (!auth.user?.isSuperAdmin) {
        clearSession();
        setError(
          "Acesso negado. Esta conta não possui privilégios de Super Admin. Usuários comuns devem acessar o portal em http://localhost:3000"
        );
        return;
      }

      saveSession(auth);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Falha na autenticação administrativa. Verifique suas credenciais."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-surface flex flex-col justify-center items-center p-4 overflow-x-hidden">
      <div className="absolute top-4 right-4 z-20">
        <ThemeHeaderButton />
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-3xl shadow-sm mb-3">
            🛡️
          </div>
          <h1 className="font-display text-2xl font-black text-stone-900 dark:text-stone-100">
            GeLu Backoffice
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Console Exclusivo de Governança & Administração
          </p>
        </div>

        <PaperCard tape="orange">
          <form onSubmit={handleSubmit} className="space-y-4">
            <TextInput
              id="adminEmail"
              label="E-mail de Administrador"
              type="email"
              placeholder="admin@exemplo.com"
              required
              value={email}
              onValueChange={setEmail}
            />

            <TextInput
              id="adminPassword"
              label="Senha de Acesso"
              type="password"
              placeholder="••••••••"
              required
              value={password}
              onValueChange={setPassword}
            />

            {error && (
              <StatusMessage variant="error" className="text-xs">
                {error}
              </StatusMessage>
            )}

            <div className="pt-2">
              <ActionButton
                type="submit"
                variant="primary"
                disabled={loading}
                className="w-full justify-center"
              >
                {loading ? "Verificando Credenciais..." : "Entrar no Backoffice"}
              </ActionButton>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-surface-variant text-center text-[11px] text-stone-400">
            Acesso monitorado e registrado para fins de auditoria e segurança.
          </div>
        </PaperCard>
      </div>
    </div>
  );
}
