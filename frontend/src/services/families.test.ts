import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiClientError } from "@/services/auth";
import {
  addFamilyMember,
  createFamily,
  deleteFamily,
  getFamily,
  listFamilies,
  removeFamilyMember,
  updateFamily
} from "@/services/families";

describe("families service", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lists families with bearer token", async () => {
    mockFetch([family()]);

    const response = await listFamilies("access-token");

    expect(response[0].name).toBe("Minha Familia");
    expect(fetch).toHaveBeenCalledWith("http://localhost:8080/api/v1/families", {
      method: "GET",
      headers: { Authorization: "Bearer access-token" },
      body: undefined
    });
  });

  it("gets family by id", async () => {
    mockFetch(family());

    const response = await getFamily("access-token", "family-id");

    expect(response.name).toBe("Minha Familia");
    expect(fetch).toHaveBeenCalledWith("http://localhost:8080/api/v1/families/family-id", {
      method: "GET",
      headers: { Authorization: "Bearer access-token" },
      body: undefined
    });
  });

  it("creates a family", async () => {
    mockFetch(family("Nova Familia"));

    await createFamily("access-token", { name: "Nova Familia" });

    expect(fetch).toHaveBeenCalledWith("http://localhost:8080/api/v1/families", {
      method: "POST",
      headers: {
        Authorization: "Bearer access-token",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name: "Nova Familia" })
    });
  });

  it("updates a family", async () => {
    mockFetch(family("Atualizada"));

    await updateFamily("access-token", "family-id", { name: "Atualizada" });

    expect(fetch).toHaveBeenCalledWith("http://localhost:8080/api/v1/families/family-id", {
      method: "PUT",
      headers: {
        Authorization: "Bearer access-token",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name: "Atualizada" })
    });
  });

  it("deletes a family", async () => {
    mockFetch(null);

    await deleteFamily("access-token", "family-id");

    expect(fetch).toHaveBeenCalledWith("http://localhost:8080/api/v1/families/family-id", {
      method: "DELETE",
      headers: { Authorization: "Bearer access-token" },
      body: undefined
    });
  });

  it("adds a member to a family", async () => {
    mockFetch(family());

    await addFamilyMember("access-token", "family-id", {
      userId: "new-user-id",
      role: "MEMBER"
    });

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/families/family-id/members",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer access-token",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ userId: "new-user-id", role: "MEMBER" })
      }
    );
  });

  it("removes a member from a family", async () => {
    mockFetch(family());

    await removeFamilyMember("access-token", "family-id", "member-user-id");

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/families/family-id/members/member-user-id",
      {
        method: "DELETE",
        headers: { Authorization: "Bearer access-token" },
        body: undefined
      }
    );
  });

  it("maps API errors to ApiClientError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: vi.fn().mockResolvedValue({
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Family not found",
            details: []
          }
        })
      })
    );

    await expect(getFamily("access-token", "missing")).rejects.toEqual(
      new ApiClientError("Family not found", "NOT_FOUND", [])
    );
  });

  it("retries once after unauthorized responses", async () => {
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
        .mockResolvedValueOnce({ ok: false, status: 401, json: vi.fn() })
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
            data: [family()],
            message: "ok"
          })
        })
    );

    const response = await listFamilies("expired-access-token");

    expect(response).toHaveLength(1);
    expect(fetch).toHaveBeenNthCalledWith(3, "http://localhost:8080/api/v1/families", {
      method: "GET",
      headers: { Authorization: "Bearer new-access-token" },
      body: undefined
    });
  });
});

function family(name = "Minha Familia") {
  return {
    id: "family-id",
    name,
    ownerId: "owner-id",
    members: [
      {
        id: "member-id",
        userId: "owner-id",
        userName: "Luan",
        userEmail: "luan@test.com",
        role: "OWNER",
        joinedAt: "2026-05-10T08:30:00"
      }
    ],
    createdAt: "2026-05-10T08:30:00",
    updatedAt: "2026-05-10T08:30:00"
  };
}

function mockFetch(data: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ success: true, data, message: "ok" })
    })
  );
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
