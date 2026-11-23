import { ApiClientError, getValidSession } from "@/services/auth";
import type {
  ApiErrorResponse,
  ApiResponse,
  CreateFamilyRequest,
  FamilyResponse,
  UpdateFamilyRequest,
  AddFamilyMemberRequest,
  CreateFamilyInviteRequest,
  FamilyInviteResponse,
} from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

export async function listFamilies(accessToken: string): Promise<FamilyResponse[]> {
  return request<FamilyResponse[]>("/families", accessToken);
}

export async function getFamily(accessToken: string, id: string): Promise<FamilyResponse> {
  return request<FamilyResponse>(`/families/${id}`, accessToken);
}

export async function createFamily(
  accessToken: string,
  body: CreateFamilyRequest
): Promise<FamilyResponse> {
  return request<FamilyResponse>("/families", accessToken, { method: "POST", body });
}

export async function updateFamily(
  accessToken: string,
  id: string,
  body: UpdateFamilyRequest
): Promise<FamilyResponse> {
  return request<FamilyResponse>(`/families/${id}`, accessToken, { method: "PUT", body });
}

export async function deleteFamily(accessToken: string, id: string): Promise<void> {
  await request<void>(`/families/${id}`, accessToken, { method: "DELETE" });
}

export async function addFamilyMember(
  accessToken: string,
  familyId: string,
  body: AddFamilyMemberRequest
): Promise<FamilyResponse> {
  return request<FamilyResponse>(`/families/${familyId}/members`, accessToken, {
    method: "POST",
    body
  });
}

export async function removeFamilyMember(
  accessToken: string,
  familyId: string,
  userId: string
): Promise<FamilyResponse> {
  return request<FamilyResponse>(`/families/${familyId}/members/${userId}`, accessToken, {
    method: "DELETE"
  });
}

export async function createFamilyInvite(
  accessToken: string,
  familyId: string,
  body: CreateFamilyInviteRequest
): Promise<FamilyInviteResponse> {
  return request<FamilyInviteResponse>(`/families/${familyId}/invites`, accessToken, {
    method: "POST",
    body,
  });
}

export async function listFamilyInvites(
  accessToken: string,
  familyId: string
): Promise<FamilyInviteResponse[]> {
  return request<FamilyInviteResponse[]>(`/families/${familyId}/invites`, accessToken);
}

export async function cancelFamilyInvite(
  accessToken: string,
  familyId: string,
  inviteId: string
): Promise<void> {
  await request<void>(`/families/${familyId}/invites/${inviteId}`, accessToken, {
    method: "DELETE",
  });
}

export async function getFamilyInviteByToken(
  token: string
): Promise<FamilyInviteResponse> {
  const response = await fetch(`${API_URL}/invites/${token}`);
  const payload = await readPayload<FamilyInviteResponse>(response);
  if (!response.ok || !payload.success) {
    const error = "error" in payload ? payload.error : undefined;
    throw new ApiClientError(
      error?.message ?? "Convite inválido ou expirado.",
      error?.code ?? "NOT_FOUND",
      error?.details ?? []
    );
  }
  return payload.data;
}

export async function acceptFamilyInvite(
  accessToken: string,
  token: string
): Promise<FamilyResponse> {
  return request<FamilyResponse>(`/invites/${token}/accept`, accessToken, {
    method: "POST",
  });
}

export async function rejectFamilyInvite(
  accessToken: string,
  token: string
): Promise<void> {
  await request<void>(`/invites/${token}/reject`, accessToken, {
    method: "POST",
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
