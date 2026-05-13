"use client";

import { AppShell } from "@/components/layout/AppShell";
import { ActionButton, ActionLink } from "@/components/ui/ActionButton";
import { SelectField, TextInput } from "@/components/ui/FormField";
import { NotebookPageHeader, RecipePhotoPlaceholder } from "@/components/ui/Notebook";
import { PaperCard } from "@/components/ui/PaperCard";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { useRouter } from "@/i18n/navigation";
import { getValidSession, handleInvalidSession } from "@/services/auth";
import { getLocalizedApiError } from "@/services/localized-error";
import { fetchRecipeMediaObjectUrl } from "@/services/recipe-media";
import { listRecipes, setRecipeFavorite } from "@/services/recipes";
import type { RecipeResponse, RecipeSearchFilters } from "@/types/api";
import { useTranslations } from "next-intl";
import { FormEvent, useCallback, useEffect, useState } from "react";

const CATEGORY_VALUES = [
  "Cafe",
  "Almoco",
  "Jantar",
  "Lanche",
  "Sobremesa",
  "Bebidas",
  "Saudavel",
  "Familia"
];

export default function RecipesPage() {
  const router = useRouter();
  const t = useTranslations("Recipes");
  const errors = useTranslations("CommonErrors");
  const [recipes, setRecipes] = useState<RecipeResponse[]>([]);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [filters, setFilters] = useState<RecipeSearchFilters>({});
  const [query, setQuery] = useState("");
  const [ingredient, setIngredient] = useState("");
  const [category, setCategory] = useState("");
  const [maxPrepTimeMinutes, setMaxPrepTimeMinutes] = useState("");
  const [maxCalories, setMaxCalories] = useState("");
  const [loading, setLoading] = useState(true);
  const [favoriteBusy, setFavoriteBusy] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const categoryOptions = [
    { label: t("filters.allCategories"), value: "" },
    ...CATEGORY_VALUES.map((value) => ({
      label: t(`options.categories.${value}`),
      value
    }))
  ];
  const timeOptions = [
    { label: t("filters.anyTime"), value: "" },
    ...["15", "30", "45", "60"].map((value) => ({
      label: t("filters.minutesUpTo", { count: Number(value) }),
      value
    }))
  ];
  const calorieOptions = [
    { label: t("filters.noCalorieLimit"), value: "" },
    ...["250", "400", "600", "800"].map((value) => ({
      label: t("filters.kcalUpTo", { count: Number(value) }),
      value
    }))
  ];

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
        setRecipes(sortRecipes(await listRecipes(session.accessToken, nextFilters)));
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

  useEffect(() => {
    let active = true;
    const urls: string[] = [];

    getValidSession().then(async (session) => {
      if (!session) {
        return;
      }

      const nextUrls: Record<string, string> = {};
      await Promise.all(
        recipes
          .filter((recipe) => recipe.mainImageUrl)
          .map(async (recipe) => {
            try {
              const url = await fetchRecipeMediaObjectUrl(
                session.accessToken,
                recipe.mainImageUrl!
              );
              urls.push(url);
              nextUrls[recipe.id] = url;
            } catch {
              nextUrls[recipe.id] = "";
            }
          })
      );

      if (active) {
        setImageUrls(nextUrls);
      } else {
        urls.forEach(URL.revokeObjectURL);
      }
    });

    return () => {
      active = false;
      urls.forEach(URL.revokeObjectURL);
    };
  }, [recipes]);

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

  async function handleFavoriteToggle(recipe: RecipeResponse) {
    const session = await getValidSession();
    if (!session) {
      return;
    }

    setFavoriteBusy((current) => ({ ...current, [recipe.id]: true }));
    setError("");

    try {
      const updatedRecipe = await setRecipeFavorite(
        session.accessToken,
        recipe.id,
        !recipe.favorite
      );
      setRecipes((current) =>
        sortRecipes(current.map((item) => (item.id === recipe.id ? updatedRecipe : item)))
      );
    } catch (requestError) {
      if (handleInvalidSession(requestError, () => router.replace("/login"))) {
        return;
      }
      setError(getLocalizedApiError(requestError, errors, t("favoriteError")));
    } finally {
      setFavoriteBusy((current) => ({ ...current, [recipe.id]: false }));
    }
  }

  return (
    <AppShell>
      <main className="mx-auto max-w-6xl px-5 py-8">
        <NotebookPageHeader
          action={<ActionLink href="/receitas/nova">{t("newRecipe")}</ActionLink>}
          eyebrow={t("eyebrow")}
          subtitle={t("description")}
          title={t("title")}
        />

        <section className="scribble-border paper-grid-block mt-8 p-5">
          <form
            className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_150px_150px_auto]"
            onSubmit={handleFilterSubmit}
          >
            <TextInput label={t("filters.query")} value={query} onValueChange={setQuery} />
            <TextInput
              label={t("filters.ingredient")}
              value={ingredient}
              onValueChange={setIngredient}
            />
            <SelectField
              label={t("filters.category")}
              options={categoryOptions}
              value={category}
              onValueChange={setCategory}
            />
            <SelectField
              label={t("filters.maxTime")}
              options={timeOptions}
              value={maxPrepTimeMinutes}
              onValueChange={setMaxPrepTimeMinutes}
            />
            <SelectField
              label={t("filters.maxCalories")}
              options={calorieOptions}
              value={maxCalories}
              onValueChange={setMaxCalories}
            />
            <div className="self-end">
              <ActionButton className="w-full whitespace-nowrap" type="submit">
                {t("filters.apply")}
              </ActionButton>
            </div>
          </form>
        </section>

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

        <section className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <article
              className="relative bg-white p-4 shadow-paper transition-transform hover:rotate-0 md:rotate-[-1deg]"
              key={recipe.id}
            >
              <span aria-hidden="true" className="washi-tape washi-green" />
              <div className="aspect-square overflow-hidden bg-surface-container-low">
                {imageUrls[recipe.id] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt={recipe.name}
                    className="h-full w-full object-cover"
                    src={imageUrls[recipe.id]}
                  />
                ) : (
                  <RecipePhotoPlaceholder label={recipe.category ?? t("noCategory")} />
                )}
              </div>
              <div className="mt-5 flex items-start justify-between gap-3">
                <h2 className="font-hand text-4xl leading-none text-tertiary">{recipe.name}</h2>
                <button
                  aria-label={recipe.favorite ? t("removeFavorite") : t("addFavorite")}
                  className="text-3xl leading-none text-primary transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
                  disabled={favoriteBusy[recipe.id]}
                  onClick={() => void handleFavoriteToggle(recipe)}
                  type="button"
                >
                  {recipe.favorite ? "♥" : "♡"}
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-secondary-fixed px-3 py-1 text-xs font-semibold text-secondary">
                  {recipe.category ?? t("noCategory")}
                </span>
                <span className="rounded-full bg-primary-fixed px-3 py-1 text-xs font-semibold text-primary">
                  {recipe.servings ? t("servings", { count: recipe.servings }) : t("noServings")}
                </span>
              </div>
              <p className="mt-4 line-clamp-2 text-sm leading-6 text-on-surface-variant">
                {recipe.description ?? t("noDescription")}
              </p>
              <div className="mt-4 flex flex-wrap gap-5 text-base font-medium text-on-surface">
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
              </div>
              <div className="mt-7 flex gap-3">
                <ActionLink className="flex-1" href={`/receitas/${recipe.id}`}>
                  {t("viewRecipe")}
                </ActionLink>
                <ActionLink
                  aria-label={t("editRecipe")}
                  className="h-11 w-11 px-0 text-xl"
                  href={`/receitas/${recipe.id}/editar`}
                  variant="outline"
                >
                  +
                </ActionLink>
              </div>
            </article>
          ))}
        </section>
      </main>
    </AppShell>
  );
}

function sortRecipes(recipes: RecipeResponse[]): RecipeResponse[] {
  return [...recipes].sort((left, right) => {
    if (left.favorite !== right.favorite) {
      return Number(right.favorite) - Number(left.favorite);
    }
    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });
}
