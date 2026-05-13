"use client";

import { AppShell } from "@/components/layout/AppShell";
import { MediaUploader } from "@/components/recipes/MediaUploader";
import { ActionButton, ActionLink } from "@/components/ui/ActionButton";
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
    setRecipe((current) =>
      current
        ? {
            ...current,
            media,
            mainImageUrl: media.find((item) => item.main)?.url ?? null
          }
        : current
    );
  }

  return (
    <AppShell>
      <main className="mx-auto max-w-6xl px-5 py-8">
        {loading ? <StatusMessage>{t("loading")}</StatusMessage> : null}
        {error ? <StatusMessage variant="error">{error}</StatusMessage> : null}
        {recipe ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            <PaperCard tape="orange">
              <p className="text-sm font-bold uppercase tracking-wide text-secondary">
                {recipe.category ?? t("noCategory")}
              </p>
              <h1 className="mt-2 font-display text-5xl font-extrabold text-primary">
                {recipe.name}
              </h1>
              <p className="mt-4 text-sm leading-6 text-on-surface-variant">
                {recipe.description ?? t("noDescription")}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
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
            </PaperCard>

            <PaperCard tape="green">
              <h2 className="font-display text-3xl font-bold text-tertiary">{t("details")}</h2>
              <dl className="mt-4 space-y-3 text-sm text-on-surface-variant">
                <div>
                  <dt className="font-bold text-tertiary">{t("form.prepTime")}</dt>
                  <dd>
                    {recipe.prepTimeMinutes
                      ? t("minutes", { count: recipe.prepTimeMinutes })
                      : t("noTime")}
                  </dd>
                </div>
                <div>
                  <dt className="font-bold text-tertiary">{t("form.calories")}</dt>
                  <dd>
                    {recipe.estimatedCalories
                      ? t("kcal", { count: recipe.estimatedCalories })
                      : t("noCalories")}
                  </dd>
                </div>
                <div>
                  <dt className="font-bold text-tertiary">{t("form.servings")}</dt>
                  <dd>
                    {recipe.servings ? t("servings", { count: recipe.servings }) : t("noServings")}
                  </dd>
                </div>
                {recipe.videoUrl ? (
                  <div>
                    <dt className="font-bold text-tertiary">{t("form.videoUrl")}</dt>
                    <dd>
                      <a className="text-primary underline" href={recipe.videoUrl}>
                        {recipe.videoUrl}
                      </a>
                    </dd>
                  </div>
                ) : null}
              </dl>
            </PaperCard>

            <PaperCard className="lg:col-span-2" tape="green">
              <MediaUploader
                initialMedia={recipe.media}
                onMediaChange={handleMediaChange}
                recipeId={recipe.id}
              />
            </PaperCard>

            <PaperCard className="lg:col-span-1" tape="brown">
              <h2 className="font-display text-3xl font-bold text-tertiary">{t("ingredients")}</h2>
              <ul className="mt-4 space-y-2">
                {recipe.ingredients.map((ingredient) => (
                  <li
                    className="rounded-lg border-2 border-outline-variant bg-surface-container-lowest p-3 text-sm"
                    key={ingredient.id}
                  >
                    <span className="font-bold text-primary">{ingredient.name}</span>
                    {ingredient.quantity || ingredient.unit ? (
                      <span className="text-on-surface-variant">
                        {" "}
                        {ingredient.quantity} {ingredient.unit}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </PaperCard>

            <PaperCard tape="orange">
              <h2 className="font-display text-3xl font-bold text-tertiary">{t("steps")}</h2>
              <ol className="mt-4 space-y-3">
                {recipe.steps.map((step) => (
                  <li
                    className="rounded-lg border-2 border-outline-variant bg-surface-container-lowest p-3 text-sm leading-6"
                    key={step.id}
                  >
                    <span className="font-bold text-primary">{step.position}. </span>
                    {step.instruction}
                  </li>
                ))}
              </ol>
            </PaperCard>
          </div>
        ) : null}
      </main>
    </AppShell>
  );
}
