"use client";

import { AppShell } from "@/components/layout/AppShell";
import { ActionButton } from "@/components/ui/ActionButton";
import { PaperCard } from "@/components/ui/PaperCard";
import { useToast } from "@/components/ui/Toast";
import { FormEvent, useMemo, useState } from "react";

type FAQItem = {
  question: string;
  answer: string;
  category: "mural" | "agenda" | "dieta" | "familia" | "privacidade";
};

const FAQS: FAQItem[] = [
  {
    category: "mural",
    question: "Como funciona o Mural de Avisos do Casal?",
    answer:
      "O mural é um espaço exclusivo para recados e bilhetinhos afetuosos ou lembretes urgentes. Cada bilhete possui uma cor indicando a prioridade (Urgente, Atenção, Amor, Tranquilo ou Dica). Quem posta o bilhete acompanha o status de leitura, e quem recebe pode marcar 'Visto com ❤️'. Se você não marcar como visto, o sistema re-notifica com um popup carinhoso na tela.",
  },
  {
    category: "agenda",
    question: "Como atribuir atividades na Agenda Semanal para mim ou para o casal?",
    answer:
      "Ao cadastrar ou editar uma atividade, basta selecionar os membros da família desejados nos botões de responsáveis. Você pode selecionar você mesmo, seu parceiro ou ambos simultaneamente. Se salvar sem selecionar ninguém, o sistema atribui automaticamente a você.",
  },
  {
    category: "dieta",
    question: "Como vincular receitas ao Cardápio Semanal e calcular as calorias?",
    answer:
      "Na tela de Dieta Semanal, ao adicionar ou editar uma refeição (como Almoço ou Jantar), selecione qualquer receita do seu livro de receitas familiar e informe as porções. O sistema calcula automaticamente as calorias totais com base na tabela nutricional da receita vinculada.",
  },
  {
    category: "dieta",
    question: "Posso copiar o cardápio de uma semana para a outra?",
    answer:
      "Sim! No canto superior da tela de Dieta Semanal, clique em 'Copiar Semana', selecione a data da semana desejada e todas as refeições, pessoas associadas e receitas serão replicadas instantaneamente.",
  },
  {
    category: "familia",
    question: "Como funciona a segurança e permissões da Família?",
    answer:
      "O criador da família é o Administrador com controle total para convidar ou remover membros. Outros membros podem atuar como Editores (gerenciando agenda, receitas e cardápio). Todas as ações realizadas na família ficam registradas permanentemente na Trilha de Auditoria.",
  },
  {
    category: "privacidade",
    question: "Onde ficam armazenados os dados e fotos das receitas?",
    answer:
      "Suas receitas, metas, diário de peso e notas ficam armazenados com criptografia de ponta a ponta e isolamento estrito por família no PostgreSQL e armazenamento de objetos seguro (S3/MinIO).",
  },
];

