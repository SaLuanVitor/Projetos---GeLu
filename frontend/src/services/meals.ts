import { ApiClientError } from "@/services/auth";
import type {
  AnalyzeMealPhotoResponse,
  ApiErrorResponse,
  ApiResponse,
  CreateMealLogRequest,
  DailyMealChecklistItemResponse,
  DailyMealSummaryResponse,
  HabitInsightsResponse,
  MealLogResponse,
  ParseMealTextRequest,
  ParseMealTextResponse,
  QuickCheckinMealRequest,
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

/**
 * Analisa texto livre em português ou transcrição de áudio com Gemini 2.5 Flash
 */
export async function parseMealText(
  accessToken: string,
  body: ParseMealTextRequest
): Promise<ParseMealTextResponse> {
  const response = await fetch(`${API_URL}/meals/parse-text`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  const payload = await readPayload<ParseMealTextResponse>(response);
  if (!response.ok || !payload.success) {
    const error = "error" in payload ? payload.error : undefined;
    throw new ApiClientError(
      error?.message ?? "Não foi possível analisar o texto da refeição.",
      error?.code ?? "PARSE_TEXT_ERROR",
      error?.details ?? []
    );
  }

  return payload.data;
}

/**
 * Check-in instantâneo em 1 clique para refeições planejadas (Comi ou Pulei)
 */
export async function quickCheckinMeal(
  accessToken: string,
  body: QuickCheckinMealRequest
): Promise<MealLogResponse> {
  const response = await fetch(`${API_URL}/meals/quick-checkin`, {
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
      error?.message ?? "Não foi possível realizar o check-in da refeição.",
      error?.code ?? "QUICK_CHECKIN_ERROR",
      error?.details ?? []
    );
  }

  return payload.data;
}

/**
 * Retorna o checklist diário de refeições planejadas vs consumidas/puladas
 */
export async function getDailyMealChecklist(
  accessToken: string,
  date?: string,
  familyId?: string
): Promise<DailyMealChecklistItemResponse[]> {
  const params = new URLSearchParams();
  if (date) params.append("date", date);
  if (familyId) params.append("familyId", familyId);
  const query = params.toString() ? `?${params.toString()}` : "";

  const response = await fetch(`${API_URL}/meals/daily-checklist${query}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const payload = await readPayload<DailyMealChecklistItemResponse[]>(response);
  if (!response.ok || !payload.success) {
    const error = "error" in payload ? payload.error : undefined;
    throw new ApiClientError(
      error?.message ?? "Não foi possível carregar o checklist de refeições.",
      error?.code ?? "CHECKLIST_ERROR",
      error?.details ?? []
    );
  }

  return payload.data;
}

/**
 * Retorna a taxa de adesão, hábitos alimentares frequentes e dicas do coach IA
 */
export async function getHabitsInsights(
  accessToken: string,
  familyId?: string
): Promise<HabitInsightsResponse> {
  const query = familyId ? `?familyId=${encodeURIComponent(familyId)}` : "";
  const response = await fetch(`${API_URL}/meals/habits-insights${query}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const payload = await readPayload<HabitInsightsResponse>(response);
  if (!response.ok || !payload.success) {
    const error = "error" in payload ? payload.error : undefined;
    throw new ApiClientError(
      error?.message ?? "Não foi possível obter insights de hábitos alimentares.",
      error?.code ?? "HABITS_INSIGHTS_ERROR",
      error?.details ?? []
    );
  }

  return payload.data;
}
