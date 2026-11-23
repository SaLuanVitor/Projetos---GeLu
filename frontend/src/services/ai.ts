import { ApiClientError } from "@/services/auth";
import type {
  ApiErrorResponse,
  ApiResponse,
  GenerateSuggestionRequest,
  MealSuggestionResponse,
  NutritionEstimateRequest,
  NutritionEstimateResponse,
  WorkoutCalorieEstimateRequest,
  WorkoutCalorieEstimateResponse,
} from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

export async function estimateWorkoutCalories(
  accessToken: string,
  body: WorkoutCalorieEstimateRequest
): Promise<WorkoutCalorieEstimateResponse> {
  const response = await fetch(`${API_URL}/ai/workout-calorie-estimate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  const payload = await readPayload<WorkoutCalorieEstimateResponse>(response);
  if (!response.ok || !payload.success) {
    const error = "error" in payload ? payload.error : undefined;
    throw new ApiClientError(
      error?.message ?? "Não foi possível estimar o gasto calórico do treino.",
      error?.code ?? "AI_ERROR",
      error?.details ?? []
    );
  }

  return payload.data;
}

export async function estimateRecipeNutrition(
  accessToken: string,
  body: NutritionEstimateRequest
): Promise<NutritionEstimateResponse> {
  const response = await fetch(`${API_URL}/ai/nutrition-estimate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  const payload = await readPayload<NutritionEstimateResponse>(response);
  if (!response.ok || !payload.success) {
    const error = "error" in payload ? payload.error : undefined;
    throw new ApiClientError(
      error?.message ?? "Não foi possível estimar os valores nutricionais.",
      error?.code ?? "AI_ERROR",
      error?.details ?? []
    );
  }

  return payload.data;
}

export async function generateMealSuggestion(
  body: GenerateSuggestionRequest
): Promise<MealSuggestionResponse> {
  const response = await fetch(`${API_URL}/ai/suggest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = await readPayload<MealSuggestionResponse>(response);
  if (!response.ok || !payload.success) {
    const error = "error" in payload ? payload.error : undefined;
    throw new ApiClientError(
      error?.message ?? "Não foi possível gerar a sugestão.",
      error?.code ?? "AI_ERROR",
      error?.details ?? []
    );
  }

  return payload.data;
}

async function readPayload<T>(
  response: Response
): Promise<ApiResponse<T> | ApiErrorResponse> {
  try {
    return (await response.json()) as ApiResponse<T> | ApiErrorResponse;
  } catch {
    throw new ApiClientError(
      "Não foi possível concluir a operação.",
      "REQUEST_ERROR",
      []
    );
  }
}
