import { ApiClientError, getValidSession } from "@/services/auth";
import type {
  AdminDashboardTelemetryResponse,
  AdminFamilyResponse,
  AdminMetricsResponse,
  AdminRole,
  AdminTeamMemberResponse,
  AdminUserResponse,
  AiUsageSummaryResponse,
  ApiErrorResponse,
  ApiResponse,
  CreateAdminTeamRequest,
  CreateSupportTicketRequest,
  PiiRevealRequest,
  SupportTicketResponse,
  SystemAuditLogResponse,
  SystemSettingResponse,
  TestGeminiRequest,
  TestGeminiResponse,
  UpdateAdminRoleRequest,
  UpdateAdminStatusRequest,
  UpdateSupportTicketStatusRequest,
  UpdateSystemSettingsRequest,
  UserAiUsageResponse,
  UserDataExportResponse,
} from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

export async function getAdminMetrics(accessToken: string): Promise<AdminMetricsResponse> {
  return request<AdminMetricsResponse>("/admin/metrics", accessToken);
}

export async function getDashboardTelemetry(accessToken: string): Promise<AdminDashboardTelemetryResponse> {
  return request<AdminDashboardTelemetryResponse>("/admin/dashboard-telemetry", accessToken);
}

export async function getAdminUsers(accessToken: string): Promise<AdminUserResponse[]> {
  return request<AdminUserResponse[]>("/admin/users", accessToken);
}

export async function getAdminFamilies(accessToken: string): Promise<AdminFamilyResponse[]> {
  return request<AdminFamilyResponse[]>("/admin/families", accessToken);
}

export async function listSupportTickets(
  accessToken: string,
  status?: string
): Promise<SupportTicketResponse[]> {
  const query = status ? `?status=${status}` : "";
  return request<SupportTicketResponse[]>(`/admin/tickets${query}`, accessToken);
}

export async function updateSupportTicketStatus(
  accessToken: string,
  id: string,
  body: UpdateSupportTicketStatusRequest
): Promise<SupportTicketResponse> {
  return request<SupportTicketResponse>(`/admin/tickets/${id}/status`, accessToken, {
    method: "PUT",
    body,
  });
}

export async function getAdminSettings(accessToken: string): Promise<SystemSettingResponse[]> {
  return request<SystemSettingResponse[]>("/admin/settings", accessToken);
}

export async function updateAdminSettings(
  accessToken: string,
  settings: Record<string, string>
): Promise<void> {
  return request<void>("/admin/settings", accessToken, {
    method: "PUT",
    body: { settings } as UpdateSystemSettingsRequest,
  });
}

export async function getAdminAiUsage(accessToken: string): Promise<AiUsageSummaryResponse> {
  return request<AiUsageSummaryResponse>("/admin/ai/usage", accessToken);
}

export async function testAdminGeminiConnection(
  accessToken: string,
  body: TestGeminiRequest
): Promise<TestGeminiResponse> {
  return request<TestGeminiResponse>("/admin/ai/test", accessToken, {
    method: "POST",
    body,
  });
}

export async function getAdminAuditLogs(accessToken: string): Promise<SystemAuditLogResponse[]> {
  return request<SystemAuditLogResponse[]>("/admin/audit-logs", accessToken);
}

export async function getUserAiUsage(accessToken: string): Promise<UserAiUsageResponse[]> {
  return request<UserAiUsageResponse[]>("/admin/ai/usage/by-user", accessToken);
}

export async function exportUserData(accessToken: string, userId: string): Promise<UserDataExportResponse> {
  return request<UserDataExportResponse>(`/admin/users/${userId}/export`, accessToken);
}

export async function anonymizeUser(accessToken: string, userId: string): Promise<void> {
  return request<void>(`/admin/users/${userId}/anonymize`, accessToken, {
    method: "PUT",
  });
}

export async function logPiiReveal(accessToken: string, details?: string): Promise<void> {
  return request<void>("/admin/audit/log-reveal", accessToken, {
    method: "POST",
    body: { details },
  });
}

export async function logPiiRevealWithReason(
  accessToken: string,
  body: PiiRevealRequest
): Promise<void> {
  return request<void>("/admin/audit/pii-reveal", accessToken, {
    method: "POST",
    body,
  });
}

export async function getAdminTeam(accessToken: string): Promise<AdminTeamMemberResponse[]> {
  return request<AdminTeamMemberResponse[]>("/admin/team", accessToken);
}

export async function createAdminTeamMember(
  accessToken: string,
  body: CreateAdminTeamRequest
): Promise<AdminTeamMemberResponse> {
  return request<AdminTeamMemberResponse>("/admin/team", accessToken, {
    method: "POST",
    body,
  });
}

export async function updateAdminTeamMemberRole(
  accessToken: string,
  id: string,
  role: AdminRole
): Promise<AdminTeamMemberResponse> {
  return request<AdminTeamMemberResponse>(`/admin/team/${id}/role`, accessToken, {
    method: "PATCH",
    body: { role },
  });
}

export async function updateAdminTeamMemberStatus(
  accessToken: string,
  id: string,
  active: boolean
): Promise<AdminTeamMemberResponse> {
  return request<AdminTeamMemberResponse>(`/admin/team/${id}/status`, accessToken, {
    method: "PATCH",
    body: { active },
  });
}

export async function deleteAdminTeamMember(
  accessToken: string,
  id: string
): Promise<void> {
  return request<void>(`/admin/team/${id}`, accessToken, {
    method: "DELETE",
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
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 403) {
    throw new ApiClientError("Acesso restrito à administração do sistema", "FORBIDDEN", []);
  }

  if (response.status === 401) {
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
