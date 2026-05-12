import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiClientError } from "@/services/auth";
import { createRecipe, getRecipe, listRecipes, updateRecipe } from "@/services/recipes";

describe("recipes service", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lists recipes with filters and bearer token", async () => {
    mockFetch([recipe()]);

    const response = await listRecipes("access-token", {
      query: "tapioca",
      ingredient: "goma",
      category: "Cafe",
      maxPrepTimeMinutes: "30",
      maxCalories: "400"
    });

    expect(response[0].name).toBe("Tapioca");
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/recipes?query=tapioca&ingredient=goma&category=Cafe&maxPrepTimeMinutes=30&maxCalories=400",
      {
        method: "GET",
        headers: { Authorization: "Bearer access-token" },
        body: undefined
      }
    );
  });

  it("creates and updates recipes", async () => {
    mockFetch(recipe("Crepioca"));
    const body = request("Crepioca");

    await createRecipe("access-token", body);
    await updateRecipe("access-token", "recipe-id", body);

    expect(fetch).toHaveBeenNthCalledWith(1, "http://localhost:8080/api/v1/recipes", {
      method: "POST",
      headers: {
        Authorization: "Bearer access-token",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    expect(fetch).toHaveBeenNthCalledWith(2, "http://localhost:8080/api/v1/recipes/recipe-id", {
      method: "PUT",
      headers: {
        Authorization: "Bearer access-token",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
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
            message: "Recipe not found",
            details: []
          }
        })
      })
    );

    await expect(getRecipe("access-token", "missing")).rejects.toEqual(
      new ApiClientError("Recipe not found", "NOT_FOUND", [])
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
            data: [recipe()],
            message: "ok"
          })
        })
    );

    const response = await listRecipes("expired-access-token");

    expect(response).toHaveLength(1);
    expect(fetch).toHaveBeenNthCalledWith(3, "http://localhost:8080/api/v1/recipes", {
      method: "GET",
      headers: { Authorization: "Bearer new-access-token" },
      body: undefined
    });
  });
});

function recipe(name = "Tapioca") {
  return {
    id: "recipe-id",
    name,
    description: "Receita simples",
    category: "Cafe",
    prepTimeMinutes: 20,
    estimatedCalories: 320,
    servings: 2,
    videoUrl: null,
    ingredients: [
      { id: "ingredient-id", position: 1, name: "Goma", quantity: "2", unit: "colheres" }
    ],
    steps: [{ id: "step-id", position: 1, instruction: "Misture tudo." }],
    createdAt: "2026-05-10T08:30:00",
    updatedAt: "2026-05-10T08:30:00"
  };
}

function request(name: string) {
  return {
    name,
    description: "Receita simples",
    category: "Cafe",
    prepTimeMinutes: 20,
    estimatedCalories: 320,
    servings: 2,
    videoUrl: null,
    ingredients: [{ name: "Goma", quantity: "2", unit: "colheres" }],
    steps: [{ instruction: "Misture tudo." }]
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
