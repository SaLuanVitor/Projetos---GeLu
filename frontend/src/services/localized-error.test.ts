import { describe, expect, it } from "vitest";
import { ApiClientError } from "@/services/auth";
import { getLocalizedApiError } from "@/services/localized-error";

const ptBrMessages: Record<string, string> = {
  authenticationRequired: "Sua sessao expirou. Entre novamente.",
  emailAlreadyRegistered: "Este e-mail ja esta cadastrado.",
  invalidApiResponse: "A API respondeu em um formato inesperado.",
  invalidCredentials: "E-mail ou senha invalidos.",
  invalidPasswordResetToken: "Token de redefinicao invalido ou expirado.",
  invalidRefreshToken: "Sua sessao expirou. Entre novamente.",
  invalidRequestData: "Confira os dados informados.",
  networkError: "Nao foi possivel conectar ao backend.",
  requestError: "Nao foi possivel concluir a operacao."
};

const enMessages: Record<string, string> = {
  authenticationRequired: "Your session expired. Sign in again.",
  emailAlreadyRegistered: "This email is already registered.",
  invalidApiResponse: "The API returned an unexpected format.",
  invalidCredentials: "Invalid email or password.",
  invalidPasswordResetToken: "Invalid or expired password reset token.",
  invalidRefreshToken: "Your session expired. Sign in again.",
  invalidRequestData: "Check the submitted data.",
  networkError: "Unable to connect to the backend.",
  requestError: "Unable to complete the request."
};

describe("getLocalizedApiError", () => {
  it.each([
    [new ApiClientError("Authentication required", "UNAUTHORIZED"), "authenticationRequired"],
    [new ApiClientError("Email already registered", "CONFLICT"), "emailAlreadyRegistered"],
    [new ApiClientError("Invalid request data", "VALIDATION_ERROR"), "invalidRequestData"],
    [new ApiClientError("network", "NETWORK_ERROR"), "networkError"],
    [new ApiClientError("bad json", "INVALID_API_RESPONSE"), "invalidApiResponse"]
  ])("localizes common API errors", (error, expectedKey) => {
    expect(getLocalizedApiError(error, translate(ptBrMessages), "fallback")).toBe(
      ptBrMessages[expectedKey]
    );
  });

  it("localizes invalid credentials in Portuguese and English", () => {
    const error = new ApiClientError("Invalid email or password", "UNAUTHORIZED");

    expect(getLocalizedApiError(error, translate(ptBrMessages), "fallback")).toBe(
      "E-mail ou senha invalidos."
    );
    expect(getLocalizedApiError(error, translate(enMessages), "fallback")).toBe(
      "Invalid email or password."
    );
  });

  it("uses the fallback for unknown errors", () => {
    expect(getLocalizedApiError(new Error("boom"), translate(ptBrMessages), "fallback")).toBe(
      "fallback"
    );
    expect(
      getLocalizedApiError(
        new ApiClientError("Unexpected custom backend text", "CUSTOM_ERROR"),
        translate(ptBrMessages),
        "fallback"
      )
    ).toBe("fallback");
  });
});

function translate(messages: Record<string, string>) {
  return (key: string) => messages[key] ?? key;
}
