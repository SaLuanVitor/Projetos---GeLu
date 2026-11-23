import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  addDietMeal,
  copyWeeklyDiet,
  deleteDietMeal,
  getOrCreateWeeklyDiet,
  updateDietMeal,
} from "./diet";

describe("Diet Service", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should get or create weekly diet", async () => {
    const mockDiet = {
      id: "diet-1",
      familyId: "fam-1",
      userId: "user-1",
      title: "Cardápio Semanal",
      weekStart: "2026-11-16",
      weekEnd: "2026-11-22",
      meals: [],
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockDiet, message: "OK" }),
    } as Response);

    const result = await getOrCreateWeeklyDiet("token", "fam-1", "2026-11-16");
    expect(result.id).toBe("diet-1");
    expect(result.title).toBe("Cardápio Semanal");
  });

  it("should add a diet meal", async () => {
    const mockMeal = {
      id: "meal-1",
      dietId: "diet-1",
      weekDay: "SEG",
      mealName: "Almoço",
      mealTime: "12:30",
      orderIndex: 0,
      recipes: [],
      people: [],
      totalEstimatedCalories: 500,
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockMeal, message: "OK" }),
    } as Response);

    const result = await addDietMeal("token", "diet-1", {
      weekDay: "SEG",
      mealName: "Almoço",
    });

    expect(result.mealName).toBe("Almoço");
    expect(result.totalEstimatedCalories).toBe(500);
  });

  it("should update a diet meal", async () => {
    const mockUpdated = {
      id: "meal-1",
      dietId: "diet-1",
      weekDay: "SEG",
      mealName: "Almoço Leve",
      mealTime: "12:00",
      orderIndex: 0,
      recipes: [],
      people: [],
      totalEstimatedCalories: 400,
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockUpdated, message: "OK" }),
    } as Response);

    const result = await updateDietMeal("token", "meal-1", {
      weekDay: "SEG",
      mealName: "Almoço Leve",
    });

    expect(result.mealName).toBe("Almoço Leve");
  });

  it("should delete a diet meal", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, message: "Deleted" }),
    } as Response);

    await expect(deleteDietMeal("token", "meal-1")).resolves.toBeUndefined();
  });

  it("should copy weekly diet", async () => {
    const mockCopied = {
      id: "diet-2",
      familyId: "fam-1",
      userId: "user-1",
      title: "Cardápio Semanal Copiado",
      weekStart: "2026-11-23",
      weekEnd: "2026-11-29",
      meals: [],
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockCopied, message: "OK" }),
    } as Response);

    const result = await copyWeeklyDiet("token", "diet-1", "2026-11-23");
    expect(result.weekStart).toBe("2026-11-23");
  });
});
