import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  analyzeMealPhoto,
  createMealLog,
  listMealLogs,
  getDailyMealSummary,
  deleteMealLog,
} from "./meals";

describe("meals service", () => {
  const fakeToken = "mock-jwt-token";

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("analyzeMealPhoto sends multipart form data and returns analyzed dish", async () => {
    const mockResponse = {
      success: true,
      data: {
        photoKey: "test-photo-key",
        photoUrl: "/api/v1/meals/photo/test-photo-key",
        dishName: "Frango com Salada",
        confidence: "HIGH",
        totalCalories: 380,
        proteins: 35,
        carbohydrates: 12,
        fats: 8,
        items: [{ name: "Peito de Frango", estimatedGrams: 150, calories: 240 }],
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const file = new File(["fake-image-bytes"], "lunch.jpg", { type: "image/jpeg" });
    const result = await analyzeMealPhoto(fakeToken, file, "LUNCH");

    expect(result.dishName).toBe("Frango com Salada");
    expect(result.totalCalories).toBe(380);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/meals/analyze-photo"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: `Bearer ${fakeToken}`,
        }),
      })
    );
  });

  it("createMealLog posts JSON payload and returns saved meal log", async () => {
    const mockLog = {
      id: "meal-123",
      userId: "user-1",
      mealType: "LUNCH",
      dishName: "Arroz e Frango",
      totalCalories: 450,
      proteins: 30,
      carbohydrates: 50,
      fats: 10,
      items: [],
      consumedAt: "2026-11-23T12:00:00Z",
      createdAt: "2026-11-23T12:00:00Z",
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockLog }),
    });

    const result = await createMealLog(fakeToken, {
      mealType: "LUNCH",
      dishName: "Arroz e Frango",
      totalCalories: 450,
    });

    expect(result.id).toBe("meal-123");
    expect(result.dishName).toBe("Arroz e Frango");
  });

  it("getDailyMealSummary fetches daily summary for given date", async () => {
    const mockSummary = {
      date: "2026-11-23",
      mealsCount: 2,
      totalCalories: 850,
      totalProteins: 60,
      totalCarbohydrates: 80,
      totalFats: 20,
      totalFibers: 12,
      totalSodium: 900,
      meals: [],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockSummary }),
    });

    const result = await getDailyMealSummary(fakeToken, "2026-11-23");
    expect(result.mealsCount).toBe(2);
    expect(result.totalCalories).toBe(850);
  });

  it("deleteMealLog issues DELETE request", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: null }),
    });

    await expect(deleteMealLog(fakeToken, "meal-123")).resolves.not.toThrow();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/meals/meal-123"),
      expect.objectContaining({ method: "DELETE" })
    );
  });
});
