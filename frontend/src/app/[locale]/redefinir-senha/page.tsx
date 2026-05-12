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
import { useTranslations } from "next-intl";
import { FormEvent, useEffect, useState } from "react";

export default function ResetPasswordPage() {
  const t = useTranslations("Auth.reset");
  const auth = useTranslations("Auth");
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
      setStatus(t("success"));
      setNewPassword("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t("error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthNotebookShell featureLabel={t("feature")}>
      <form onSubmit={handleResetPassword}>
        <AuthPanelHeader eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />

        <div className="mt-8 space-y-5">
          <AuthTextArea
            label={t("token")}
            placeholder={t("tokenPlaceholder")}
            required
            value={token}
            onValueChange={setToken}
          />
          <AuthTextInput
            label={t("password")}
            marker="lock"
            maxLength={72}
            minLength={8}
            placeholder={t("passwordPlaceholder")}
            required
            type="password"
            value={newPassword}
            onValueChange={setNewPassword}
          />
        </div>

        <div className="mt-8 space-y-5">
          <AuthStickerButton disabled={loading} type="submit">
            {loading ? t("submitting") : t("submit")}
          </AuthStickerButton>
          <AuthDivider label={t("divider")} />
          <AuthStickerLink href="/login">{auth("loginBack")}</AuthStickerLink>
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
