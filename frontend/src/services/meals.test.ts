import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  analyzeMealPhoto,
  createMealLog,
  listMealLogs,
  getDailyMealSummary,
  deleteMealLog,
  parseMealText,
  quickCheckinMeal,
  getDailyMealChecklist,
  getHabitsInsights,
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

  it("parseMealText parses natural language Brazilian food expressions with AI", async () => {
    const mockParsed = {
      dishName: "Arroz com Feijão e Bife",
      totalCalories: 520,
      proteins: 38,
      carbohydrates: 62,
      fats: 12,
      fibers: 6,
      sodium: 480,
      items: [
        { name: "Arroz branco", estimatedGrams: 100, calories: 130 },
        { name: "Feijão carioca", estimatedGrams: 140, calories: 110 },
      ],
      aiNotes: "Ótimo equilíbrio entre carboidratos e ferro.",
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockParsed }),
    });

    const result = await parseMealText(fakeToken, {
      text: "4 colheres de arroz e 1 concha de feijão",
      mealType: "LUNCH",
    });

    expect(result.dishName).toBe("Arroz com Feijão e Bife");
    expect(result.totalCalories).toBe(520);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/meals/parse-text"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          text: "4 colheres de arroz e 1 concha de feijão",
          mealType: "LUNCH",
        }),
      })
    );
  });

  it("quickCheckinMeal performs 1-click confirmation or skip", async () => {
    const mockCheckinResult = {
      id: "meal-999",
      userId: "user-1",
      dietMealId: "diet-meal-1",
      mealType: "LUNCH",
      dishName: "Almoço Planejado",
      totalCalories: 600,
      status: "PLANNED_CONSUMED",
      inputMethod: "ONE_CLICK",
      consumedAt: "2026-11-23T12:30:00Z",
      createdAt: "2026-11-23T12:30:00Z",
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockCheckinResult }),
    });

    const result = await quickCheckinMeal(fakeToken, {
      dietMealId: "diet-meal-1",
      status: "PLANNED_CONSUMED",
    });

    expect(result.id).toBe("meal-999");
    expect(result.status).toBe("PLANNED_CONSUMED");
  });

  it("getDailyMealChecklist retrieves planned checklist with consumption statuses", async () => {
    const mockChecklist = [
      {
        dietMealId: "dm-1",
        mealName: "Café da Manhã",
        mealTime: "08:00:00",
        weekDay: "SEG",
        orderIndex: 1,
        plannedCalories: 350,
        plannedRecipes: ["Ovos Mexidos", "Torrada"],
        status: "PLANNED_CONSUMED",
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockChecklist }),
    });

    const result = await getDailyMealChecklist(fakeToken, "2026-11-23");
    expect(result).toHaveLength(1);
    expect(result[0].mealName).toBe("Café da Manhã");
    expect(result[0].status).toBe("PLANNED_CONSUMED");
  });

  it("getHabitsInsights returns adherence rate, staples and AI coaching tip", async () => {
    const mockHabits = {
      adherenceRate: 85.5,
      totalPlannedMeals: 40,
      plannedConsumedCount: 34,
      customConsumedCount: 4,
      skippedCount: 2,
      stapleMeals: [
        {
          dishName: "Frango com Batata Doce",
          mealType: "LUNCH",
          timesLogged: 12,
          averageCalories: 450,
          averageProteins: 42,
        },
      ],
      aiCoachingTip: "Excelente consistência nas refeições principais!",
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockHabits }),
    });

    const result = await getHabitsInsights(fakeToken);
    expect(result.adherenceRate).toBe(85.5);
    expect(result.stapleMeals[0].dishName).toBe("Frango com Batata Doce");
    expect(result.aiCoachingTip).toContain("Excelente");
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
