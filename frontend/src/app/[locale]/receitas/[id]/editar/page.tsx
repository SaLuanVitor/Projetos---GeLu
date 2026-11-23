"use client";

import { RecipeForm } from "@/components/recipes/RecipeForm";
import { AppShell } from "@/components/layout/AppShell";
import { FeaturedMediaPreview } from "@/components/recipes/FeaturedMediaPreview";
import { MainMediaSelector } from "@/components/recipes/MainMediaSelector";
import { MediaUploader } from "@/components/recipes/MediaUploader";
import { NotebookPageHeader } from "@/components/ui/Notebook";
import { PaperCard } from "@/components/ui/PaperCard";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { useRouter } from "@/i18n/navigation";
import { getValidSession, handleInvalidSession } from "@/services/auth";
import { getLocalizedApiError } from "@/services/localized-error";
import { getRecipe, updateRecipe } from "@/services/recipes";
import type { RecipeMedia, RecipeRequest, RecipeResponse } from "@/types/api";
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
      router.push(`/receitas/${updatedRecipe.slug || updatedRecipe.id}`);
    } catch (requestError) {
      if (handleInvalidSession(requestError, () => router.replace("/login"))) {
        return;
      }
      setError(getLocalizedApiError(requestError, errors, t("saveError")));
    } finally {
      setSaving(false);
    }
  }

  function handleMediaChange(media: RecipeMedia[]) {
    const mainImageUrl = media.find((item) => item.main)?.url ?? null;
    setRecipe((current) =>
      current
        ? {
            ...current,
            media,
            mainImageUrl,
            mainMediaType: mainImageUrl ? "IMAGE" : current.mainMediaType
          }
        : current
    );
  }

  return (
    <AppShell>
      <main className="mx-auto max-w-7xl px-5 py-10">
        <NotebookPageHeader eyebrow={t("form.eyebrow")} title={t("form.editTitle")} />
        {loading ? <StatusMessage className="mt-5">{t("loading")}</StatusMessage> : null}
        {error ? (
          <StatusMessage className="mt-5" variant="error">
            {error}
          </StatusMessage>
        ) : null}
        {recipe ? (
          <div className="mt-10 space-y-8">
            <RecipeForm initialRecipe={recipe} loading={saving} onSubmit={handleSubmit} />
            <PaperCard ink tape="green">
              <div className="mb-6 grid gap-5 lg:grid-cols-[0.9fr_1fr]">
                <div>
                  <h2 className="font-display text-3xl font-bold text-tertiary">
                    {t("mainMedia.previewTitle")}
                  </h2>
                  <div className="mt-3 aspect-[4/3] overflow-hidden">
                    <FeaturedMediaPreview recipe={recipe} />
                  </div>
                </div>
                <div className="self-center">
                  <MainMediaSelector
                    hasVideo={Boolean(recipe.videoUrl)}
                    onChange={setRecipe}
                    recipeId={recipe.id}
                    value={recipe.mainMediaType}
                  />
                </div>
              </div>
              <MediaUploader
                initialMedia={recipe.media}
                onMediaChange={handleMediaChange}
                recipeId={recipe.id}
              />
            </PaperCard>
          </div>
        ) : null}
      </main>
    </AppShell>
  );
}
