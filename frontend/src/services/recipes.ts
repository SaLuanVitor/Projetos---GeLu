import { ApiClientError, getValidSession } from "@/services/auth";
import type {
  ApiErrorResponse,
  ApiResponse,
  RecipeRequest,
  RecipeResponse,
  RecipeSearchFilters
} from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

export async function listRecipes(
  accessToken: string,
  filters: RecipeSearchFilters = {}
): Promise<RecipeResponse[]> {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      query.set(key, value);
    }
  });

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return request<RecipeResponse[]>(`/recipes${suffix}`, accessToken);
}

export async function getRecipe(accessToken: string, id: string): Promise<RecipeResponse> {
  return request<RecipeResponse>(`/recipes/${id}`, accessToken);
}

export async function createRecipe(
  accessToken: string,
  body: RecipeRequest
): Promise<RecipeResponse> {
  return request<RecipeResponse>("/recipes", accessToken, { method: "POST", body });
}

export async function updateRecipe(
  accessToken: string,
  id: string,
  body: RecipeRequest
): Promise<RecipeResponse> {
  return request<RecipeResponse>(`/recipes/${id}`, accessToken, { method: "PUT", body });
}

export async function deleteRecipe(accessToken: string, id: string): Promise<void> {
  await request<void>(`/recipes/${id}`, accessToken, { method: "DELETE" });
}

async function request<T>(
  path: string,
  accessToken: string,
  options: { method?: string; body?: unknown } = {},
  retryOnUnauthorized = true
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(options.body ? { "Content-Type": "application/json" } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
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
