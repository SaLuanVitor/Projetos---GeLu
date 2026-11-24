import type { ApiResponse, ImportResultResponse } from "@/types/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

/**
 * Baixa o modelo oficial de planilha Excel (.xlsx) para o módulo informado
 */
export async function downloadExcelTemplate(module: string, token?: string): Promise<void> {
  const url = `${API_BASE}/imports/template/${module.toLowerCase()}`;
  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error("Não foi possível baixar o modelo de planilha");
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download = `modelo_${module.toLowerCase()}_gelu.xlsx`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(downloadUrl);
  document.body.removeChild(a);
}

/**
 * Valida (dryRun=true) ou Importa (dryRun=false) uma planilha Excel/CSV
 */
export async function importSpreadsheet(
  module: string,
  file: File,
  dryRun: boolean,
  token: string,
  familyId?: string
): Promise<ImportResultResponse> {
  const query = new URLSearchParams({ dryRun: String(dryRun) });
  if (familyId) {
    query.set("familyId", familyId);
  }

  const url = `${API_BASE}/imports/${module.toLowerCase()}?${query.toString()}`;
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const body = (await response.json()) as ApiResponse<ImportResultResponse>;
  if (!response.ok || !body.success) {
    const errorMsg = (body as any)?.error?.message || body.message || "Erro ao processar planilha";
    throw new Error(errorMsg);
  }

  return body.data;
}