export default function HelpAndSupportPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<"faq" | "ticket" | "feedback">("faq");
  const [faqSearch, setFaqSearch] = useState("");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Formulário de Chamado
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketCategory, setTicketCategory] = useState("Dúvida de Uso");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketPriority, setTicketPriority] = useState("Média");
  const [submittingTicket, setSubmittingTicket] = useState(false);

  // Formulário de Avaliação
  const [rating, setRating] = useState<number>(5);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const filteredFaqs = useMemo(() => {
    if (!faqSearch.trim()) return FAQS;
    const q = faqSearch.toLowerCase();
    return FAQS.filter(
      (f) => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)
    );
  }, [faqSearch]);

  const handleTicketSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) return;

    try {
      setSubmittingTicket(true);
      // Simulação de envio com delay de rede
      await new Promise((res) => setTimeout(res, 600));
      toast.success("Chamado enviado com sucesso! Nossa equipe responderá em breve. 💌");
      setTicketSubject("");
      setTicketMessage("");
    } catch {
      toast.error("Erro ao enviar chamado de suporte.");
    } finally {
      setSubmittingTicket(false);
    }
  };

  const handleFeedbackSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingFeedback(true);
      await new Promise((res) => setTimeout(res, 600));
      toast.success("Obrigado pelo seu feedback carinhoso! ❤️");
      setFeedbackComment("");
    } catch {
      toast.error("Erro ao enviar avaliação.");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  return (
    <AppShell>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Cabeçalho */}
        <div className="border-b border-stone-200/80 dark:border-stone-800 pb-6 mb-8">
          <div className="flex items-center gap-2">
            <span className="text-3xl">💡</span>
            <h1 className="font-display text-3xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
              Central de Ajuda & Suporte
            </h1>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-xl">
            Tire suas dúvidas, conheça os melhores truques do GeLu Menu e fale com nossa equipe sempre que precisar de suporte.
          </p>
        </div>

        {/* Abas de Navegação */}
        <div className="flex items-center gap-2 border-b border-stone-200/80 dark:border-stone-800 pb-3 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab("faq")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === "faq"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
            }`}
          >
            ❓ Perguntas Frequentes (FAQ)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ticket")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === "ticket"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
            }`}
          >
            ✉️ Abrir Chamado / Contato
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("feedback")}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeTab === "feedback"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
            }`}
          >
            ⭐ Avaliação & Sugestões
          </button>
        </div>

        {/* ABA 1: FAQ */}
        {activeTab === "faq" && (
          <div className="space-y-6">
            <div className="relative">
              <input
                type="text"
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
                placeholder="Buscar dúvida ou funcionalidade (ex: mural, calorias, agenda)..."
                className="w-full rounded-2xl border border-stone-300 dark:border-stone-700 bg-white/95 dark:bg-stone-900/90 px-4 py-3 text-sm font-medium text-stone-900 dark:text-stone-100 shadow-sm placeholder:text-stone-400 focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div className="space-y-3">
              {filteredFaqs.map((faq, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <PaperCard key={faq.question} className="p-0 overflow-hidden" tape="none">
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                      className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-amber-50/50 dark:hover:bg-stone-800/40 cursor-pointer"
                    >
                      <span className="font-display text-base font-bold text-stone-900 dark:text-stone-100">
                        {faq.question}
                      </span>
                      <span className="text-stone-400 text-lg">{isOpen ? "▲" : "▼"}</span>
                    </button>
                    {isOpen && (
                      <div className="border-t border-stone-200/70 dark:border-stone-800 p-5 bg-white/60 dark:bg-stone-900/60 text-xs leading-relaxed text-stone-700 dark:text-stone-300">
                        {faq.answer}
                      </div>
                    )}
                  </PaperCard>
                );
              })}
            </div>
          </div>
        )}

        {/* ABA 2: Abrir Chamado */}
        {activeTab === "ticket" && (
          <PaperCard className="p-6 sm:p-8" tape="orange">
            <h3 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100 mb-2">
              Como podemos ajudar você hoje?
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-6">
              Envie sua dúvida, sugestão ou relate algum comportamento indesejado. Nossa equipe responde em menos de 24h.
            </p>

            <form onSubmit={handleTicketSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 block mb-1">
                    Categoria do Chamado
                  </label>
                  <select
                    value={ticketCategory}
                    onChange={(e) => setTicketCategory(e.target.value)}
                    className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2.5 text-xs font-bold text-stone-800 dark:text-stone-200 shadow-sm focus:border-amber-600 focus:outline-none"
                  >
                    <option value="Dúvida de Uso">Dúvida de Uso</option>
                    <option value="Sugestão de Recurso">Sugestão de Novo Recurso</option>
                    <option value="Problema Técnico">Problema no Sistema (Bug)</option>
                    <option value="Ajuste de Conta">Ajuste de Conta ou Família</option>
                    <option value="Outro">Outro Assunto</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 block mb-1">
                    Nível de Prioridade
                  </label>
                  <select
                    value={ticketPriority}
                    onChange={(e) => setTicketPriority(e.target.value)}
                    className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2.5 text-xs font-bold text-stone-800 dark:text-stone-200 shadow-sm focus:border-amber-600 focus:outline-none"
                  >
                    <option value="Baixa">🟢 Baixa (Dúvida comum)</option>
                    <option value="Média">🟡 Média (Melhoria ou ajuste)</option>
                    <option value="Alta">🔴 Alta (Impedimento no sistema)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 block mb-1">
                  Assunto Resumido
                </label>
                <input
                  type="text"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  placeholder="Ex: Dúvida sobre o visto no mural ou sugestão de receita..."
                  required
                  className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 px-3.5 py-2.5 text-sm font-medium text-stone-900 dark:text-stone-100 shadow-sm placeholder:text-stone-400 focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 block mb-1">
                  Mensagem / Descrição do Chamado
                </label>
                <textarea
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  rows={5}
                  required
                  placeholder="Conte em detalhes o que aconteceu ou a sua sugestão..."
                  className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 p-3.5 text-sm font-medium text-stone-900 dark:text-stone-100 shadow-sm placeholder:text-stone-400 focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end pt-2">
                <ActionButton type="submit" disabled={submittingTicket}>
                  {submittingTicket ? "Enviando..." : "Enviar Chamado"}
                </ActionButton>
              </div>
            </form>
          </PaperCard>
        )}

        {/* ABA 3: Avaliação e Sugestões */}
        {activeTab === "feedback" && (
          <PaperCard className="p-6 sm:p-8" tape="green">
            <h3 className="font-display text-2xl font-bold text-stone-900 dark:text-stone-100 mb-2">
              Sua opinião importa muito para nós!
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-6">
              Como está sendo sua experiência organizando as receitas, a rotina e os recados do casal no GeLu Menu?
            </p>

            <form onSubmit={handleFeedbackSubmit} className="space-y-6">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 block mb-2">
                  Qual sua nota geral para o sistema?
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="text-3xl transition-transform hover:scale-125 cursor-pointer"
                    >
                      {star <= rating ? "⭐" : "☆"}
                    </button>
                  ))}
                  <span className="text-xs font-bold text-stone-600 dark:text-stone-300 ml-2">
                    {rating === 5
                      ? "Excelente! 💖"
                      : rating === 4
                      ? "Muito bom! 😊"
                      : rating === 3
                      ? "Bom 👍"
                      : "Pode melhorar"}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 block mb-1">
                  Comentários ou Sugestões de Melhoria
                </label>
                <textarea
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  rows={4}
                  placeholder="Diga o que você mais gostou ou o que acha que deixaria o GeLu Menu ainda mais perfeito para o casal..."
                  className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 p-3.5 text-sm font-medium text-stone-900 dark:text-stone-100 shadow-sm placeholder:text-stone-400 focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end">
                <ActionButton type="submit" disabled={submittingFeedback}>
                  {submittingFeedback ? "Gravando..." : "Enviar Avaliação"}
                </ActionButton>
              </div>
            </form>
          </PaperCard>
        )}
      </main>
    </AppShell>
  );
}
