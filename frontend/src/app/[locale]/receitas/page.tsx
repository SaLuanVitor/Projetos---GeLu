"use client";

import { AppShell } from "@/components/layout/AppShell";
import { ActionButton, ActionLink } from "@/components/ui/ActionButton";
import { SelectField, TextInput } from "@/components/ui/FormField";
import { NotebookPageHeader, RecipePhotoPlaceholder } from "@/components/ui/Notebook";
import { PaperCard } from "@/components/ui/PaperCard";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { Link, useRouter } from "@/i18n/navigation";
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
  const [viewMode, setViewMode] = useState<"CARDS" | "LIST">("CARDS");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("gelu-recipes-view-mode");
      if (saved === "LIST" || saved === "CARDS") {
        setViewMode(saved);
      }
    }
  }, []);

  const handleViewModeChange = (mode: "CARDS" | "LIST") => {
    setViewMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("gelu-recipes-view-mode", mode);
    }
  };
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

        <section className="scribble-border paper-grid-block dark:bg-[#201b17] dark:border-stone-700/80 mt-8 p-5 rounded-2xl">
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

        {/* Barra de Contagem e Alternância de Visualização (Fichas x Listagem) */}
        {!loading && recipes.length > 0 && (
          <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b-2 border-stone-200/70 dark:border-stone-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="font-display text-base sm:text-lg font-bold text-on-surface">
                {recipes.length} {recipes.length === 1 ? "receita encontrada" : "receitas encontradas"}
              </span>
              {Object.values(filters).some(Boolean) && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                  Filtrado
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 rounded-xl border border-stone-200/90 dark:border-stone-700 bg-white/90 dark:bg-stone-900/90 p-1 shrink-0 self-end sm:self-auto shadow-2xs">
              <button
                type="button"
                onClick={() => handleViewModeChange("CARDS")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "CARDS"
                    ? "bg-primary text-white shadow-xs"
                    : "text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800"
                }`}
                title="Visualização em Fichas com fotos grandes"
              >
                <span>🗂️</span>
                <span>Fichas (Cards)</span>
              </button>
              <button
                type="button"
                onClick={() => handleViewModeChange("LIST")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "LIST"
                    ? "bg-primary text-white shadow-xs"
                    : "text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800"
                }`}
                title="Visualização em Listagem com mais informações e fotos menores"
              >
                <span>📋</span>
                <span>Listagem Detalhada</span>
              </button>
            </div>
          </div>
        )}

        {/* Visualização em Cards (Fichas Grandes) */}
        {viewMode === "CARDS" ? (
          <section className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {recipes.map((recipe, index) => {
              const tapes = ["washi-green", "washi-orange", "washi-brown"];
              const washiTape = tapes[index % tapes.length];

              return (
                <article
                  className="group relative bg-white dark:bg-[#25201c] border-2 border-stone-200/90 dark:border-stone-700/80 p-5 shadow-paper transition-all duration-300 hover:-translate-y-2 hover:shadow-card-hover md:rotate-[-0.8deg] hover:rotate-0 rounded-2xl animate-in fade-in"
                  key={recipe.id}
                >
                  <span aria-hidden="true" className={`washi-tape ${washiTape}`} />
                  <div className="aspect-square overflow-hidden bg-surface-container-low dark:bg-stone-800 rounded-xl shadow-inner group-hover:scale-[1.01] transition-transform">
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
                    <h2 className="font-hand text-3xl sm:text-4xl leading-tight text-tertiary dark:text-amber-200 group-hover:text-primary transition-colors">
                      <Link href={`/receitas/${recipe.slug || recipe.id}`} className="hover:underline">
                        {recipe.name}
                      </Link>
                    </h2>
                    <button
                      aria-label={recipe.favorite ? t("removeFavorite") : t("addFavorite")}
                      className="text-3xl leading-none text-primary transition-transform hover:scale-125 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60 cursor-pointer p-1"
                      disabled={favoriteBusy[recipe.id]}
                      onClick={() => void handleFavoriteToggle(recipe)}
                      type="button"
                    >
                      {recipe.favorite ? "♥" : "♡"}
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-secondary-fixed dark:bg-emerald-950/60 px-3 py-1 text-xs font-bold text-secondary dark:text-emerald-300 border border-transparent dark:border-emerald-800">
                      🏷️ {recipe.category ?? t("noCategory")}
                    </span>
                    <span className="rounded-full bg-primary-fixed dark:bg-amber-950/60 px-3 py-1 text-xs font-bold text-primary dark:text-amber-300 border border-transparent dark:border-amber-800">
                      👥 {recipe.servings ? t("servings", { count: recipe.servings }) : t("noServings")}
                    </span>
                  </div>
                  <p className="mt-4 line-clamp-2 text-xs sm:text-sm leading-relaxed text-on-surface-variant">
                    {recipe.description ?? t("noDescription")}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-bold text-on-surface">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-stone-100 dark:bg-stone-800 px-2.5 py-1 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                      ⏱️ {recipe.prepTimeMinutes ? t("minutes", { count: recipe.prepTimeMinutes }) : t("noTime")}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      🔥 {recipe.caloriesPerServing ? `${recipe.caloriesPerServing} kcal/porção` : (recipe.estimatedCalories ? `${recipe.estimatedCalories} kcal` : t("noCalories"))}
                    </span>
                    {(recipe.proteins != null || recipe.carbohydrates != null || recipe.fats != null) && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 text-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        🥩 {recipe.proteinPerServing ?? recipe.proteins ?? 0}g P · 🍞 {recipe.carbsPerServing ?? recipe.carbohydrates ?? 0}g C · 🥑 {recipe.fatPerServing ?? recipe.fats ?? 0}g G
                      </span>
                    )}
                  </div>
                  <div className="mt-6 flex gap-3">
                    <ActionLink className="flex-1" href={`/receitas/${recipe.slug || recipe.id}`}>
                      {t("viewRecipe")}
                    </ActionLink>
                    <ActionLink
                      aria-label={t("editRecipe")}
                      className="h-11 w-11 px-0 text-xl font-bold"
                      href={`/receitas/${recipe.slug || recipe.id}/editar`}
                      variant="outline"
                    >
                      ✏️
                    </ActionLink>
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          /* Visualização em Listagem Detalhada (Fotos Menores e Mais Informações) */
          <section className="mt-8 space-y-4">
            {recipes.map((recipe) => (
              <article
                key={recipe.id}
                className="group relative flex flex-col md:flex-row gap-5 bg-white dark:bg-[#25201c] border-2 border-stone-200/90 dark:border-stone-700/80 p-4 sm:p-5 shadow-paper transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover rounded-2xl animate-in fade-in"
              >
                {/* Thumbnail Menor */}
                <div className="relative w-full md:w-44 md:h-44 h-48 shrink-0 overflow-hidden rounded-xl bg-surface-container-low dark:bg-stone-800 shadow-inner border border-stone-200/60 dark:border-stone-700">
                  {imageUrls[recipe.id] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt={recipe.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      src={imageUrls[recipe.id]}
                    />
                  ) : (
                    <RecipePhotoPlaceholder label={recipe.category ?? t("noCategory")} />
                  )}
                  {/* Botão de Favorito no Mobile sobreposto na foto */}
                  <button
                    aria-label={recipe.favorite ? t("removeFavorite") : t("addFavorite")}
                    className="md:hidden absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 dark:bg-stone-900/90 text-primary shadow-xs"
                    disabled={favoriteBusy[recipe.id]}
                    onClick={() => void handleFavoriteToggle(recipe)}
                    type="button"
                  >
                    {recipe.favorite ? "♥" : "♡"}
                  </button>
                </div>

                {/* Conteúdo Central e Detalhes */}
                <div className="flex-1 min-w-0 flex flex-col justify-between gap-3">
                  <div>
                    {/* Cabeçalho da Linha: Badges + Favorito no Desktop */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full bg-secondary-fixed dark:bg-emerald-950/60 px-2.5 py-0.5 text-xs font-bold text-secondary dark:text-emerald-300 border border-transparent dark:border-emerald-800">
                          🏷️ {recipe.category ?? t("noCategory")}
                        </span>
                        <span className="rounded-full bg-stone-100 dark:bg-stone-800 px-2.5 py-0.5 text-xs font-semibold text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                          ⏱️ {recipe.prepTimeMinutes ? t("minutes", { count: recipe.prepTimeMinutes }) : t("noTime")}
                        </span>
                        <span className="rounded-full bg-stone-100 dark:bg-stone-800 px-2.5 py-0.5 text-xs font-semibold text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                          👥 {recipe.servings ? t("servings", { count: recipe.servings }) : t("noServings")}
                        </span>
                        {recipe.steps && recipe.steps.length > 0 && (
                          <span className="rounded-full bg-stone-100 dark:bg-stone-800 px-2.5 py-0.5 text-xs font-semibold text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hidden sm:inline-flex">
                            📝 {recipe.steps.length} {recipe.steps.length === 1 ? "passo" : "passos"}
                          </span>
                        )}
                      </div>

                      <button
                        aria-label={recipe.favorite ? t("removeFavorite") : t("addFavorite")}
                        className="hidden md:block text-2xl leading-none text-primary transition-transform hover:scale-125 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60 cursor-pointer p-0.5 shrink-0"
                        disabled={favoriteBusy[recipe.id]}
                        onClick={() => void handleFavoriteToggle(recipe)}
                        type="button"
                      >
                        {recipe.favorite ? "♥" : "♡"}
                      </button>
                    </div>

                    {/* Título com Link */}
                    <h2 className="mt-1.5 font-display text-xl sm:text-2xl font-bold leading-tight text-tertiary dark:text-amber-200 group-hover:text-primary transition-colors">
                      <Link href={`/receitas/${recipe.slug || recipe.id}`} className="hover:underline">
                        {recipe.name}
                      </Link>
                    </h2>

                    {/* Descrição */}
                    {recipe.description && (
                      <p className="mt-1 line-clamp-2 text-xs sm:text-sm leading-relaxed text-on-surface-variant font-serif">
                        {recipe.description}
                      </p>
                    )}

                    {/* Ingredientes em destaque */}
                    {recipe.ingredients && recipe.ingredients.length > 0 && (
                      <div className="mt-2.5 flex items-center gap-1.5 flex-wrap text-xs text-stone-600 dark:text-stone-300">
                        <span className="font-bold text-stone-700 dark:text-stone-200 shrink-0">
                          🥕 {recipe.ingredients.length} {recipe.ingredients.length === 1 ? "ingrediente" : "ingredientes"}:
                        </span>
                        {recipe.ingredients.slice(0, 5).map((ing, idx) => (
                          <span
                            key={idx}
                            className="bg-stone-100 dark:bg-stone-800/80 px-2 py-0.5 rounded-md text-[11px] font-medium border border-stone-200/60 dark:border-stone-700/60"
                          >
                            {ing.name}
                          </span>
                        ))}
                        {recipe.ingredients.length > 5 && (
                          <span className="text-[11px] text-stone-400 font-semibold">
                            +{recipe.ingredients.length - 5} outros
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Rodapé da Linha: Valores Nutricionais + Ações */}
                  <div className="pt-2 border-t border-stone-200/60 dark:border-stone-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Nutrição */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        🔥 {recipe.caloriesPerServing ? `${recipe.caloriesPerServing} kcal/porção` : (recipe.estimatedCalories ? `${recipe.estimatedCalories} kcal` : t("noCalories"))}
                      </span>
                      {(recipe.proteinPerServing != null || recipe.proteins != null) && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 text-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          🥩 {recipe.proteinPerServing ?? recipe.proteins}g P
                        </span>
                      )}
                      {(recipe.carbsPerServing != null || recipe.carbohydrates != null) && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-amber-100/60 dark:bg-amber-900/30 px-2.5 py-1 text-amber-800 dark:text-amber-200 border border-amber-200/60 dark:border-amber-800">
                          🍞 {recipe.carbsPerServing ?? recipe.carbohydrates}g C
                        </span>
                      )}
                      {(recipe.fatPerServing != null || recipe.fats != null) && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-yellow-50 dark:bg-yellow-950/40 px-2.5 py-1 text-yellow-900 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800">
                          🥑 {recipe.fatPerServing ?? recipe.fats}g G
                        </span>
                      )}
                      {(recipe.fiberPerServing != null || recipe.fibers != null) && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-teal-50 dark:bg-teal-950/40 px-2.5 py-1 text-teal-900 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hidden md:inline-flex">
                          🥗 {recipe.fiberPerServing ?? recipe.fibers}g Fibras
                        </span>
                      )}
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <ActionLink href={`/receitas/${recipe.slug || recipe.id}`} className="py-1.5 px-3.5 text-xs">
                        {t("viewRecipe")}
                      </ActionLink>
                      <ActionLink
                        aria-label={t("editRecipe")}
                        className="h-8 w-8 px-0 text-sm font-bold flex items-center justify-center"
                        href={`/receitas/${recipe.slug || recipe.id}/editar`}
                        variant="outline"
                      >
                        ✏️
                      </ActionLink>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
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
