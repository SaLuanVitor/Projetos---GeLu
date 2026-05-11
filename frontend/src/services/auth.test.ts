import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ApiClientError,
  forgotPassword,
  loginUser,
  refreshAuthToken,
  registerUser,
  resetPassword
} from "@/services/auth";

const user = {
  id: "user-id",
  name: "Luan",
  email: "luan@example.com",
  active: true
};

describe("auth service", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("registers a user through the auth API", async () => {
    mockFetch({ id: "user-id", name: "Luan", email: "luan@example.com", active: true }, 201);

    const response = await registerUser({
      name: "Luan",
      email: "luan@example.com",
      password: "strong-password"
    });

    expect(response).toEqual(user);
    expectFetch("/auth/register", {
      name: "Luan",
      email: "luan@example.com",
      password: "strong-password"
    });
  });

  it("logs in a user and returns tokens", async () => {
    mockFetch({
      accessToken: "access-token",
      refreshToken: "refresh-token",
      tokenType: "Bearer",
      expiresIn: 900,
      user
    });

    const response = await loginUser({
      email: "luan@example.com",
      password: "strong-password"
    });

    expect(response.accessToken).toBe("access-token");
    expect(response.refreshToken).toBe("refresh-token");
    expect(response.user.email).toBe("luan@example.com");
    expectFetch("/auth/login", {
      email: "luan@example.com",
      password: "strong-password"
    });
  });

  it("refreshes auth tokens", async () => {
    mockFetch({
      accessToken: "new-access-token",
      refreshToken: "new-refresh-token",
      tokenType: "Bearer",
      expiresIn: 900
    });

    const response = await refreshAuthToken({ refreshToken: "refresh-token" });

    expect(response.accessToken).toBe("new-access-token");
    expect(response.refreshToken).toBe("new-refresh-token");
    expectFetch("/auth/refresh", { refreshToken: "refresh-token" });
  });

  it("requests a password reset", async () => {
    mockFetch({ accepted: true, resetToken: "dev-reset-token" });

    const response = await forgotPassword({ email: "luan@example.com" });

    expect(response.accepted).toBe(true);
    expect(response.resetToken).toBe("dev-reset-token");
    expectFetch("/auth/forgot-password", { email: "luan@example.com" });
  });

  it("resets a password", async () => {
    mockFetch({ reset: true });

    const response = await resetPassword({
      token: "dev-reset-token",
      newPassword: "new-strong-password"
    });

    expect(response.reset).toBe(true);
    expectFetch("/auth/reset-password", {
      token: "dev-reset-token",
      newPassword: "new-strong-password"
    });
  });

  it("maps API error envelopes to ApiClientError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Invalid email or password",
            details: ["email"]
          }
        })
      })
    );

    await expect(
      loginUser({ email: "luan@example.com", password: "wrong-password" })
    ).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      message: "Invalid email or password",
      details: ["email"]
    });
  });

  it("uses fallback error metadata when the payload has no error body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({ success: false })
      })
    );

    await expect(
      loginUser({ email: "luan@example.com", password: "wrong-password" })
    ).rejects.toEqual(
      new ApiClientError("Nao foi possivel concluir a operacao.", "REQUEST_ERROR", [])
    );
  });
});

function mockFetch(data: unknown, status = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      json: vi.fn().mockResolvedValue({
        success: true,
        data,
        message: "ok"
      })
    })
  );
}

function expectFetch(path: string, body: unknown) {
  expect(fetch).toHaveBeenCalledWith(`http://localhost:8080/api/v1${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}
