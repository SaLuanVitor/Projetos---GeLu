import { ApiClientError, getValidSession } from "@/services/auth";
import type {
  ApiErrorResponse,
  ApiResponse,
  CreateWorkoutLogRequest,
  DailyWorkoutSummaryResponse,
  WorkoutLogResponse,
  WorkoutRequest,
  WorkoutResponse,
} from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

export async function listWorkouts(
  accessToken: string,
  familyId?: string
): Promise<WorkoutResponse[]> {
  const query = familyId ? `?familyId=${familyId}` : "";
  return request<WorkoutResponse[]>(`/workouts${query}`, accessToken);
}

export async function createWorkout(
  accessToken: string,
  body: WorkoutRequest
): Promise<WorkoutResponse> {
  return request<WorkoutResponse>("/workouts", accessToken, {
    method: "POST",
    body,
  });
}

export async function deleteWorkout(
  accessToken: string,
  id: string
): Promise<void> {
  await request<void>(`/workouts/${id}`, accessToken, { method: "DELETE" });
}

export async function logWorkout(
  accessToken: string,
  body: CreateWorkoutLogRequest
): Promise<WorkoutLogResponse> {
  return request<WorkoutLogResponse>("/workouts/logs", accessToken, {
    method: "POST",
    body,
  });
}

export async function listWorkoutLogs(
  accessToken: string,
  familyId?: string
): Promise<WorkoutLogResponse[]> {
  const query = familyId ? `?familyId=${familyId}` : "";
  return request<WorkoutLogResponse[]>(`/workouts/logs${query}`, accessToken);
}

export async function getDailyWorkoutSummary(
  accessToken: string,
  date?: string
): Promise<DailyWorkoutSummaryResponse> {
  const query = date ? `?date=${date}` : "";
  return request<DailyWorkoutSummaryResponse>(
    `/workouts/daily-summary${query}`,
    accessToken
  );
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
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
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
      error?.message ?? "Não foi possível concluir a operação.",
      error?.code ?? "REQUEST_ERROR",
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
