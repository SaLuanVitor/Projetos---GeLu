"use client";

import { ActionButton, ActionLink } from "@/components/ui/ActionButton";
import { TextAreaField, TextInput } from "@/components/ui/FormField";
import type { RecipeRequest, RecipeResponse } from "@/types/api";
import { useTranslations } from "next-intl";
import { FormEvent, useMemo, useState } from "react";

type IngredientForm = {
  name: string;
  quantity: string;
  unit: string;
};

type StepForm = {
  instruction: string;
};

type RecipeFormProps = {
  initialRecipe?: RecipeResponse | null;
  loading?: boolean;
  onSubmit: (request: RecipeRequest) => Promise<void>;
};

export function RecipeForm({ initialRecipe, loading = false, onSubmit }: RecipeFormProps) {
  const t = useTranslations("Recipes");
  const initialIngredients = useMemo(
    () =>
      initialRecipe?.ingredients.map((ingredient) => ({
        name: ingredient.name,
        quantity: ingredient.quantity ?? "",
        unit: ingredient.unit ?? ""
      })) ?? [{ name: "", quantity: "", unit: "" }],
    [initialRecipe]
  );
  const initialSteps = useMemo(
    () =>
      initialRecipe?.steps.map((step) => ({
        instruction: step.instruction
      })) ?? [{ instruction: "" }],
    [initialRecipe]
  );

  const [name, setName] = useState(initialRecipe?.name ?? "");
  const [description, setDescription] = useState(initialRecipe?.description ?? "");
  const [category, setCategory] = useState(initialRecipe?.category ?? "");
  const [prepTimeMinutes, setPrepTimeMinutes] = useState(
    toStringValue(initialRecipe?.prepTimeMinutes)
  );
  const [estimatedCalories, setEstimatedCalories] = useState(
    toStringValue(initialRecipe?.estimatedCalories)
  );
  const [servings, setServings] = useState(toStringValue(initialRecipe?.servings));
  const [videoUrl, setVideoUrl] = useState(initialRecipe?.videoUrl ?? "");
  const [ingredients, setIngredients] = useState<IngredientForm[]>(initialIngredients);
  const [steps, setSteps] = useState<StepForm[]>(initialSteps);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit({
      name,
      description: emptyToNull(description),
      category: emptyToNull(category),
      prepTimeMinutes: toNumberOrNull(prepTimeMinutes),
      estimatedCalories: toNumberOrNull(estimatedCalories),
      servings: toNumberOrNull(servings),
      videoUrl: emptyToNull(videoUrl),
      ingredients: ingredients
        .filter((ingredient) => ingredient.name.trim())
        .map((ingredient) => ({
          name: ingredient.name,
          quantity: emptyToNull(ingredient.quantity),
          unit: emptyToNull(ingredient.unit)
        })),
      steps: steps
        .filter((step) => step.instruction.trim())
        .map((step) => ({ instruction: step.instruction }))
    });
  }

  function updateIngredient(index: number, patch: Partial<IngredientForm>) {
    setIngredients((current) =>
      current.map((ingredient, itemIndex) =>
        itemIndex === index ? { ...ingredient, ...patch } : ingredient
      )
    );
  }

  function updateStep(index: number, patch: Partial<StepForm>) {
    setSteps((current) =>
      current.map((step, itemIndex) => (itemIndex === index ? { ...step, ...patch } : step))
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextInput
          label={t("form.name")}
          maxLength={150}
          required
          value={name}
          onValueChange={setName}
        />
        <TextInput
          label={t("form.category")}
          maxLength={80}
          value={category}
          onValueChange={setCategory}
        />
        <TextInput
          label={t("form.prepTime")}
          min="1"
          type="number"
          value={prepTimeMinutes}
          onValueChange={setPrepTimeMinutes}
        />
        <TextInput
          label={t("form.calories")}
          min="1"
          step="0.01"
          type="number"
          value={estimatedCalories}
          onValueChange={setEstimatedCalories}
        />
        <TextInput
          label={t("form.servings")}
          min="1"
          type="number"
          value={servings}
          onValueChange={setServings}
        />
        <TextInput
          label={t("form.videoUrl")}
          maxLength={500}
          type="url"
          value={videoUrl}
          onValueChange={setVideoUrl}
        />
      </div>

      <div className="mt-5">
        <TextAreaField
          label={t("form.description")}
          maxLength={2000}
          value={description}
          onValueChange={setDescription}
        />
      </div>

      <section className="mt-7">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-3xl font-bold text-tertiary">{t("form.ingredients")}</h2>
          <ActionButton
            onClick={() =>
              setIngredients((current) => [...current, { name: "", quantity: "", unit: "" }])
            }
            type="button"
            variant="outline"
          >
            {t("form.addIngredient")}
          </ActionButton>
        </div>
        <div className="mt-4 space-y-4">
          {ingredients.map((ingredient, index) => (
            <div className="grid gap-3 sm:grid-cols-[1fr_120px_120px_auto]" key={index}>
              <TextInput
                label={t("form.ingredientName")}
                maxLength={150}
                required={index === 0}
                value={ingredient.name}
                onValueChange={(value) => updateIngredient(index, { name: value })}
              />
              <TextInput
                label={t("form.quantity")}
                maxLength={80}
                value={ingredient.quantity}
                onValueChange={(value) => updateIngredient(index, { quantity: value })}
              />
              <TextInput
                label={t("form.unit")}
                maxLength={40}
                value={ingredient.unit}
                onValueChange={(value) => updateIngredient(index, { unit: value })}
              />
              <ActionButton
                className="self-end"
                disabled={ingredients.length === 1}
                onClick={() =>
                  setIngredients((current) => current.filter((_, itemIndex) => itemIndex !== index))
                }
                type="button"
                variant="outline"
              >
                {t("form.remove")}
              </ActionButton>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-7">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-3xl font-bold text-tertiary">{t("form.steps")}</h2>
          <ActionButton
            onClick={() => setSteps((current) => [...current, { instruction: "" }])}
            type="button"
            variant="outline"
          >
            {t("form.addStep")}
          </ActionButton>
        </div>
        <div className="mt-4 space-y-4">
          {steps.map((step, index) => (
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]" key={index}>
              <TextAreaField
                label={t("form.step", { number: index + 1 })}
                maxLength={1200}
                required={index === 0}
                value={step.instruction}
                onValueChange={(value) => updateStep(index, { instruction: value })}
              />
              <ActionButton
                className="self-end"
                disabled={steps.length === 1}
                onClick={() =>
                  setSteps((current) => current.filter((_, itemIndex) => itemIndex !== index))
                }
                type="button"
                variant="outline"
              >
                {t("form.remove")}
              </ActionButton>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <ActionButton disabled={loading} type="submit">
          {loading ? t("form.saving") : t("form.save")}
        </ActionButton>
        <ActionLink href="/receitas" variant="outline">
          {t("form.cancel")}
        </ActionLink>
      </div>
    </form>
  );
}

function emptyToNull(value: string) {
  return value.trim() ? value.trim() : null;
}

function toNumberOrNull(value: string) {
  return value ? Number(value) : null;
}

function toStringValue(value: number | null | undefined) {
  return value == null ? "" : String(value);
}
