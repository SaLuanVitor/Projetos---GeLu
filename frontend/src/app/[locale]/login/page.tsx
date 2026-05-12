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
import { Link, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations("Auth.login");
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
      setStatus(t("success"));
      router.push("/dashboard");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t("error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthNotebookShell>
      <form onSubmit={handleLogin}>
        <AuthPanelHeader title={t("title")} subtitle={t("subtitle")} />

        <div className="mt-8 space-y-6">
          <AuthTextInput
            label={t("email")}
            maxLength={180}
            placeholder={t("emailPlaceholder")}
            required
            type="email"
            value={email}
            onValueChange={setEmail}
          />
          <AuthTextInput
            label={t("password")}
            labelAction={
              <Link className="font-bold text-primary hover:underline" href="/recuperar-senha">
                {t("forgotPassword")}
              </Link>
            }
            maxLength={72}
            minLength={8}
            placeholder={t("passwordPlaceholder")}
            required
            type="password"
            value={password}
            onValueChange={setPassword}
          />
        </div>

        <div className="mt-8 space-y-5">
          <AuthStickerButton disabled={loading} type="submit">
            {loading ? t("submitting") : t("submit")}
          </AuthStickerButton>
          <AuthDivider />
          <AuthStickerLink href="/cadastro">{t("register")}</AuthStickerLink>
        </div>

        <p className="mt-8 text-center text-base leading-7 text-on-surface-variant">
          {t("newHere")}
          <br />
          <Link className="font-bold text-primary hover:underline" href="/cadastro">
            {t("join")}
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
