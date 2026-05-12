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
import { useTranslations } from "next-intl";
import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const t = useTranslations("Auth.forgot");
  const auth = useTranslations("Auth");
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
        setStatus(t("success"));
      }
      if (response.resetToken) {
        setResetToken(response.resetToken);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t("error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthNotebookShell featureLabel={t("feature")}>
      <form onSubmit={handleForgotPassword}>
        <AuthPanelHeader eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />

        <div className="mt-8">
          <AuthTextInput
            label={t("email")}
            maxLength={180}
            placeholder={t("emailPlaceholder")}
            required
            type="email"
            value={email}
            onValueChange={setEmail}
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

        {resetToken ? (
          <div className="mt-5 rounded-xl border-2 border-outline bg-primary-fixed p-4 text-on-primary-fixed">
            <p className="text-xs font-bold uppercase tracking-wide">{t("devToken")}</p>
            <p className="mt-2 break-all text-xs">{resetToken}</p>
            <div className="mt-4">
              <AuthStickerLink
                href={`/redefinir-senha?token=${encodeURIComponent(resetToken)}`}
                variant="secondary"
              >
                {t("reset")}
              </AuthStickerLink>
            </div>
          </div>
        ) : null}
      </form>
    </AuthNotebookShell>
  );
}
