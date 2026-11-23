import { ApiClientError, getValidSession } from "@/services/auth";
import type {
  ApiErrorResponse,
  ApiResponse,
  FamilyWeeklyGoalRequest,
  FamilyWeeklyGoalResponse,
  ScheduleActivityRequest,
  ScheduleActivityResponse
} from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

export async function listScheduleActivities(
  accessToken: string,
  familyId?: string,
  dayOfWeek?: string,
  date?: string
): Promise<ScheduleActivityResponse[]> {
  const params = new URLSearchParams();
  if (familyId) params.set("familyId", familyId);
  if (dayOfWeek) params.set("dayOfWeek", dayOfWeek);
  if (date) params.set("date", date);

  const query = params.toString() ? `?${params.toString()}` : "";
  return request<ScheduleActivityResponse[]>(`/schedule/activities${query}`, accessToken);
}

export async function createScheduleActivity(
  accessToken: string,
  body: ScheduleActivityRequest
): Promise<ScheduleActivityResponse> {
  return request<ScheduleActivityResponse>("/schedule/activities", accessToken, {
    method: "POST",
    body
  });
}

export async function updateScheduleActivity(
  accessToken: string,
  id: string,
  body: ScheduleActivityRequest
): Promise<ScheduleActivityResponse> {
  return request<ScheduleActivityResponse>(`/schedule/activities/${id}`, accessToken, {
    method: "PUT",
    body
  });
}

export async function deleteScheduleActivity(accessToken: string, id: string): Promise<void> {
  await request<void>(`/schedule/activities/${id}`, accessToken, { method: "DELETE" });
}

export async function toggleScheduleActivityCompletion(
  accessToken: string,
  id: string,
  date?: string
): Promise<{ completed: boolean }> {
  const query = date ? `?date=${date}` : "";
  return request<{ completed: boolean }>(`/schedule/activities/${id}/toggle${query}`, accessToken, {
    method: "POST"
  });
}

export async function listFamilyWeeklyGoals(
  accessToken: string,
  familyId?: string,
  date?: string
): Promise<FamilyWeeklyGoalResponse[]> {
  const params = new URLSearchParams();
  if (familyId) params.set("familyId", familyId);
  if (date) params.set("date", date);
  const query = params.toString() ? `?${params.toString()}` : "";
  return request<FamilyWeeklyGoalResponse[]>(`/schedule/goals${query}`, accessToken);
}

export async function createFamilyWeeklyGoal(
  accessToken: string,
  body: FamilyWeeklyGoalRequest
): Promise<FamilyWeeklyGoalResponse> {
  return request<FamilyWeeklyGoalResponse>("/schedule/goals", accessToken, {
    method: "POST",
    body
  });
}

export async function deleteFamilyWeeklyGoal(accessToken: string, id: string): Promise<void> {
  await request<void>(`/schedule/goals/${id}`, accessToken, { method: "DELETE" });
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
