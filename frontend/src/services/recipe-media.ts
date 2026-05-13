import { ApiClientError, getValidSession } from "@/services/auth";
import type { ApiErrorResponse, ApiResponse, RecipeMedia } from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

export async function listRecipeMedia(
  accessToken: string,
  recipeId: string
): Promise<RecipeMedia[]> {
  return request<RecipeMedia[]>(`/recipes/${recipeId}/media`, accessToken);
}

export async function uploadRecipeMedia(
  accessToken: string,
  recipeId: string,
  file: File
): Promise<RecipeMedia> {
  const formData = new FormData();
  formData.set("file", file);
  return request<RecipeMedia>(`/recipes/${recipeId}/media`, accessToken, {
    method: "POST",
    body: formData
  });
}

export async function setMainRecipeMedia(
  accessToken: string,
  recipeId: string,
  mediaId: string
): Promise<RecipeMedia> {
  return request<RecipeMedia>(`/recipes/${recipeId}/media/${mediaId}/main`, accessToken, {
    method: "PUT"
  });
}

export async function deleteRecipeMedia(
  accessToken: string,
  recipeId: string,
  mediaId: string
): Promise<void> {
  await request<void>(`/recipes/${recipeId}/media/${mediaId}`, accessToken, { method: "DELETE" });
}

export async function fetchRecipeMediaObjectUrl(
  accessToken: string,
  mediaUrl: string,
  retryOnUnauthorized = true
): Promise<string> {
  const response = await fetch(toApiUrl(mediaUrl), {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (response.status === 401 || response.status === 403) {
    if (retryOnUnauthorized) {
      const refreshedSession = await getValidSession(true);
      if (refreshedSession) {
        return fetchRecipeMediaObjectUrl(refreshedSession.accessToken, mediaUrl, false);
      }
    }

    throw new ApiClientError("Authentication required", "UNAUTHORIZED", []);
  }

  if (!response.ok) {
    throw new ApiClientError("Nao foi possivel carregar a imagem.", "REQUEST_ERROR", []);
  }

  return URL.createObjectURL(await response.blob());
}

async function request<T>(
  path: string,
  accessToken: string,
  options: { method?: string; body?: BodyInit } = {},
  retryOnUnauthorized = true
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: options.body
  });

  if (response.status === 401 || response.status === 403) {
    if (retryOnUnauthorized) {
      const refreshedSession = await getValidSession(true);
      if (refreshedSession) {
        return request(path, refreshedSession.accessToken, options, false);
      }
    }

    throw new ApiClientError("Authentication required", "UNAUTHORIZED", []);
  }

  const payload = await readPayload<T>(response);

  if (!response.ok || !payload.success) {
    const error = "error" in payload ? payload.error : undefined;
    throw new ApiClientError(
      error?.message ?? "Nao foi possivel concluir a operacao.",
      error?.code ?? "REQUEST_ERROR",
      error?.details ?? []
    );
  }

  return payload.data;
}

async function readPayload<T>(response: Response): Promise<ApiResponse<T> | ApiErrorResponse> {
  try {
    return (await response.json()) as ApiResponse<T> | ApiErrorResponse;
  } catch {
    throw new ApiClientError("Nao foi possivel concluir a operacao.", "REQUEST_ERROR", []);
  }
}

function toApiUrl(mediaUrl: string) {
  if (mediaUrl.startsWith("http")) {
    return mediaUrl;
  }
  return `${API_URL.replace(/\/api\/v1$/, "")}${mediaUrl}`;
}
