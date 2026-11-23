import type {
  ApiResponse,
  CopyWeeklyDietRequest,
  CreateDietMealRequest,
  DietMealResponse,
  UpdateDietMealRequest,
  WeeklyDietResponse,
} from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

export async function getOrCreateWeeklyDiet(
  accessToken: string,
  familyId?: string,
  weekStart?: string,
  personal?: boolean
): Promise<WeeklyDietResponse> {
  const params = new URLSearchParams();
  if (familyId) params.append("familyId", familyId);
  if (weekStart) params.append("weekStart", weekStart);
  if (personal) params.append("personal", "true");

  const query = params.toString() ? `?${params.toString()}` : "";
  const res = await fetch(`${API_URL}/weekly-diets${query}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to load weekly diet");
  }

  const json: ApiResponse<WeeklyDietResponse> = await res.json();
  return json.data;
}

export async function addDietMeal(
  accessToken: string,
  dietId: string,
  request: CreateDietMealRequest
): Promise<DietMealResponse> {
  const res = await fetch(`${API_URL}/weekly-diets/${dietId}/meals`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    throw new Error("Failed to add meal");
  }

  const json: ApiResponse<DietMealResponse> = await res.json();
  return json.data;
}

export async function updateDietMeal(
  accessToken: string,
  mealId: string,
  request: UpdateDietMealRequest
): Promise<DietMealResponse> {
  const res = await fetch(`${API_URL}/weekly-diets/meals/${mealId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    throw new Error("Failed to update meal");
  }

  const json: ApiResponse<DietMealResponse> = await res.json();
  return json.data;
}

export async function deleteDietMeal(
  accessToken: string,
  mealId: string
): Promise<void> {
  const res = await fetch(`${API_URL}/weekly-diets/meals/${mealId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to delete meal");
  }
}

export async function copyWeeklyDiet(
  accessToken: string,
  dietId: string,
  targetWeekStart: string
): Promise<WeeklyDietResponse> {
  const payload: CopyWeeklyDietRequest = { targetWeekStart };
  const res = await fetch(`${API_URL}/weekly-diets/${dietId}/copy`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("Failed to copy weekly diet");
  }

  const json: ApiResponse<WeeklyDietResponse> = await res.json();
  return json.data;
}
