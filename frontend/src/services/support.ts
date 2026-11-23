import type {
  CreateSupportTicketRequest,
  PublicSupportSettingsResponse,
  SupportTicketResponse
} from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

export async function getPublicSupportSettings(): Promise<PublicSupportSettingsResponse> {
  const res = await fetch(`${API_URL}/support/settings`, { method: "GET" });
  if (!res.ok) {
    throw new Error("Falha ao carregar configurações de suporte");
  }
  const json = await res.json();
  return json.data;
}

export async function getMySupportTickets(token: string): Promise<SupportTicketResponse[]> {
  const res = await fetch(`${API_URL}/support/my-tickets`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) {
    throw new Error("Falha ao carregar meus chamados");
  }
  const json = await res.json();
  return json.data;
}

export async function createSupportTicket(
  token: string,
  payload: CreateSupportTicketRequest
): Promise<SupportTicketResponse> {
  const res = await fetch(`${API_URL}/support/tickets`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    throw new Error("Falha ao abrir chamado de suporte");
  }
  const json = await res.json();
  return json.data;
}
