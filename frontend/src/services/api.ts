import type { AiAgentDescriptor, ApiResponse } from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

export async function getAiAgents(): Promise<AiAgentDescriptor[]> {
  const response = await fetch(`${API_URL}/ai/agents`, {
    next: { revalidate: 30 }
  });

  if (!response.ok) {
    throw new Error("Unable to load AI agents");
  }

  const payload = (await response.json()) as ApiResponse<AiAgentDescriptor[]>;
  return payload.data;
}
