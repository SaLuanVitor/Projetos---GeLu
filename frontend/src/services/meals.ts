import { ApiClientError } from "@/services/auth";
import type {
  AnalyzeMealPhotoResponse,
  ApiErrorResponse,
  ApiResponse,
  CreateMealLogRequest,
  DailyMealSummaryResponse,
  MealLogResponse,
} from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

async function readPayload<T>(
  response: Response
): Promise<ApiResponse<T> | ApiErrorResponse> {
  try {
    return (await response.json()) as ApiResponse<T> | ApiErrorResponse;
  } catch {
    throw new ApiClientError(
      "Não foi possível processar a resposta do servidor.",
      "REQUEST_ERROR",
      []
    );
  }
}

/**
 * Envia uma foto para o FoodVisionAgent (Gemini 2.5 Flash Vision) para análise multimodal
 */
export async function analyzeMealPhoto(
  accessToken: string,
  file: File,
  mealType?: string
): Promise<AnalyzeMealPhotoResponse> {
  const formData = new FormData();
  formData.append("file", file);
  if (mealType) {
    formData.append("mealType", mealType);
  }

  const response = await fetch(`${API_URL}/meals/analyze-photo`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      // Não definir Content-Type para permitir multipart/form-data boundary
    },
    body: formData,
  });

  const payload = await readPayload<AnalyzeMealPhotoResponse>(response);
  if (!response.ok || !payload.success) {
    const error = "error" in payload ? payload.error : undefined;
    throw new ApiClientError(
      error?.message ?? "Não foi possível analisar a foto da refeição.",
      error?.code ?? "VISION_AI_ERROR",
      error?.details ?? []
    );
  }

  return payload.data;
}

/**
 * Salva um registro confirmado de refeição no diário
 */
export async function createMealLog(
  accessToken: string,
  body: CreateMealLogRequest
): Promise<MealLogResponse> {
  const response = await fetch(`${API_URL}/meals`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  const payload = await readPayload<MealLogResponse>(response);
  if (!response.ok || !payload.success) {
    const error = "error" in payload ? payload.error : undefined;
    throw new ApiClientError(
      error?.message ?? "Não foi possível registrar a refeição.",
      error?.code ?? "MEAL_LOG_ERROR",
      error?.details ?? []
    );
  }

  return payload.data;
}

/**
 * Lista as refeições registradas no dia especificado
 */
export async function listMealLogs(
  accessToken: string,
  date?: string
): Promise<MealLogResponse[]> {
  const query = date ? `?date=${encodeURIComponent(date)}` : "";
  const response = await fetch(`${API_URL}/meals${query}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const payload = await readPayload<MealLogResponse[]>(response);
  if (!response.ok || !payload.success) {
    const error = "error" in payload ? payload.error : undefined;
    throw new ApiClientError(
      error?.message ?? "Não foi possível listar as refeições.",
      error?.code ?? "MEAL_LOG_ERROR",
      error?.details ?? []
    );
  }

  return payload.data;
}

/**
 * Obtém o resumo nutricional agregado do dia
 */
export async function getDailyMealSummary(
  accessToken: string,
  date?: string
): Promise<DailyMealSummaryResponse> {
  const query = date ? `?date=${encodeURIComponent(date)}` : "";
  const response = await fetch(`${API_URL}/meals/daily-summary${query}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const payload = await readPayload<DailyMealSummaryResponse>(response);
  if (!response.ok || !payload.success) {
    const error = "error" in payload ? payload.error : undefined;
    throw new ApiClientError(
      error?.message ?? "Não foi possível carregar o resumo nutricional do dia.",
      error?.code ?? "MEAL_SUMMARY_ERROR",
      error?.details ?? []
    );
  }

  return payload.data;
}

/**
 * Remove um registro de refeição
 */
export async function deleteMealLog(
  accessToken: string,
  mealLogId: string
): Promise<void> {
  const response = await fetch(`${API_URL}/meals/${mealLogId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const payload = await readPayload<void>(response);
  if (!response.ok || !payload.success) {
    const error = "error" in payload ? payload.error : undefined;
    throw new ApiClientError(
      error?.message ?? "Não foi possível excluir a refeição.",
      error?.code ?? "MEAL_DELETE_ERROR",
      error?.details ?? []
    );
  }
}
