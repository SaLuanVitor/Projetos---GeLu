"use client";

import { ActionButton } from "@/components/ui/ActionButton";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { useRouter } from "@/i18n/navigation";
import { getValidSession, handleInvalidSession } from "@/services/auth";
import { getLocalizedApiError } from "@/services/localized-error";
import { setRecipeMainMediaType } from "@/services/recipes";
import type { RecipeMainMediaType, RecipeResponse } from "@/types/api";
import { useTranslations } from "next-intl";
import { useState } from "react";

export function MainMediaSelector({
  hasVideo,
  onChange,
  recipeId,
  value
}: {
  hasVideo: boolean;
  onChange: (recipe: RecipeResponse) => void;
  recipeId: string;
  value: RecipeMainMediaType;
}) {
  const router = useRouter();
  const t = useTranslations("Recipes");
  const errors = useTranslations("CommonErrors");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleChange(nextValue: RecipeMainMediaType) {
    if (nextValue === value || saving) {
      return;
    }

    const session = await getValidSession();
    if (!session) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      onChange(await setRecipeMainMediaType(session.accessToken, recipeId, nextValue));
    } catch (requestError) {
      if (handleInvalidSession(requestError, () => router.replace("/login"))) {
        return;
      }
      setError(getLocalizedApiError(requestError, errors, t("mainMediaError")));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <p className="text-sm font-bold text-tertiary">{t("mainMedia.label")}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <ActionButton
          disabled={saving}
          onClick={() => void handleChange("IMAGE")}
          type="button"
          variant={value === "IMAGE" ? "primary" : "outline"}
        >
          {t("mainMedia.image")}
        </ActionButton>
        <ActionButton
          disabled={saving || !hasVideo}
          onClick={() => void handleChange("VIDEO")}
          type="button"
          variant={value === "VIDEO" ? "primary" : "outline"}
        >
          {t("mainMedia.video")}
        </ActionButton>
      </div>
      {!hasVideo ? (
        <p className="mt-2 text-xs text-on-surface-variant">{t("mainMedia.videoHint")}</p>
      ) : null}
      {error ? (
        <StatusMessage className="mt-3" variant="error">
          {error}
        </StatusMessage>
      ) : null}
    </div>
  );
}
