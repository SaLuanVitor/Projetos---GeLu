"use client";

import { ActionButton, ActionLink } from "@/components/ui/ActionButton";
import {
  PresetNumberField,
  SelectField,
  TextAreaField,
  TextInput
} from "@/components/ui/FormField";
import { RecipePhotoPlaceholder } from "@/components/ui/Notebook";
import { PaperCard } from "@/components/ui/PaperCard";
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

const OTHER_VALUE = "__other__";
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
const UNIT_VALUES = ["un", "g", "kg", "ml", "l", "colher", "xicara", "pitada", "a gosto"];

export function RecipeForm({ initialRecipe, loading = false, onSubmit }: RecipeFormProps) {
  const t = useTranslations("Recipes");
  const initialIngredients = useMemo(
    () =>
      initialRecipe?.ingredients.map((ingredient) => ({
        name: ingredient.name,
        quantity: ingredient.quantity ?? "",
        unit: ingredient.unit ?? "un"
      })) ?? [{ name: "", quantity: "", unit: "un" }],
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
  const [category, setCategory] = useState(initialRecipe?.category ?? "Cafe");
  const [prepTimeMinutes, setPrepTimeMinutes] = useState(
    toStringValue(initialRecipe?.prepTimeMinutes, "30")
  );
  const [estimatedCalories, setEstimatedCalories] = useState(
    toStringValue(initialRecipe?.estimatedCalories)
  );
  const [servings, setServings] = useState(toStringValue(initialRecipe?.servings, "4"));
  const [videoUrl, setVideoUrl] = useState(initialRecipe?.videoUrl ?? "");
  const [ingredients, setIngredients] = useState<IngredientForm[]>(initialIngredients);
  const [steps, setSteps] = useState<StepForm[]>(initialSteps);
  const categoryOptions = [
    ...CATEGORY_VALUES.map((value) => ({
      label: t(`options.categories.${value}`),
      value
    })),
    { label: t("options.other"), value: OTHER_VALUE }
  ];
  const unitOptions = [
    ...UNIT_VALUES.map((value) => ({
      label: t(`options.units.${unitKey(value)}`),
      value
    })),
    { label: t("options.other"), value: OTHER_VALUE }
  ];

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
      <div className="grid gap-8 lg:grid-cols-[0.72fr_1fr]">
        <div className="space-y-8">
          <PaperCard className="rotate-[-1deg] p-4" ink tape="green">
            <div className="aspect-[4/3]">
              <RecipePhotoPlaceholder label={t("media.empty")} />
            </div>
          </PaperCard>

          <PaperCard className="rotate-[-1deg]" ink tape="none">
            <h2 className="font-display text-3xl font-bold text-tertiary">{t("form.basicInfo")}</h2>
            <div className="mt-5 space-y-5">
              <TextInput
                label={t("form.name")}
                maxLength={150}
                required
                value={name}
                onValueChange={setName}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <PresetNumberField
                  label={t("form.prepTime")}
                  min="1"
                  presets={["15", "30", "45", "60"].map((value) => ({
                    label: t("form.minutesPreset", { count: Number(value) }),
                    value
                  }))}
                  value={prepTimeMinutes}
                  onValueChange={setPrepTimeMinutes}
                />
                <PresetNumberField
                  label={t("form.servings")}
                  min="1"
                  presets={["2", "4", "6", "8"].map((value) => ({
                    label: t("form.servingsPreset", { count: Number(value) }),
                    value
                  }))}
                  value={servings}
                  onValueChange={setServings}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  label={t("form.category")}
                  options={categoryOptions}
                  value={selectValue(category, CATEGORY_VALUES)}
                  onValueChange={(value) => setCategory(value)}
                />
                <PresetNumberField
                  label={t("form.calories")}
                  min="1"
                  presets={["250", "400", "600", "800"].map((value) => ({
                    label: t("form.kcalPreset", { count: Number(value) }),
                    value
                  }))}
                  step="0.01"
                  value={estimatedCalories}
                  onValueChange={setEstimatedCalories}
                />
              </div>
              {selectValue(category, CATEGORY_VALUES) === OTHER_VALUE ? (
                <TextInput
                  label={t("form.customCategory")}
                  maxLength={80}
                  value={category === OTHER_VALUE ? "" : category}
                  onValueChange={(value) => setCategory(value || OTHER_VALUE)}
                />
              ) : null}
              <TextInput
                label={t("form.videoUrl")}
                maxLength={500}
                type="url"
                value={videoUrl}
                onValueChange={setVideoUrl}
              />
              <TextAreaField
                label={t("form.description")}
                maxLength={2000}
                value={description}
                onValueChange={setDescription}
              />
            </div>
          </PaperCard>
        </div>

        <div className="space-y-8">
          <PaperCard className="rotate-[1deg]" ink tape="none">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-3xl font-bold text-tertiary">
                {t("form.ingredients")}
              </h2>
              <ActionButton
                onClick={() =>
                  setIngredients((current) => [...current, { name: "", quantity: "", unit: "un" }])
                }
                type="button"
                variant="outline"
              >
                + {t("form.addIngredient")}
              </ActionButton>
            </div>
            <div className="mt-5 space-y-4">
              {ingredients.map((ingredient, index) => (
                <div className="grid gap-3 md:grid-cols-[1fr_120px_120px_auto]" key={index}>
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
                  <SelectField
                    label={t("form.unit")}
                    options={unitOptions}
                    value={selectValue(ingredient.unit, UNIT_VALUES)}
                    onValueChange={(value) => updateIngredient(index, { unit: value })}
                  />
                  {selectValue(ingredient.unit, UNIT_VALUES) === OTHER_VALUE ? (
                    <div className="md:col-span-3">
                      <TextInput
                        label={t("form.customUnit")}
                        maxLength={40}
                        value={ingredient.unit === OTHER_VALUE ? "" : ingredient.unit}
                        onValueChange={(value) =>
                          updateIngredient(index, { unit: value || OTHER_VALUE })
                        }
                      />
                    </div>
                  ) : null}
                  <ActionButton
                    className="self-end"
                    disabled={ingredients.length === 1}
                    onClick={() =>
                      setIngredients((current) =>
                        current.filter((_, itemIndex) => itemIndex !== index)
                      )
                    }
                    type="button"
                    variant="outline"
                  >
                    {t("form.remove")}
                  </ActionButton>
                </div>
              ))}
            </div>
          </PaperCard>

          <PaperCard className="paper-lines-block rotate-[-1deg]" ink tape="none">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-3xl font-bold text-tertiary">{t("form.steps")}</h2>
              <ActionButton
                onClick={() => setSteps((current) => [...current, { instruction: "" }])}
                type="button"
                variant="outline"
              >
                + {t("form.addStep")}
              </ActionButton>
            </div>
            <div className="mt-5 space-y-4">
              {steps.map((step, index) => (
                <div className="grid gap-3 md:grid-cols-[1fr_auto]" key={index}>
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
          </PaperCard>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-end gap-6">
        <ActionLink href="/receitas" variant="outline">
          {t("form.cancel")}
        </ActionLink>
        <ActionButton className="px-10 py-4 text-lg" disabled={loading} type="submit">
          {loading ? t("form.saving") : t("form.save")}
        </ActionButton>
      </div>
    </form>
  );
}

function emptyToNull(value: string) {
  return value.trim() && value !== OTHER_VALUE ? value.trim() : null;
}

function toNumberOrNull(value: string) {
  return value ? Number(value) : null;
}

function toStringValue(value: number | null | undefined, fallback = "") {
  return value == null ? fallback : String(value);
}

function selectValue(value: string, options: string[]) {
  if (!value) {
    return "";
  }

  return options.includes(value) ? value : OTHER_VALUE;
}

function unitKey(value: string) {
  return value.replace(/\s/g, "_");
}
