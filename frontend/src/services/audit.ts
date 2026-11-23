import { ApiClientError, getValidSession } from "@/services/auth";
import type { ApiErrorResponse, ApiResponse, AuditLogResponse } from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

export async function listFamilyAuditLogs(
  accessToken: string,
  familyId: string
): Promise<AuditLogResponse[]> {
  return request<AuditLogResponse[]>(`/families/${familyId}/audit-logs`, accessToken);
}

export async function listSystemAuditLogs(
  accessToken: string
): Promise<AuditLogResponse[]> {
  return request<AuditLogResponse[]>("/audit-logs", accessToken);
}

async function request<T>(
  path: string,
  accessToken: string,
  retryOnUnauthorized = true
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 401 || response.status === 403) {
    if (retryOnUnauthorized) {
      const refreshedSession = await getValidSession(true);
      if (refreshedSession) {
        return request(path, refreshedSession.accessToken, false);
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

async function readPayload<T>(
  response: Response
): Promise<ApiResponse<T> | ApiErrorResponse> {
  try {
    return (await response.json()) as ApiResponse<T> | ApiErrorResponse;
  } catch {
    throw new ApiClientError(
      "Nao foi possivel concluir a operacao.",
      "REQUEST_ERROR",
      []
    );
  }
}
