"use client";

import { RecipeForm } from "@/components/recipes/RecipeForm";
import { AppShell } from "@/components/layout/AppShell";
import { PaperCard } from "@/components/ui/PaperCard";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { useRouter } from "@/i18n/navigation";
import { getValidSession, handleInvalidSession } from "@/services/auth";
import { getLocalizedApiError } from "@/services/localized-error";
import { getRecipe, updateRecipe } from "@/services/recipes";
import type { RecipeRequest, RecipeResponse } from "@/types/api";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export default function EditRecipePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const t = useTranslations("Recipes");
  const errors = useTranslations("CommonErrors");
  const [recipe, setRecipe] = useState<RecipeResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getValidSession().then((session) => {
      if (!session) {
        setLoading(false);
        return;
      }
      getRecipe(session.accessToken, params.id)
        .then(setRecipe)
        .catch((requestError) => {
          if (handleInvalidSession(requestError, () => router.replace("/login"))) {
            return;
          }
          setError(getLocalizedApiError(requestError, errors, t("loadError")));
        })
        .finally(() => setLoading(false));
    });
  }, [errors, params.id, router, t]);

  async function handleSubmit(request: RecipeRequest) {
    setSaving(true);
    setError("");
    const session = await getValidSession();
    if (!session) {
      setSaving(false);
      return;
    }

    try {
      const updatedRecipe = await updateRecipe(session.accessToken, params.id, request);
      router.push(`/receitas/${updatedRecipe.id}`);
    } catch (requestError) {
      if (handleInvalidSession(requestError, () => router.replace("/login"))) {
        return;
      }
      setError(getLocalizedApiError(requestError, errors, t("saveError")));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <main className="mx-auto max-w-5xl px-5 py-8">
        <PaperCard tape="green">
          <p className="text-sm font-bold uppercase tracking-wide text-secondary">
            {t("form.eyebrow")}
          </p>
          <h1 className="mt-2 font-display text-5xl font-extrabold text-primary">
            {t("form.editTitle")}
          </h1>
          {loading ? <StatusMessage className="mt-5">{t("loading")}</StatusMessage> : null}
          {error ? (
            <StatusMessage className="mt-5" variant="error">
              {error}
            </StatusMessage>
          ) : null}
          {recipe ? (
            <div className="mt-7">
              <RecipeForm initialRecipe={recipe} loading={saving} onSubmit={handleSubmit} />
            </div>
          ) : null}
        </PaperCard>
      </main>
    </AppShell>
  );
}
