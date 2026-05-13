"use client";

import { RecipeForm } from "@/components/recipes/RecipeForm";
import { AppShell } from "@/components/layout/AppShell";
import { PaperCard } from "@/components/ui/PaperCard";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { useRouter } from "@/i18n/navigation";
import { getValidSession, handleInvalidSession } from "@/services/auth";
import { getLocalizedApiError } from "@/services/localized-error";
import { createRecipe } from "@/services/recipes";
import type { RecipeRequest } from "@/types/api";
import { useTranslations } from "next-intl";
import { useState } from "react";

export default function NewRecipePage() {
  const router = useRouter();
  const t = useTranslations("Recipes");
  const errors = useTranslations("CommonErrors");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(request: RecipeRequest) {
    setLoading(true);
    setError("");
    const session = await getValidSession();
    if (!session) {
      setLoading(false);
      return;
    }

    try {
      const recipe = await createRecipe(session.accessToken, request);
      router.push(`/receitas/${recipe.id}`);
    } catch (requestError) {
      if (handleInvalidSession(requestError, () => router.replace("/login"))) {
        return;
      }
      setError(getLocalizedApiError(requestError, errors, t("saveError")));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <main className="mx-auto max-w-5xl px-5 py-8">
        <PaperCard tape="orange">
          <p className="text-sm font-bold uppercase tracking-wide text-secondary">
            {t("form.eyebrow")}
          </p>
          <h1 className="mt-2 font-display text-5xl font-extrabold text-primary">
            {t("form.newTitle")}
          </h1>
          <p className="mt-3 text-sm leading-6 text-on-surface-variant">{t("media.saveFirst")}</p>
          {error ? (
            <StatusMessage className="mt-5" variant="error">
              {error}
            </StatusMessage>
          ) : null}
          <div className="mt-7">
            <RecipeForm loading={loading} onSubmit={handleSubmit} />
          </div>
        </PaperCard>
      </main>
    </AppShell>
  );
}
