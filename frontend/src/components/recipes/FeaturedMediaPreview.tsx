"use client";

import { RecipePhotoPlaceholder } from "@/components/ui/Notebook";
import { getValidSession } from "@/services/auth";
import { fetchRecipeMediaObjectUrl } from "@/services/recipe-media";
import type { RecipeResponse } from "@/types/api";
import { getYoutubeThumbnailUrl } from "@/utils/video-embed";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export function FeaturedMediaPreview({
  interactive = false,
  onPlay,
  recipe
}: {
  interactive?: boolean;
  onPlay?: () => void;
  recipe: RecipeResponse;
}) {
  const t = useTranslations("Recipes");
  const [imageObjectUrl, setImageObjectUrl] = useState("");
  const [imageError, setImageError] = useState(false);
  const thumbnailUrl =
    recipe.mainMediaType === "VIDEO" ? getYoutubeThumbnailUrl(recipe.videoUrl) : null;

  useEffect(() => {
    let active = true;
    let objectUrl = "";

    setImageError(false);

    if (recipe.mainMediaType !== "IMAGE" || !recipe.mainImageUrl) {
      setImageObjectUrl("");
      return () => undefined;
    }

    getValidSession().then(async (session) => {
      if (!session) {
        return;
      }

      try {
        objectUrl = await fetchRecipeMediaObjectUrl(session.accessToken, recipe.mainImageUrl!);
        if (active) {
          setImageObjectUrl(objectUrl);
        } else {
          URL.revokeObjectURL(objectUrl);
        }
      } catch {
        if (active) {
          setImageObjectUrl("");
          setImageError(true);
        }
      }
    });

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [recipe.mainImageUrl, recipe.mainMediaType]);

  if (recipe.mainMediaType === "VIDEO" && recipe.videoUrl) {
    const content = (
      <>
        {thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="" className="h-full w-full object-cover" src={thumbnailUrl} />
        ) : (
          <div className="paper-dots-block flex h-full w-full flex-col items-center justify-center gap-3 bg-surface-container text-center text-sm font-bold text-outline">
            <span className="text-base text-on-surface-variant">
              {t("video.thumbnailFallback")}
            </span>
            <span className="max-w-xs text-tertiary">{recipe.name}</span>
          </div>
        )}
        <span className="absolute inset-0 bg-black/20" />
        <span className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-primary bg-primary-container text-4xl font-black text-on-primary shadow-paper">
          ▶
        </span>
      </>
    );

    if (interactive) {
      return (
        <button
          aria-label={t("video.play")}
          className="relative h-full w-full overflow-hidden border-2 border-outline bg-surface-container text-center transition-transform hover:scale-[1.01] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          onClick={onPlay}
          type="button"
        >
          {content}
        </button>
      );
    }

    return (
      <div className="relative h-full w-full overflow-hidden border-2 border-outline bg-surface-container">
        {content}
      </div>
    );
  }

  if (imageObjectUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img alt={recipe.name} className="h-full w-full object-cover" src={imageObjectUrl} />
    );
  }

  return (
    <RecipePhotoPlaceholder
      label={imageError ? t("media.mainImageLoadError") : (recipe.category ?? t("noCategory"))}
    />
  );
}
