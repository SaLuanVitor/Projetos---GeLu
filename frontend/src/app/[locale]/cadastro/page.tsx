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
import { useTranslations } from "next-intl";
import { FormEvent, useState } from "react";

export default function RegisterPage() {
  const t = useTranslations("Auth.register");
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
      setStatus(t("success"));
      setName("");
      setEmail("");
      setPassword("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t("error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthNotebookShell featureLabel={t("feature")}>
      <form onSubmit={handleRegister}>
        <AuthPanelHeader eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />

        <div className="mt-8 space-y-5">
          <AuthTextInput
            label={t("name")}
            marker={t("nameMarker")}
            maxLength={150}
            placeholder={t("namePlaceholder")}
            required
            value={name}
            onValueChange={setName}
          />
          <AuthTextInput
            label={t("email")}
            marker="edit"
            maxLength={180}
            placeholder={t("emailPlaceholder")}
            required
            type="email"
            value={email}
            onValueChange={setEmail}
          />
          <AuthTextInput
            label={t("password")}
            marker="lock"
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
          <AuthStickerButton disabled={loading} type="submit" variant="secondary">
            {loading ? t("submitting") : t("submit")}
          </AuthStickerButton>
          <AuthDivider label={t("divider")} />
          <AuthStickerLink href="/login" variant="primary">
            {t("login")}
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
