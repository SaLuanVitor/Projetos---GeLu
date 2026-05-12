import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiClientError } from "@/services/auth";
import {
  createWeightRecord,
  getProfile,
  listWeightHistory,
  updateProfile
} from "@/services/profile";

describe("profile service", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads the authenticated profile with a bearer token", async () => {
    mockFetch({ id: "user-id", name: "Luan", email: "luan@example.com" });

    const response = await getProfile("access-token");

    expect(response.email).toBe("luan@example.com");
    expectFetch("/profile/me", "GET", "access-token");
  });

  it("updates profile data", async () => {
    const body = {
      name: "Luan Vilar",
      birthDate: "1998-05-10",
      heightCm: 178.5,
      biologicalSex: "MASCULINO",
      goal: "Emagrecer",
      basalCalories: 1800,
      dailyCalorieGoal: 2200
    };
    mockFetch({ id: "user-id", email: "luan@example.com", ...body });

    const response = await updateProfile("access-token", body);

    expect(response.name).toBe("Luan Vilar");
    expectFetch("/profile/me", "PUT", "access-token", body);
  });

  it("lists weight history", async () => {
    mockFetch([
      {
        id: "weight-id",
        weightKg: 82.3,
        recordedAt: "2026-05-10T08:30:00",
        createdAt: "2026-05-10T08:31:00"
      }
    ]);

    const response = await listWeightHistory("access-token");

    expect(response).toHaveLength(1);
    expect(response[0].weightKg).toBe(82.3);
    expectFetch("/profile/weight-history", "GET", "access-token");
  });

  it("creates a weight record", async () => {
    const body = { weightKg: 82.3, recordedAt: "2026-05-10T08:30:00" };
    mockFetch({ id: "weight-id", ...body, createdAt: "2026-05-10T08:31:00" });

    const response = await createWeightRecord("access-token", body);

    expect(response.weightKg).toBe(82.3);
    expectFetch("/profile/weight-history", "POST", "access-token", body);
  });

  it("maps API errors to ApiClientError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
            details: []
          }
        })
      })
    );

    await expect(getProfile("invalid-token")).rejects.toEqual(
      new ApiClientError("Authentication required", "UNAUTHORIZED", [])
    );
  });

  it("maps empty unauthorized responses to authentication errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: vi.fn()
      })
    );

    await expect(listWeightHistory("expired-token")).rejects.toEqual(
      new ApiClientError("Authentication required", "UNAUTHORIZED", [])
    );
  });

  it("refreshes the session and retries once after unauthorized responses", async () => {
    vi.stubGlobal("window", {
      localStorage: createLocalStorageMock([
        [
          "gelu-menu-session",
          JSON.stringify({
            accessToken: "expired-access-token",
            refreshToken: "refresh-token",
            tokenType: "Bearer",
            expiresIn: 900,
            user: { id: "user-id", name: "Luan", email: "luan@example.com", active: true },
            updatedAt: new Date().toISOString()
          })
        ]
      ])
    });
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: vi.fn()
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: vi.fn().mockResolvedValue({
            success: true,
            data: {
              accessToken: "new-access-token",
              refreshToken: "new-refresh-token",
              tokenType: "Bearer",
              expiresIn: 900
            },
            message: "ok"
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: vi.fn().mockResolvedValue({
            success: true,
            data: { id: "user-id", name: "Luan", email: "luan@example.com" },
            message: "ok"
          })
        })
    );

    const response = await getProfile("expired-access-token");

    expect(response.email).toBe("luan@example.com");
    expect(fetch).toHaveBeenNthCalledWith(1, "http://localhost:8080/api/v1/profile/me", {
      method: "GET",
      headers: {
        Authorization: "Bearer expired-access-token"
      },
      body: undefined
    });
    expect(fetch).toHaveBeenNthCalledWith(2, "http://localhost:8080/api/v1/auth/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ refreshToken: "refresh-token" })
    });
    expect(fetch).toHaveBeenNthCalledWith(3, "http://localhost:8080/api/v1/profile/me", {
      method: "GET",
      headers: {
        Authorization: "Bearer new-access-token"
      },
      body: undefined
    });
  });

  it("propagates authentication errors when refresh fails after unauthorized responses", async () => {
    vi.stubGlobal("window", {
      localStorage: createLocalStorageMock([
        [
          "gelu-menu-session",
          JSON.stringify({
            accessToken: "expired-access-token",
            refreshToken: "refresh-token",
            tokenType: "Bearer",
            expiresIn: 900,
            user: { id: "user-id", name: "Luan", email: "luan@example.com", active: true },
            updatedAt: new Date().toISOString()
          })
        ]
      ])
    });
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
          json: vi.fn()
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: vi.fn().mockResolvedValue({
            success: false,
            error: {
              code: "UNAUTHORIZED",
              message: "Invalid refresh token",
              details: []
            }
          })
        })
    );

    await expect(getProfile("expired-access-token")).rejects.toEqual(
      new ApiClientError("Authentication required", "UNAUTHORIZED", [])
    );
    expect(window.localStorage.getItem("gelu-menu-session")).toBeNull();
  });
});

function mockFetch(data: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        success: true,
        data,
        message: "ok"
      })
    })
  );
}

function expectFetch(path: string, method: string, accessToken: string, body?: unknown) {
  expect(fetch).toHaveBeenCalledWith(`http://localhost:8080/api/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(body ? { "Content-Type": "application/json" } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
}

function createLocalStorageMock(initialEntries: [string, string][] = []): Storage {
  const storage = new Map<string, string>(initialEntries);

  return {
    get length() {
      return storage.size;
    },
    clear: vi.fn(() => storage.clear()),
    getItem: vi.fn((key: string) => storage.get(key) ?? null),
    key: vi.fn((index: number) => Array.from(storage.keys())[index] ?? null),
    removeItem: vi.fn((key: string) => storage.delete(key)),
    setItem: vi.fn((key: string, value: string) => storage.set(key, value))
  };
}
