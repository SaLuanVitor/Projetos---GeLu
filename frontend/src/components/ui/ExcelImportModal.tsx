"use client";

import { useState, useRef } from "react";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/ActionButton";
import { useToast } from "@/components/ui/Toast";
import { downloadExcelTemplate, importSpreadsheet } from "@/services/imports";
import type { ImportResultResponse } from "@/types/api";
import {
  FileSpreadsheet,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  Sparkles,
  FileText,
  RotateCcw,
} from "lucide-react";

export interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  module: "workouts" | "meals" | "recipes" | "weekly_menu";
  moduleTitle: string;
  token?: string | null;
  familyId?: string;
  onSuccess: () => void;
}

export function ExcelImportModal({
  isOpen,
  onClose,
  module,
  moduleTitle,
  token,
  familyId,
  onSuccess,
}: ExcelImportModalProps) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResultResponse | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const resetState = () => {
    setFile(null);
    setResult(null);
    setValidating(false);
    setImporting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // Download do Modelo Oficial
  const handleDownloadTemplate = async () => {
    if (!token) {
      toast.showToast("Sessão não autenticada. Faça login novamente.", "error");
      return;
    }
    try {
      setDownloadingTemplate(true);
      await downloadExcelTemplate(module, token);
      toast.showToast("Modelo baixado com sucesso!", "success");
    } catch {
      toast.showToast("Não foi possível baixar o modelo.", "error");
    } finally {
      setDownloadingTemplate(false);
    }
  };

  // Processar arquivo selecionado e validar automaticamente (dry-run)
  const processFile = async (selectedFile: File) => {
    const name = selectedFile.name.toLowerCase();
    if (!name.endsWith(".xlsx") && !name.endsWith(".xls") && !name.endsWith(".csv")) {
      toast.showToast("Envie um arquivo Excel (.xlsx, .xls) ou CSV (.csv).", "warning");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.showToast("A planilha não pode ultrapassar o limite de 5 MB.", "warning");
      return;
    }

    if (!token) {
      toast.showToast("Sessão não autenticada. Faça login novamente.", "error");
      return;
    }

    setFile(selectedFile);
    setResult(null);
    setValidating(true);

    try {
      const data = await importSpreadsheet(module, selectedFile, true, token, familyId);
      setResult(data);
      if (data.valid) {
        toast.showToast(`Planilha validada: ${data.totalRows} linha(s) pronta(s).`, "success");
      } else {
        toast.showToast(`Encontrada(s) ${data.errorCount} inconsistência(s) na planilha.`, "error");
      }
    } catch (e: any) {
      toast.showToast(e.message || "Erro ao validar planilha", "error");
      resetState();
    } finally {
      setValidating(false);
    }
  };

  // Ação de confirmar e importar (dryRun=false)
  const handleConfirmImport = async () => {
    if (!file || !result || !result.valid || !token) return;
    setImporting(true);

    try {
      const data = await importSpreadsheet(module, file, false, token, familyId);
      toast.showToast(data.summaryMessage || "Importação concluída com sucesso!", "success");
      onSuccess();
      handleClose();
    } catch (e: any) {
      toast.showToast(e.message || "Erro ao persistir importação", "error");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      maxWidth="2xl"
      title={
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-orange-600" />
          <span>Importar {moduleTitle} em Lote</span>
        </div>
      }
      subtitle="Cadastre vários itens de uma só vez a partir de uma planilha Excel ou CSV."
    >
      <div className="space-y-5 py-1">
        {/* Bloco 1: Download do Modelo & Dica IA */}
        <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/20 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                1. Passo: Baixar o Modelo Padrão
              </h4>
              <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                Utilize o formato oficial do GeLu com colunas pré-formatadas e linhas de exemplo.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              disabled={downloadingTemplate}
              className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 border border-amber-300 dark:border-amber-800 shadow-sm hover:bg-amber-100/50 hover:rotate-1 hover:scale-[1.02] active:scale-[0.98] active:rotate-0 transition-transform cursor-pointer"
            >
              {downloadingTemplate ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-600" />
              ) : (
                <Download className="w-3.5 h-3.5 text-orange-600" />
              )}
              <span>Baixar Modelo .xlsx</span>
            </button>
          </div>

          <div className="pt-2 border-t border-amber-200/60 dark:border-amber-900/40 flex items-start gap-2 text-xs text-amber-900 dark:text-amber-300">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="font-semibold">Dica com IA:</strong> Você pode carregar este arquivo modelo no{" "}
              <strong>ChatGPT, Claude ou Gemini</strong> e solicitar:{" "}
              <em className="italic">
                &ldquo;Preencha esta planilha com meu plano de {moduleTitle.toLowerCase()} seguindo rigorosamente os cabeçalhos das colunas.&rdquo;
              </em>
            </p>
          </div>
        </div>

        {/* Bloco 2: Upload da Planilha */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
            2. Passo: Enviar Arquivo Preenchido
          </h4>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                processFile(e.target.files[0]);
              }
            }}
          />

          {!file ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  processFile(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                isDragOver
                  ? "border-orange-500 bg-orange-50/50 dark:bg-orange-950/20"
                  : "border-stone-200 dark:border-stone-800 hover:border-orange-400 bg-stone-50/50 dark:bg-stone-900/30"
              }`}
            >
              <UploadCloud className="w-8 h-8 text-stone-400 dark:text-stone-500 mb-2" />
              <p className="text-xs font-bold text-stone-800 dark:text-stone-200">
                Arraste seu arquivo Excel/CSV aqui ou clique para selecionar
              </p>
              <p className="text-[11px] text-stone-500 mt-1">
                Formatos aceitos: .xlsx, .xls ou .csv (até 5 MB)
              </p>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-xs font-bold text-stone-800 dark:text-stone-200">{file.name}</p>
                  <p className="text-[11px] text-stone-500">
                    {(file.size / 1024).toFixed(1)} KB &bull; {validating ? "Validando linhas..." : "Pronto"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={resetState}
                disabled={validating || importing}
                className="text-xs font-medium text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Trocar arquivo</span>
              </button>
            </div>
          )}
        </div>

        {/* Bloco 3: Feedback de Validação (Erros ou Sucesso) */}
        {validating && (
          <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 flex items-center justify-center gap-2 text-xs font-medium text-stone-600 dark:text-stone-400">
            <Loader2 className="w-4 h-4 animate-spin text-orange-600" />
            <span>Validando estrutura, colunas e consistência dos dados...</span>
          </div>
        )}

        {result && !validating && (
          <div className="space-y-3">
            {/* Caso de Erros Encontrados (Bloqueante) */}
            {!result.valid && (
              <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/70 dark:bg-rose-950/20 space-y-3">
                <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300">
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <div>
                    <h5 className="text-xs font-bold">
                      A planilha está fora do padrão ({result.errorCount} erro(s) identificado(s))
                    </h5>
                    <p className="text-[11px] text-rose-700/80 dark:text-rose-300/80">
                      Corrija as inconsistências indicadas abaixo no seu arquivo e envie novamente para concluir a importação.
                    </p>
                  </div>
                </div>

                <div className="max-h-48 overflow-y-auto border border-rose-200 dark:border-rose-900 rounded-lg bg-white dark:bg-stone-900">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-rose-100/60 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 font-bold sticky top-0">
                      <tr>
                        <th className="px-3 py-1.5">Linha</th>
                        <th className="px-3 py-1.5">Aba / Coluna</th>
                        <th className="px-3 py-1.5">Problema</th>
                        <th className="px-3 py-1.5">Valor Enviado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rose-100 dark:divide-rose-900/40 font-mono text-[11px]">
                      {result.errors.map((err, idx) => (
                        <tr key={idx} className="hover:bg-rose-50/50 dark:hover:bg-rose-950/30">
                          <td className="px-3 py-1.5 font-bold text-rose-700 dark:text-rose-400">
                            {err.rowNumber}
                          </td>
                          <td className="px-3 py-1.5 text-stone-700 dark:text-stone-300">
                            {err.column} {err.sheetName && <span className="text-[10px] text-stone-400">({err.sheetName})</span>}
                          </td>
                          <td className="px-3 py-1.5 text-rose-800 dark:text-rose-300">{err.message}</td>
                          <td className="px-3 py-1.5 text-stone-500 italic max-w-xs truncate">
                            {err.valueProvided || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Caso de Sucesso / 100% Válido (Preview) */}
            {result.valid && (
              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/70 dark:bg-emerald-950/20 space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <h5 className="text-xs font-bold">
                      Planilha 100% válida! {result.totalRows} registro(s) prontos para inclusão
                    </h5>
                    <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80">
                      Todos os cabeçalhos, colunas e formatos foram checados com sucesso.
                    </p>
                  </div>
                </div>

                {result.previewData && result.previewData.length > 0 && (
                  <div className="max-h-44 overflow-y-auto border border-emerald-200 dark:border-emerald-900 rounded-lg bg-white dark:bg-stone-900">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-emerald-100/60 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-bold sticky top-0">
                        <tr>
                          {Object.keys(result.previewData[0]).map((key) => (
                            <th key={key} className="px-3 py-1.5 capitalize">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-100 dark:divide-emerald-900/30 text-[11px]">
                        {result.previewData.slice(0, 10).map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30">
                            {Object.values(row).map((val: any, cIdx) => (
                              <td key={cIdx} className="px-3 py-1.5 text-stone-700 dark:text-stone-300">
                                {String(val ?? "-")}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Rodapé / Ações */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
          <button
            type="button"
            onClick={handleClose}
            disabled={importing}
            className="px-4 py-2 rounded-lg text-xs font-bold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <ActionButton
            onClick={handleConfirmImport}
            disabled={!result || !result.valid || importing || validating}
            className="hover:rotate-1 hover:scale-[1.02] active:scale-[0.98] active:rotate-0"
          >
            {importing ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Importando...</span>
              </span>
            ) : (
              <span>Confirmar e Importar {result?.valid ? `(${result.totalRows})` : ""}</span>
            )}
          </ActionButton>
        </div>
      </div>
    </Modal>
  );
}
