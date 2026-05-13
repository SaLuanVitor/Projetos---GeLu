"use client";

import { AppShell } from "@/components/layout/AppShell";
import { FeaturedMediaPreview } from "@/components/recipes/FeaturedMediaPreview";
import { MainMediaSelector } from "@/components/recipes/MainMediaSelector";
import { MediaUploader } from "@/components/recipes/MediaUploader";
import { RecipeVideoModal } from "@/components/recipes/RecipeVideoModal";
import { ActionButton, ActionLink } from "@/components/ui/ActionButton";
import { NotebookPageHeader } from "@/components/ui/Notebook";
import { PaperCard } from "@/components/ui/PaperCard";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { useRouter } from "@/i18n/navigation";
import { getValidSession, handleInvalidSession } from "@/services/auth";
import { getLocalizedApiError } from "@/services/localized-error";
import { deleteRecipe, getRecipe } from "@/services/recipes";
import type { RecipeMedia, RecipeResponse } from "@/types/api";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export default function RecipeDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const t = useTranslations("Recipes");
  const errors = useTranslations("CommonErrors");
  const [recipe, setRecipe] = useState<RecipeResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);

  useEffect(() => {
    let active = true;

    getValidSession().then((session) => {
      if (!active) {
        return;
      }
      if (!session) {
        setLoading(false);
        return;
      }
      getRecipe(session.accessToken, params.id)
        .then((loadedRecipe) => {
          if (active) {
            setRecipe(loadedRecipe);
          }
        })
        .catch((requestError) => {
          if (handleInvalidSession(requestError, () => router.replace("/login"))) {
            return;
          }
          setError(getLocalizedApiError(requestError, errors, t("loadError")));
        })
        .finally(() => setLoading(false));
    });

    return () => {
      active = false;
    };
  }, [errors, params.id, router, t]);

  async function handleDelete() {
    const session = await getValidSession();
    if (!session) {
      return;
    }
    setDeleting(true);
    setError("");
    try {
      await deleteRecipe(session.accessToken, params.id);
      router.push("/receitas");
    } catch (requestError) {
      if (handleInvalidSession(requestError, () => router.replace("/login"))) {
        return;
      }
      setError(getLocalizedApiError(requestError, errors, t("deleteError")));
    } finally {
      setDeleting(false);
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
        {loading ? <StatusMessage>{t("loading")}</StatusMessage> : null}
        {error ? <StatusMessage variant="error">{error}</StatusMessage> : null}
        {recipe ? (
          <>
            <NotebookPageHeader
              action={
                <div className="flex flex-wrap gap-3">
                  <ActionLink href={`/receitas/${recipe.id}/editar`} variant="secondary">
                    {t("editRecipe")}
                  </ActionLink>
                  <ActionButton
                    disabled={deleting}
                    onClick={handleDelete}
                    type="button"
                    variant="outline"
                  >
                    {deleting ? t("deleting") : t("deleteRecipe")}
                  </ActionButton>
                </div>
              }
              eyebrow={recipe.category ?? t("noCategory")}
              title={recipe.name}
            />

            <div className="mt-10 grid gap-6 lg:grid-cols-[0.8fr_1fr]">
              <PaperCard className="rotate-[-1deg] p-4" ink tape="green">
                <div className="aspect-[4/3]">
                  <FeaturedMediaPreview
                    interactive={recipe.mainMediaType === "VIDEO"}
                    onPlay={() => setShowVideoModal(true)}
                    recipe={recipe}
                  />
                </div>
              </PaperCard>

              <PaperCard className="self-start" tape="orange">
                <p className="text-base leading-7 text-on-surface-variant">
                  {recipe.description ?? t("noDescription")}
                </p>
                <dl className="mt-6 grid gap-3 text-sm text-on-surface-variant sm:grid-cols-3">
                  <div className="rounded-lg bg-surface-container p-3">
                    <dt className="font-bold text-tertiary">{t("form.prepTime")}</dt>
                    <dd>
                      {recipe.prepTimeMinutes
                        ? t("minutes", { count: recipe.prepTimeMinutes })
                        : t("noTime")}
                    </dd>
                  </div>
                  <div className="rounded-lg bg-surface-container p-3">
                    <dt className="font-bold text-tertiary">{t("form.calories")}</dt>
                    <dd>
                      {recipe.estimatedCalories
                        ? t("kcal", { count: recipe.estimatedCalories })
                        : t("noCalories")}
                    </dd>
                  </div>
                  <div className="rounded-lg bg-surface-container p-3">
                    <dt className="font-bold text-tertiary">{t("form.servings")}</dt>
                    <dd>
                      {recipe.servings
                        ? t("servings", { count: recipe.servings })
                        : t("noServings")}
                    </dd>
                  </div>
                </dl>
                <div className="mt-6">
                  <MainMediaSelector
                    hasVideo={Boolean(recipe.videoUrl)}
                    onChange={setRecipe}
                    recipeId={recipe.id}
                    value={recipe.mainMediaType}
                  />
                </div>
              </PaperCard>

              <PaperCard className="lg:col-span-2" ink tape="green">
                <MediaUploader
                  initialMedia={recipe.media}
                  onMediaChange={handleMediaChange}
                  recipeId={recipe.id}
                />
              </PaperCard>

              <PaperCard className="lg:col-span-1" ink tape="none">
                <h2 className="font-display text-3xl font-bold text-tertiary">
                  {t("ingredients")}
                </h2>
                <ul className="mt-4 space-y-2">
                  {recipe.ingredients.map((ingredient) => (
                    <li
                      className="flex gap-3 border-b border-outline-variant py-2"
                      key={ingredient.id}
                    >
                      <span className="mt-1 h-4 w-4 rounded-full border-2 border-outline" />
                      <span>
                        <span className="font-bold text-primary">{ingredient.name}</span>
                        {ingredient.quantity || ingredient.unit ? (
                          <span className="text-on-surface-variant">
                            {" "}
                            {ingredient.quantity} {ingredient.unit}
                          </span>
                        ) : null}
                      </span>
                    </li>
                  ))}
                </ul>
              </PaperCard>

              <PaperCard className="paper-lines-block" ink tape="orange">
                <h2 className="font-display text-3xl font-bold text-tertiary">{t("steps")}</h2>
                <ol className="mt-4 space-y-4">
                  {recipe.steps.map((step) => (
                    <li className="text-sm leading-7" key={step.id}>
                      <span className="font-bold text-primary">{step.position}. </span>
                      {step.instruction}
                    </li>
                  ))}
                </ol>
              </PaperCard>
            </div>
            {showVideoModal && recipe.videoUrl ? (
              <RecipeVideoModal
                onClose={() => setShowVideoModal(false)}
                title={recipe.name}
                videoUrl={recipe.videoUrl}
              />
            ) : null}
          </>
        ) : null}
      </main>
    </AppShell>
  );
}
