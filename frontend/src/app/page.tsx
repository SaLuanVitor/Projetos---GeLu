import { AppShell } from "@/components/layout/AppShell";
import { ActionLink } from "@/components/ui/ActionButton";
import { DashboardCard } from "@/components/ui/DashboardCard";
import { PaperCard } from "@/components/ui/PaperCard";
import { getAiAgents } from "@/services/api";

async function loadAgents() {
  try {
    return await getAiAgents();
  } catch {
    return [];
  }
}

const dashboardCards = [
  {
    accent: "orange" as const,
    label: "Refeicoes do dia",
    title: "Planner de hoje",
    value: "4 itens"
  },
  {
    accent: "green" as const,
    label: "Treino do dia",
    title: "Caminhada leve",
    value: "35 min"
  },
  {
    accent: "brown" as const,
    label: "Saldo calorico",
    title: "Resumo estimado",
    value: "+120 kcal"
  },
  {
    accent: "green" as const,
    label: "Peso atual",
    title: "Acompanhamento",
    value: "Perfil"
  },
  {
    accent: "orange" as const,
    label: "Convites pendentes",
    title: "Familia",
    value: "0"
  },
  {
    accent: "brown" as const,
    label: "Sugestoes inteligentes",
    title: "Dica do chef IA",
    value: "3 ideias"
  }
];

export default async function HomePage() {
  const agents = await loadAgents();

  return (
    <AppShell>
      <main className="mx-auto max-w-6xl px-5 py-8">
        <section className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-stretch">
          <div className="wobbly-paper border-2 border-outline bg-surface-container-low p-7 shadow-paper">
            <p className="text-sm font-bold uppercase tracking-wide text-secondary">
              Diario de alimentacao familiar
            </p>
            <h1 className="mt-3 max-w-3xl font-display text-5xl font-extrabold leading-tight text-primary">
              Seu caderno vivo para receitas, peso, treinos e ideias de IA.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-on-surface-variant">
              Organize a semana com um visual de planner artesanal, sem perder os fluxos reais de
              conta, perfil e evolucao que ja estao conectados ao backend.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ActionLink href="/login">Entrar</ActionLink>
              <ActionLink href="/cadastro" variant="secondary">
                Criar conta
              </ActionLink>
              <ActionLink href="/perfil" variant="outline">
                Abrir perfil
              </ActionLink>
            </div>
          </div>

          <PaperCard tape="green" className="bg-recipe-lines bg-[length:100%_32px]">
            <p className="text-xs font-bold uppercase tracking-wide text-tertiary">
              Anotacao da cozinha
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold text-secondary">
              Lembrete mensal de peso
            </h2>
            <p className="mt-4 text-sm leading-6 text-on-surface-variant">
              A tela de evolucao avisa quando estiver na hora de registrar uma nova medida e manter
              o historico sempre fresco.
            </p>
            <ActionLink className="mt-5" href="/perfil/evolucao" variant="outline">
              Ver evolucao
            </ActionLink>
          </PaperCard>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {dashboardCards.map((card) => (
            <DashboardCard key={card.label} {...card} />
          ))}
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1fr_1fr]">
          <PaperCard tape="brown">
            <h2 className="font-display text-3xl font-bold text-tertiary">Agentes disponiveis</h2>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              Catalogo exposto pelo modulo de IA do backend, mantido como referencia tecnica.
            </p>
            <div className="mt-5 grid gap-3">
              {agents.length > 0 ? (
                agents.slice(0, 4).map((agent) => (
                  <div
                    className="rounded-lg border-2 border-outline-variant bg-surface-container-lowest p-3"
                    key={agent.key}
                  >
                    <p className="font-bold text-tertiary">{agent.name}</p>
                    <p className="mt-1 text-sm text-on-surface-variant">{agent.purpose}</p>
                  </div>
                ))
              ) : (
                <p className="rounded-lg border-2 border-dashed border-outline-variant p-4 text-sm text-on-surface-variant">
                  Backend offline ou catalogo ainda indisponivel.
                </p>
              )}
            </div>
          </PaperCard>

          <PaperCard tape="orange">
            <h2 className="font-display text-3xl font-bold text-primary">Proximas folhas</h2>
            <div className="mt-5 grid gap-3 text-sm text-on-surface-variant">
              <p>Receitas, dieta semanal, familia e sugestoes IA ja aparecem no menu.</p>
              <p>
                Nesta etapa elas ficam como paginas visuais de preparacao, sem criar regras de
                negocio antes das sprints correspondentes.
              </p>
            </div>
          </PaperCard>
        </section>
      </main>
    </AppShell>
  );
}
