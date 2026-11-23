import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createFamilyWeeklyGoal,
  createScheduleActivity,
  deleteScheduleActivity,
  listFamilyWeeklyGoals,
  listScheduleActivities,
  toggleScheduleActivityCompletion,
  updateScheduleActivity
} from "@/services/schedule";
import type {
  FamilyWeeklyGoalResponse,
  ScheduleActivityResponse
} from "@/types/api";

describe("schedule service", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("lists schedule activities with filters", async () => {
    mockFetch([sampleActivity()]);

    const res = await listScheduleActivities("token", "family-1", "SEG", "2026-11-20");

    expect(res).toHaveLength(1);
    expect(res[0].title).toBe("Trabalho — manhã");
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/schedule/activities?familyId=family-1&dayOfWeek=SEG&date=2026-11-20",
      {
        method: "GET",
        headers: { Authorization: "Bearer token" },
        body: undefined
      }
    );
  });

  it("creates a schedule activity", async () => {
    mockFetch(sampleActivity());

    await createScheduleActivity("token", {
      familyId: "family-1",
      dayOfWeek: "SEG",
      startTime: "08:30",
      endTime: "12:00",
      title: "Trabalho — manhã",
      category: "TRABALHO"
    });

    expect(fetch).toHaveBeenCalledWith("http://localhost:8080/api/v1/schedule/activities", {
      method: "POST",
      headers: {
        Authorization: "Bearer token",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        familyId: "family-1",
        dayOfWeek: "SEG",
        startTime: "08:30",
        endTime: "12:00",
        title: "Trabalho — manhã",
        category: "TRABALHO"
      })
    });
  });

  it("toggles activity completion", async () => {
    mockFetch({ completed: true });

    const res = await toggleScheduleActivityCompletion("token", "act-1", "2026-11-20");

    expect(res.completed).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/v1/schedule/activities/act-1/toggle?date=2026-11-20",
      {
        method: "POST",
        headers: { Authorization: "Bearer token" },
        body: undefined
      }
    );
  });

  it("lists and creates weekly goals", async () => {
    mockFetch([sampleGoal()]);

    const res = await listFamilyWeeklyGoals("token", "family-1");
    expect(res).toHaveLength(1);
    expect(res[0].title).toBe("Academia");

    mockFetch(sampleGoal());
    await createFamilyWeeklyGoal("token", {
      familyId: "family-1",
      title: "Academia",
      goalTag: "academia",
      targetCount: 3,
      unit: "vezes"
    });

    expect(fetch).toHaveBeenCalledWith("http://localhost:8080/api/v1/schedule/goals", {
      method: "POST",
      headers: {
        Authorization: "Bearer token",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        familyId: "family-1",
        title: "Academia",
        goalTag: "academia",
        targetCount: 3,
        unit: "vezes"
      })
    });
  });

  function mockFetch(data: unknown) {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data, message: "OK" })
    });
  }

  function sampleActivity(): ScheduleActivityResponse {
    return {
      id: "act-1",
      familyId: "family-1",
      dayOfWeek: "SEG",
      startTime: "08:30",
      endTime: "12:00",
      title: "Trabalho — manhã",
      category: "TRABALHO",
      notes: "Foco",
      goalTag: null,
      recipeId: null,
      recipeName: null,
      assignedToUserId: null,
      assignedToUserName: null,
      orderIndex: 0,
      completedToday: false
    };
  }

  function sampleGoal(): FamilyWeeklyGoalResponse {
    return {
      id: "goal-1",
      familyId: "family-1",
      title: "Academia",
      goalTag: "academia",
      targetCount: 3,
      unit: "vezes",
      currentCount: 1,
      progressPercent: 33.3
    };
  }
});
