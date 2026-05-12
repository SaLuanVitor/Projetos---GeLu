import { ApiClientError } from "@/services/auth";

type TranslateError = (key: string) => string;

const MESSAGE_KEYS = new Map<string, string>([
  ["invalid email or password", "invalidCredentials"],
  ["email already registered", "emailAlreadyRegistered"],
  ["invalid refresh token", "invalidRefreshToken"],
  ["invalid password reset token", "invalidPasswordResetToken"],
  ["authentication required", "authenticationRequired"],
  ["invalid request data", "invalidRequestData"],
  ["unexpected server error", "requestError"]
]);

const CODE_KEYS = new Map<string, string>([
  ["CONFLICT", "emailAlreadyRegistered"],
  ["VALIDATION_ERROR", "invalidRequestData"],
  ["NETWORK_ERROR", "networkError"],
  ["INVALID_API_RESPONSE", "invalidApiResponse"],
  ["UNAUTHORIZED", "authenticationRequired"],
  ["REQUEST_ERROR", "requestError"],
  ["INTERNAL_ERROR", "requestError"]
]);

export function getLocalizedApiError(error: unknown, translate: TranslateError, fallback: string) {
  if (!(error instanceof ApiClientError)) {
    return fallback;
  }

  const messageKey = MESSAGE_KEYS.get(error.message.trim().toLowerCase());
  if (messageKey) {
    return translate(messageKey);
  }

  const codeKey = CODE_KEYS.get(error.code.trim().toUpperCase());
  if (codeKey) {
    return translate(codeKey);
  }

  return fallback;
}
