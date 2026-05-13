"use client";

import { ActionButton } from "@/components/ui/ActionButton";
import { getVideoEmbedUrl } from "@/utils/video-embed";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

export function RecipeVideoModal({
  onClose,
  title,
  videoUrl
}: {
  onClose: () => void;
  title: string;
  videoUrl: string;
}) {
  const t = useTranslations("Recipes.video");
  const embedUrl = getVideoEmbedUrl(videoUrl);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      aria-labelledby="recipe-video-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8"
      role="dialog"
    >
      <div className="hand-drawn-border w-full max-w-4xl bg-surface p-5 shadow-paper">
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-display text-3xl font-bold text-tertiary" id="recipe-video-title">
            {title}
          </h2>
          <ActionButton onClick={onClose} type="button" variant="outline">
            {t("close")}
          </ActionButton>
        </div>

        <div className="mt-5 aspect-video overflow-hidden rounded-lg border-2 border-outline bg-surface-container">
          {embedUrl ? (
            <iframe
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="h-full w-full"
              src={embedUrl}
              title={title}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
              <p className="max-w-xl text-sm leading-6 text-on-surface-variant">
                {t("fallbackText")}
              </p>
              <a
                className="font-bold text-primary underline"
                href={videoUrl}
                rel="noreferrer"
                target="_blank"
              >
                {t("openExternal")}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
