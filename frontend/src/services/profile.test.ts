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
});

function mockFetch(data: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
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
