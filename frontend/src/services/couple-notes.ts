import { ApiClientError, getValidSession } from "@/services/auth";
import type {
  ApiErrorResponse,
  ApiResponse,
  CoupleNoteResponse,
  CreateCoupleNoteRequest
} from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

export async function listCoupleNotes(
  accessToken: string,
  familyId: string,
  activeOnly = false
): Promise<CoupleNoteResponse[]> {
  const query = activeOnly ? `?familyId=${familyId}&activeOnly=true` : `?familyId=${familyId}`;
  return request<CoupleNoteResponse[]>(`/couple-notes${query}`, accessToken);
}

export async function createCoupleNote(
  accessToken: string,
  body: CreateCoupleNoteRequest
): Promise<CoupleNoteResponse> {
  return request<CoupleNoteResponse>("/couple-notes", accessToken, { method: "POST", body });
}

export async function acknowledgeCoupleNote(
  accessToken: string,
  id: string
): Promise<CoupleNoteResponse> {
  return request<CoupleNoteResponse>(`/couple-notes/${id}/acknowledge`, accessToken, {
    method: "POST"
  });
}

export async function resolveCoupleNote(
  accessToken: string,
  id: string,
  resolved = true
): Promise<CoupleNoteResponse> {
  return request<CoupleNoteResponse>(`/couple-notes/${id}/resolve?resolved=${resolved}`, accessToken, {
    method: "PUT"
  });
}

export async function deleteCoupleNote(accessToken: string, id: string): Promise<void> {
  await request<void>(`/couple-notes/${id}`, accessToken, { method: "DELETE" });
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
