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

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details: string[] = []
  ) {
    super(message);
  }
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

export async function forgotPassword(
  request: ForgotPasswordRequest
): Promise<ForgotPasswordResponse> {
  return post<ForgotPasswordResponse>("/auth/forgot-password", request);
}

export async function resetPassword(request: ResetPasswordRequest): Promise<ResetPasswordResponse> {
  return post<ResetPasswordResponse>("/auth/reset-password", request);
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const payload = (await response.json()) as ApiResponse<T> | ApiErrorResponse;

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
