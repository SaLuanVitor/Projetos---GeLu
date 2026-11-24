"use client";

import { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PaperCard } from "@/components/ui/PaperCard";
import { ActionButton } from "@/components/ui/ActionButton";
import { NotebookPageHeader } from "@/components/ui/Notebook";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TextInput, TextAreaField, SelectField } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/Toast";
import {
  Clock,
  UtensilsCrossed,
  HeartHandshake,
  Wallet,
  Phone,
  Plus,
  Info,
  List,
  Search,
  X,
  Home,
  Pin,
  Star,
  type LucideIcon,
} from "lucide-react";
import { useFamilyContext } from "@/contexts/FamilyContext";
import { getValidSession } from "@/services/auth";
import {
  listFamilySpaceItems,
  createFamilySpaceItem,
  deleteFamilySpaceItem,
} from "@/services/family-spaces";
import { subscribeToFamilyEvents } from "@/hooks/useFamilySocket";
import type { FamilySpaceItemResponse } from "@/types/api";

type CategoryFilter = "ALL" | "ROTINA" | "ALIMENTACAO" | "BEM_ESTAR" | "FINANCAS" | "CONTATOS";

const CATEGORY_MAP: Record<
  string,
  { label: string; icon: LucideIcon; tape: "green" | "orange" | "brown" }
> = {
  ROTINA: { label: "Rotina da Casa", icon: Clock, tape: "green" },
  ALIMENTACAO: { label: "Alimentação & Cozinha", icon: UtensilsCrossed, tape: "orange" },
  BEM_ESTAR: { label: "Bem-estar & Convivência", icon: HeartHandshake, tape: "green" },
  FINANCAS: { label: "Finanças & Metas", icon: Wallet, tape: "brown" },
  CONTATOS: { label: "Contatos Importantes", icon: Phone, tape: "green" },
};

