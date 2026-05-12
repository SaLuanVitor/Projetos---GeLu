import type {
  ApiErrorResponse,
  ApiResponse,
  AuthTokenResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  LoginRequest,
  RefreshTokenRequest,
  RefreshTokenResponse,
  RegisterRequest,
  RegisterResponse,
  ResetPasswordRequest,
  ResetPasswordResponse
} from "@/types/api";
import {
  clearSession,
  loadSession,
  shouldRefreshSession,
  updateSessionTokens,
  type StoredSession
} from "@/services/session";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";
let refreshSessionPromise: Promise<StoredSession | null> | null = null;

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details: string[] = []
  ) {
    super(message);
  }
}

export function isAuthenticationError(error: unknown) {
  if (!(error instanceof ApiClientError)) {
    return false;
  }

  const code = error.code.toUpperCase();
  const message = error.message.toLowerCase();

  return (
    code.includes("AUTH") ||
    code.includes("UNAUTHORIZED") ||
    message.includes("authentication required") ||
    message.includes("unauthorized")
  );
}

export function handleInvalidSession(error: unknown, redirectToLogin: () => void): boolean {
  if (!isAuthenticationError(error)) {
    return false;
  }

  clearSession();
  redirectToLogin();
  if (
    typeof window !== "undefined" &&
    window.location?.assign &&
    window.location.pathname !== "/login"
  ) {
    window.location.assign("/login");
  }
  return true;
}

export async function registerUser(request: RegisterRequest): Promise<RegisterResponse> {
  return post<RegisterResponse>("/auth/register", request);
}

export async function loginUser(request: LoginRequest): Promise<AuthTokenResponse> {
  return post<AuthTokenResponse>("/auth/login", request);
}

export async function refreshAuthToken(
  request: RefreshTokenRequest
): Promise<RefreshTokenResponse> {
  return post<RefreshTokenResponse>("/auth/refresh", request);
}

export async function logoutUser(request: RefreshTokenRequest): Promise<{ revoked: boolean }> {
  return post<{ revoked: boolean }>("/auth/logout", request);
}

export async function getValidSession(forceRefresh = false): Promise<StoredSession | null> {
  const session = loadSession();
  if (!session) {
    return null;
  }

  if (!forceRefresh && !shouldRefreshSession(session)) {
    return session;
  }

  if (refreshSessionPromise) {
    return refreshSessionPromise;
  }

  refreshSessionPromise = refreshSession(session);
  try {
    return await refreshSessionPromise;
  } finally {
    refreshSessionPromise = null;
  }
}

async function refreshSession(session: StoredSession): Promise<StoredSession | null> {
  try {
    const tokens = await refreshAuthToken({ refreshToken: session.refreshToken });
    return updateSessionTokens(session, tokens);
  } catch {
    clearSession();
    return null;
  }
}

export async function forgotPassword(
  request: ForgotPasswordRequest
): Promise<ForgotPasswordResponse> {
  return post<ForgotPasswordResponse>("/auth/forgot-password", request);
}

export async function resetPassword(request: ResetPasswordRequest): Promise<ResetPasswordResponse> {
  return post<ResetPasswordResponse>("/auth/reset-password", request);
}

async function post<T>(path: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
  } catch {
    throw new ApiClientError(
      `Nao foi possivel conectar ao backend. Verifique se a API esta rodando em ${API_URL}.`,
      "NETWORK_ERROR",
      []
    );
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
    throw new ApiClientError(
      `A API respondeu sem o formato esperado. Confirme se ${API_URL} aponta para o backend Gelu - Menu.`,
      "INVALID_API_RESPONSE",
      []
    );
  }
}
