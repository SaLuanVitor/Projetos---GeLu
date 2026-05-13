"use client";

import {
  deleteRecipeMedia,
  fetchRecipeMediaObjectUrl,
  listRecipeMedia,
  setMainRecipeMedia,
  uploadRecipeMedia
} from "@/services/recipe-media";
import { getValidSession, handleInvalidSession } from "@/services/auth";
import { getLocalizedApiError } from "@/services/localized-error";
import type { RecipeMedia } from "@/types/api";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ChangeEvent, useEffect, useState } from "react";
import { ActionButton } from "@/components/ui/ActionButton";
import { StatusMessage } from "@/components/ui/StatusMessage";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

type MediaUploaderProps = {
  recipeId: string;
  initialMedia: RecipeMedia[];
  onMediaChange?: (media: RecipeMedia[]) => void;
};

export function MediaUploader({ recipeId, initialMedia, onMediaChange }: MediaUploaderProps) {
  const router = useRouter();
  const t = useTranslations("Recipes.media");
  const errors = useTranslations("CommonErrors");
  const [media, setMedia] = useState(initialMedia);
  const [objectUrls, setObjectUrls] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setMedia(initialMedia);
  }, [initialMedia]);

  useEffect(() => {
    let active = true;
    const urls: string[] = [];

    getValidSession().then(async (session) => {
      if (!session) {
        return;
      }

      const nextUrls: Record<string, string> = {};
      await Promise.all(
        media.map(async (item) => {
          try {
            const url = await fetchRecipeMediaObjectUrl(session.accessToken, item.url);
            urls.push(url);
            nextUrls[item.id] = url;
          } catch {
            nextUrls[item.id] = "";
          }
        })
      );

      if (active) {
        setObjectUrls(nextUrls);
      } else {
        urls.forEach(URL.revokeObjectURL);
      }
    });

    return () => {
      active = false;
      urls.forEach(URL.revokeObjectURL);
    };
  }, [media]);

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError(t("invalidType"));
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setError(t("tooLarge"));
      return;
    }

    await runMediaAction(async (accessToken) => {
      await uploadRecipeMedia(accessToken, recipeId, file);
      setStatus(t("uploaded"));
      await reload(accessToken);
    });
  }

  async function handleSetMain(mediaId: string) {
    await runMediaAction(async (accessToken) => {
      await setMainRecipeMedia(accessToken, recipeId, mediaId);
      setStatus(t("mainUpdated"));
      await reload(accessToken);
    });
  }

  async function handleDelete(mediaId: string) {
    await runMediaAction(async (accessToken) => {
      await deleteRecipeMedia(accessToken, recipeId, mediaId);
      setStatus(t("removed"));
      await reload(accessToken);
    });
  }

  async function reload(accessToken: string) {
    const loadedMedia = await listRecipeMedia(accessToken, recipeId);
    setMedia(loadedMedia);
    onMediaChange?.(loadedMedia);
  }

  async function runMediaAction(action: (accessToken: string) => Promise<void>) {
    setBusy(true);
    setError("");
    setStatus("");
    const session = await getValidSession();
    if (!session) {
      setBusy(false);
      return;
    }

    try {
      await action(session.accessToken);
    } catch (requestError) {
      if (handleInvalidSession(requestError, () => router.replace("/login"))) {
        return;
      }
      setError(getLocalizedApiError(requestError, errors, t("error")));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl font-bold text-tertiary">{t("title")}</h2>
          <p className="mt-1 text-sm leading-6 text-on-surface-variant">{t("description")}</p>
        </div>
        <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border-2 border-tertiary bg-primary px-4 py-2 text-sm font-bold text-on-primary shadow-label transition-transform hover:rotate-1 hover:scale-[1.02]">
          {busy ? t("uploading") : t("upload")}
          <input
            accept={ACCEPTED_IMAGE_TYPES.join(",")}
            className="sr-only"
            disabled={busy}
            onChange={handleUpload}
            type="file"
          />
        </label>
      </div>

      <div className="mt-4 space-y-3">
        {status ? <StatusMessage>{status}</StatusMessage> : null}
        {error ? <StatusMessage variant="error">{error}</StatusMessage> : null}
      </div>

      {media.length === 0 ? (
        <div className="mt-5 rounded-lg border-2 border-dashed border-outline bg-surface-container-low p-5 text-sm text-on-surface-variant">
          {t("empty")}
        </div>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {media.map((item) => (
            <article
              className="overflow-hidden rounded-lg border-2 border-outline bg-surface-container-low"
              key={item.id}
            >
              <div className="aspect-[4/3] bg-surface-container">
                {objectUrls[item.id] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt={item.fileName}
                    className="h-full w-full object-cover"
                    src={objectUrls[item.id]}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-on-surface-variant">
                    {t("loadingImage")}
                  </div>
                )}
              </div>
              <div className="space-y-3 p-3">
                <div>
                  <p className="break-words text-sm font-bold text-primary">{item.fileName}</p>
                  <p className="text-xs text-on-surface-variant">
                    {t("size", { size: Math.ceil(item.sizeBytes / 1024) })}
                  </p>
                </div>
                {item.main ? (
                  <span className="inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-bold text-on-secondary">
                    {t("main")}
                  </span>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <ActionButton
                    disabled={busy || item.main}
                    onClick={() => handleSetMain(item.id)}
                    type="button"
                    variant="secondary"
                  >
                    {t("setMain")}
                  </ActionButton>
                  <ActionButton
                    disabled={busy}
                    onClick={() => handleDelete(item.id)}
                    type="button"
                    variant="outline"
                  >
                    {t("remove")}
                  </ActionButton>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