export default function NossoEspacoPage() {
  const { showToast } = useToast();
  const { activeFamily, isPersonal } = useFamilyContext();
  const [token, setToken] = useState<string | null>(null);
  const [items, setItems] = useState<FamilySpaceItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("ROTINA");
  const [newDescription, setNewDescription] = useState("");
  const [newHighlight, setNewHighlight] = useState("");
  const [saving, setSaving] = useState(false);

  // Exclusão com confirmação padrão
  const [itemToDelete, setItemToDelete] = useState<FamilySpaceItemResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadItems = useCallback(async () => {
    if (!token || !activeFamily) {
      setLoading(false);
      return;
    }
    try {
      const data = await listFamilySpaceItems(token, activeFamily.id);
      setItems(data);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token, activeFamily]);

  useEffect(() => {
    getValidSession().then((session) => {
      if (session) {
        setToken(session.accessToken);
      }
    });
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Sincronização em tempo real via WebSocket
  useEffect(() => {
    const unsubscribe = subscribeToFamilyEvents((event) => {
      if (
        event.type === "FAMILY_SPACE_ITEM_CREATED" ||
        event.type === "FAMILY_SPACE_ITEM_DELETED"
      ) {
        loadItems();
      }
    });
    return unsubscribe;
  }, [loadItems]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !activeFamily || !newTitle.trim()) return;

    setSaving(true);
    try {
      await createFamilySpaceItem(token, {
        familyId: activeFamily.id,
        category: newCategory,
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        highlightTag: newHighlight.trim() || undefined,
      });

      showToast("Item adicionado ao espaço da família com sucesso!", "success");
      setModalOpen(false);
      setNewTitle("");
      setNewDescription("");
      setNewHighlight("");
      loadItems();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Erro ao salvar", "error");
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteItem = async () => {
    if (!token || !itemToDelete) return;
    setDeleting(true);
    try {
      await deleteFamilySpaceItem(token, itemToDelete.id);
      showToast("Item removido com sucesso", "info");
      setItemToDelete(null);
      loadItems();
    } catch {
      showToast("Erro ao excluir", "error");
    } finally {
      setDeleting(false);
    }
  };

  const filteredItems = items.filter((item) => {
    if (activeCategory !== "ALL" && item.category !== activeCategory) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchTitle = item.title.toLowerCase().includes(q);
    const matchDesc = (item.description || "").toLowerCase().includes(q);
    const matchHighlight = (item.highlightTag || "").toLowerCase().includes(q);
    return matchTitle || matchDesc || matchHighlight;
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <NotebookPageHeader
            eyebrow="ACORDOS, REGRAS E ROTINA DO LAR"
            title="Nosso Espaço"
            subtitle="O cantinho para combinar tarefas domésticas, hábitos, contatos e o bom funcionamento da casa."
          />

          {!isPersonal && activeFamily && (
            <ActionButton
              onClick={() => setModalOpen(true)}
              variant="primary"
              className="shrink-0 self-start sm:self-auto shadow-md"
            >
              <span className="inline-flex items-center gap-1.5"><Plus className="w-3.5 h-3.5 stroke-[2]" /> Novo Registro</span>
            </ActionButton>
          )}
        </div>

        {isPersonal && (
          <div className="p-4 rounded-2xl border-2 border-amber-300 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs font-semibold flex items-center gap-3">
            <Info className="w-4 h-4 text-amber-800 dark:text-amber-300 shrink-0" />
            <span>
              Você está no seu <strong>Espaço Pessoal Solo</strong>. Para ver e adicionar acordos compartilhados do lar, selecione uma <strong>Família</strong> no topo.
            </span>
          </div>
        )}

        {/* Filtros por Categoria estilo Tabs artesanais */}
        <div className="flex flex-wrap gap-2 pb-2 no-scrollbar scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveCategory("ALL")}
            className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activeCategory === "ALL"
                ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow"
                : "bg-surface-container-low dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200"
            }`}
          >
            <span className="inline-flex items-center gap-1"><List className="w-3.5 h-3.5" /> Todos ({items.length})</span>
          </button>
          {Object.entries(CATEGORY_MAP).map(([key, config]) => {
            const count = items.filter((i) => i.category === key).length;
            const active = activeCategory === key;
            const Icon = config.icon;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveCategory(key as CategoryFilter)}
                className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  active
                    ? "bg-primary text-white shadow"
                    : "bg-surface-container-low dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5 stroke-[1.75]" />
                <span>{config.label}</span>
                <span className="text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Barra de Pesquisa Rápida */}
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs">
            🔍
          </span>
          <input
            type="text"
            placeholder="Pesquisar nos acordos, rotinas, hábitos ou contatos do lar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs font-medium rounded-xl border border-stone-200 dark:border-stone-700 bg-white/90 dark:bg-stone-800 text-stone-800 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-0.5 cursor-pointer"
              title="Limpar pesquisa"
            >
              ✕
            </button>
          )}
        </div>

        {/* Grid de Cards Artesanais de Nosso Espaço */}
        {loading ? (
          <div className="py-20 text-center text-sm text-stone-400">
            Carregando acordos do nosso espaço...
          </div>
        ) : filteredItems.length === 0 ? (
          <PaperCard tape="brown">
            <div className="py-12 text-center text-stone-500 space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100/70 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 mx-auto mb-2"><Home className="w-6 h-6 stroke-[1.75]" /></div>
              <p className="font-display text-base font-bold text-stone-800 dark:text-stone-200">
                Nenhum registro encontrado nesta categoria.
              </p>
              <p className="text-xs text-stone-400 max-w-sm mx-auto">
                Registre quem lava a louça, o veterinário do pet, metas financeiras ou pequenos hábitos da nossa mesa!
              </p>
            </div>
          </PaperCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredItems.map((item, idx) => {
              const cat = CATEGORY_MAP[item.category] ?? {
                label: item.category,
                icon: Pin,
                tape: "orange",
              };
              const CatIcon = cat.icon;
              return (
                <div
                  key={item.id}
                  className="transition-all duration-300 ease-out hover:-translate-y-1.5 hover:-rotate-1 hover:shadow-xl group"
                  style={{
                    transform: `rotate(${idx % 2 === 0 ? "-0.6deg" : "0.6deg"})`,
                  }}
                >
                  <PaperCard tape={cat.tape} className="h-full flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 pb-2 border-b border-surface-variant">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-stone-600 dark:text-stone-300">
                          <CatIcon className="w-3.5 h-3.5 stroke-[1.75]" />
                          <span>{cat.label}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setItemToDelete(item)}
                          className="text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md p-1 text-xs transition-colors cursor-pointer"
                          title="Excluir item"
                        >
                          ✕
                        </button>
                      </div>

                      <h3 className="font-display text-base font-bold text-stone-900 dark:text-stone-100 mt-3">
                        {item.title}
                      </h3>

                      {item.description && (
                        <p className="text-xs text-stone-600 dark:text-stone-300 mt-2 leading-relaxed whitespace-pre-wrap">
                          {item.description}
                        </p>
                      )}

                      {item.highlightTag && (
                        <div className="mt-3 inline-block rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide">
                          <span className="inline-flex items-center gap-1"><Star className="w-3 h-3 fill-amber-400 text-amber-500" /> {item.highlightTag}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-dashed border-stone-200 dark:border-stone-800 flex items-center justify-between text-[10px] text-stone-400">
                      <span>Registrado por <strong>{item.authorName}</strong></span>
                      <span>{new Date(item.createdAt).toLocaleDateString("pt-BR")}</span>
                    </div>
                  </PaperCard>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Criação */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Novo Registro em Nosso Espaço"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <SelectField
            id="catSelect"
            label="Categoria do Acordo"
            value={newCategory}
            onValueChange={setNewCategory}
            options={[
              { label: "Rotina da Casa (Lixo, Limpeza, Compras)", value: "ROTINA" },
              { label: "Alimentação & Cozinha (Quem cozinha, Cardápios)", value: "ALIMENTACAO" },
              { label: "Bem-estar & Convivência (Hábitos, Noite do Filme)", value: "BEM_ESTAR" },
              { label: "Finanças & Metas (Poupança, Contas do Mês)", value: "FINANCAS" },
              { label: "Contatos Importantes (Médicos, Emergência, Chaveiro)", value: "CONTATOS" },
            ]}
          />

          <TextInput
            id="titleInput"
            label="Título do Registro"
            placeholder="Ex: Rodízio da Louça da Semana"
            required
            value={newTitle}
            onValueChange={setNewTitle}
          />

          <TextAreaField
            id="descInput"
            label="Detalhes ou Regras"
            placeholder="Descreva como funciona o acordo ou anote os telefones/detalhes..."
            rows={4}
            value={newDescription}
            onValueChange={setNewDescription}
          />

          <TextInput
            id="tagInput"
            label="Destaque / Responsável (Opcional)"
            placeholder="Ex: Feito aos sábados / Luan & Geovana"
            value={newHighlight}
            onValueChange={setNewHighlight}
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-surface-variant">
            <ActionButton
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </ActionButton>
            <ActionButton
              type="submit"
              variant="primary"
              disabled={saving}
            >
              {saving ? "Registrando..." : "Salvar no Espaço"}
            </ActionButton>
          </div>
        </form>
      </Modal>

      {/* Diálogo de Confirmação para Remoção */}
      <ConfirmDialog
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={confirmDeleteItem}
        title={`Excluir "${itemToDelete?.title}"?`}
        description="Tem certeza que deseja remover este registro do Nosso Espaço? Esta ação é irreversível."
        confirmLabel="Sim, excluir"
        cancelLabel="Cancelar"
        variant="danger"
        loading={deleting}
      />
    </AppShell>
  );
}
