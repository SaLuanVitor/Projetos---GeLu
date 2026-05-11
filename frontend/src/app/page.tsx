import { ActionLink } from "@/components/ui/ActionButton";
import { PaperCard } from "@/components/ui/PaperCard";

const features = [
  {
    title: "Receitas em familia",
    description: "Guarde ideias de pratos, organize favoritos e prepare o caderno para a rotina."
  },
  {
    title: "Perfil e evolucao",
    description: "Acompanhe dados pessoais, metas e historico de peso em um visual leve."
  },
  {
    title: "Planner semanal",
    description: "Planeje refeicoes, treinos e sugestoes inteligentes no mesmo lugar."
  }
];

export default function LandingPage() {
  return (
    <main className="paper-canvas min-h-screen overflow-hidden bg-surface text-on-surface">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-6">
        <div className="inline-flex items-end gap-3">
          <span className="flex h-11 w-11 rotate-[-3deg] items-center justify-center rounded-lg border-2 border-tertiary bg-primary-fixed font-display text-xl font-extrabold text-primary shadow-label">
            GL
          </span>
          <div>
            <p className="font-display text-3xl font-extrabold leading-none text-primary">
              GeLu - Menu
            </p>
            <p className="text-xs font-bold uppercase tracking-wide text-tertiary">
              Caderno familiar de receitas
            </p>
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          <ActionLink href="/login" variant="outline">
            Entrar
          </ActionLink>
          <ActionLink className="hidden sm:inline-flex" href="/cadastro">
            Criar conta
          </ActionLink>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-16">
        <div>
          <p className="w-fit rotate-[-1deg] rounded-lg border-2 border-tertiary bg-secondary-fixed px-4 py-2 text-sm font-bold uppercase tracking-wide text-on-secondary-fixed shadow-label">
            Alimentacao, rotina e cuidado em um so lugar
          </p>
          <h1 className="mt-6 max-w-3xl font-display text-5xl font-extrabold leading-[1.05] text-primary md:text-7xl">
            Organize o menu da casa como um caderno vivo.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-on-surface-variant">
            O Gelu - Menu junta receitas, dieta semanal, ambiente familiar, evolucao de peso,
            treinos e sugestoes por IA em uma experiencia acolhedora, visual e simples de usar.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ActionLink className="px-6 py-3 text-base" href="/cadastro">
              Criar conta gratis
            </ActionLink>
            <ActionLink className="px-6 py-3 text-base" href="/login" variant="secondary">
              Ja tenho login
            </ActionLink>
          </div>
        </div>

        <div className="relative min-h-[520px]">
          <div className="absolute left-4 top-4 h-44 w-44 rounded-full bg-secondary-fixed/70 blur-3xl" />
          <div className="absolute bottom-8 right-0 h-52 w-52 rounded-full bg-primary-fixed/80 blur-3xl" />

          <PaperCard
            className="relative z-10 rotate-[-1deg] bg-recipe-lines bg-[length:100%_32px] p-7"
            tape="orange"
          >
            <p className="text-xs font-bold uppercase tracking-wide text-tertiary">
              Planner de hoje
            </p>
            <h2 className="mt-3 font-display text-4xl font-bold text-primary">
              Refeicoes da familia
            </h2>
            <div className="mt-6 grid gap-3">
              {["Cafe com tapioca", "Bowl mediterraneo", "Lanche de frutas", "Sopa de abobora"].map(
                (item, index) => (
                  <div
                    className="flex items-center justify-between rounded-lg border-2 border-outline-variant bg-surface-container-lowest px-4 py-3"
                    key={item}
                  >
                    <span className="font-bold text-tertiary">{item}</span>
                    <span className="rounded-full bg-secondary-fixed px-3 py-1 text-xs font-bold text-on-secondary-fixed">
                      {index === 0
                        ? "manha"
                        : index === 1
                          ? "almoco"
                          : index === 2
                            ? "lanche"
                            : "jantar"}
                    </span>
                  </div>
                )
              )}
            </div>
          </PaperCard>

          <PaperCard
            className="absolute bottom-2 right-4 z-20 w-72 rotate-[2deg] bg-surface-container-lowest"
            tape="green"
          >
            <p className="text-xs font-bold uppercase tracking-wide text-secondary">Evolucao</p>
            <p className="mt-2 font-display text-3xl font-extrabold text-tertiary">82,4 kg</p>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              Registre peso e metas sem perder a sensacao de planner pessoal.
            </p>
          </PaperCard>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-5 pb-14 md:grid-cols-3">
        {features.map((feature) => (
          <PaperCard key={feature.title} tape="brown">
            <h3 className="font-display text-2xl font-bold text-tertiary">{feature.title}</h3>
            <p className="mt-3 text-sm leading-6 text-on-surface-variant">{feature.description}</p>
          </PaperCard>
        ))}
      </section>
    </main>
  );
}
