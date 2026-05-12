"use client";

import { AppShell } from "@/components/layout/AppShell";
import { ActionButton, ActionLink } from "@/components/ui/ActionButton";
import { TextInput } from "@/components/ui/FormField";
import { PaperCard } from "@/components/ui/PaperCard";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { useRouter } from "@/i18n/navigation";
import { getValidSession, handleInvalidSession } from "@/services/auth";
import { getLocalizedApiError } from "@/services/localized-error";
import { listRecipes } from "@/services/recipes";
import type { RecipeResponse, RecipeSearchFilters } from "@/types/api";
import { useTranslations } from "next-intl";
import { FormEvent, useCallback, useEffect, useState } from "react";

export default function RecipesPage() {
  const router = useRouter();
  const t = useTranslations("Recipes");
  const errors = useTranslations("CommonErrors");
  const [recipes, setRecipes] = useState<RecipeResponse[]>([]);
  const [filters, setFilters] = useState<RecipeSearchFilters>({});
  const [query, setQuery] = useState("");
  const [ingredient, setIngredient] = useState("");
  const [category, setCategory] = useState("");
  const [maxPrepTimeMinutes, setMaxPrepTimeMinutes] = useState("");
  const [maxCalories, setMaxCalories] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRecipes = useCallback(
    async (nextFilters: RecipeSearchFilters = filters) => {
      setLoading(true);
      setError("");
      const session = await getValidSession();
      if (!session) {
        setLoading(false);
        return;
      }

      try {
        setRecipes(await listRecipes(session.accessToken, nextFilters));
      } catch (requestError) {
        if (handleInvalidSession(requestError, () => router.replace("/login"))) {
          return;
        }

        setError(getLocalizedApiError(requestError, errors, t("loadError")));
      } finally {
        setLoading(false);
      }
    },
    [errors, filters, router, t]
  );

  useEffect(() => {
    void loadRecipes();
  }, [loadRecipes]);

  function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextFilters = {
      query,
      ingredient,
      category,
      maxPrepTimeMinutes,
      maxCalories
    };
    setFilters(nextFilters);
    void loadRecipes(nextFilters);
  }

  return (
    <AppShell>
      <main className="mx-auto max-w-6xl px-5 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-secondary">
              {t("eyebrow")}
            </p>
            <h1 className="mt-2 font-display text-5xl font-extrabold text-primary">{t("title")}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-on-surface-variant">
              {t("description")}
            </p>
          </div>
          <ActionLink href="/receitas/nova">{t("newRecipe")}</ActionLink>
        </div>

        <PaperCard className="mt-6" tape="green">
          <form className="grid gap-4 md:grid-cols-5" onSubmit={handleFilterSubmit}>
            <TextInput label={t("filters.query")} value={query} onValueChange={setQuery} />
            <TextInput
              label={t("filters.ingredient")}
              value={ingredient}
              onValueChange={setIngredient}
            />
            <TextInput label={t("filters.category")} value={category} onValueChange={setCategory} />
            <TextInput
              label={t("filters.maxTime")}
              min="1"
              type="number"
              value={maxPrepTimeMinutes}
              onValueChange={setMaxPrepTimeMinutes}
            />
            <TextInput
              label={t("filters.maxCalories")}
              min="1"
              type="number"
              value={maxCalories}
              onValueChange={setMaxCalories}
            />
            <div className="md:col-span-5">
              <ActionButton type="submit" variant="secondary">
                {t("filters.apply")}
              </ActionButton>
            </div>
          </form>
        </PaperCard>

        <div className="mt-6 space-y-3">
          {loading ? <StatusMessage>{t("loading")}</StatusMessage> : null}
          {error ? <StatusMessage variant="error">{error}</StatusMessage> : null}
        </div>

        {!loading && recipes.length === 0 ? (
          <PaperCard className="mt-6" tape="orange">
            <h2 className="font-display text-3xl font-bold text-tertiary">{t("emptyTitle")}</h2>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">{t("emptyText")}</p>
            <ActionLink className="mt-5" href="/receitas/nova">
              {t("newRecipe")}
            </ActionLink>
          </PaperCard>
        ) : null}

        <section className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <PaperCard key={recipe.id} tape="brown">
              <p className="text-xs font-bold uppercase tracking-wide text-secondary">
                {recipe.category ?? t("noCategory")}
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold text-primary">{recipe.name}</h2>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-on-surface-variant">
                {recipe.description ?? t("noDescription")}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-tertiary">
                <span>
                  {recipe.prepTimeMinutes
                    ? t("minutes", { count: recipe.prepTimeMinutes })
                    : t("noTime")}
                </span>
                <span>
                  {recipe.estimatedCalories
                    ? t("kcal", { count: recipe.estimatedCalories })
                    : t("noCalories")}
                </span>
                <span>
                  {recipe.servings ? t("servings", { count: recipe.servings }) : t("noServings")}
                </span>
              </div>
              <ActionLink className="mt-5" href={`/receitas/${recipe.id}`} variant="outline">
                {t("viewRecipe")}
              </ActionLink>
            </PaperCard>
          ))}
        </section>
      </main>
    </AppShell>
  );
}
