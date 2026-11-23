import type {
  ApiResponse,
  CreateFamilySpaceItemRequest,
  FamilySpaceItemResponse,
} from "@/types/api";
import { getValidSession } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

export async function listFamilySpaceItems(
  token: string,
  familyId: string,
  category?: string
): Promise<FamilySpaceItemResponse[]> {
  const url = new URL(`${API_URL}/family-spaces`);
  url.searchParams.append("familyId", familyId);
  if (category && category !== "ALL") {
    url.searchParams.append("category", category);
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Falha ao carregar itens de Nosso Espaço");
  }

  const payload = (await response.json()) as ApiResponse<FamilySpaceItemResponse[]>;
  return payload.data ?? [];
}

export async function createFamilySpaceItem(
  token: string,
  request: CreateFamilySpaceItemRequest
): Promise<FamilySpaceItemResponse> {
  const response = await fetch(`${API_URL}/family-spaces`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.error?.message ?? "Falha ao criar item de Nosso Espaço");
  }

  const payload = (await response.json()) as ApiResponse<FamilySpaceItemResponse>;
  return payload.data;
}

export async function deleteFamilySpaceItem(
  token: string,
  itemId: string
): Promise<void> {
  const response = await fetch(`${API_URL}/family-spaces/${itemId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Falha ao excluir item de Nosso Espaço");
  }
}
