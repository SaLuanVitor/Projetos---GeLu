import { ApiClientError, getValidSession } from "@/services/auth";
import type {
  ApiErrorResponse,
  ApiResponse,
  CreateWeightRecordRequest,
  ProfileResponse,
  UpdateProfileRequest,
  WeightHistoryItem
} from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

export async function getProfile(accessToken: string): Promise<ProfileResponse> {
  return request<ProfileResponse>("/profile/me", accessToken);
}

export async function updateProfile(
  accessToken: string,
  body: UpdateProfileRequest
): Promise<ProfileResponse> {
  return request<ProfileResponse>("/profile/me", accessToken, {
    method: "PUT",
    body
  });
}

export async function listWeightHistory(accessToken: string): Promise<WeightHistoryItem[]> {
  return request<WeightHistoryItem[]>("/profile/weight-history", accessToken);
}

export async function createWeightRecord(
  accessToken: string,
  body: CreateWeightRecordRequest
): Promise<WeightHistoryItem> {
  return request<WeightHistoryItem>("/profile/weight-history", accessToken, {
    method: "POST",
    body
  });
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
