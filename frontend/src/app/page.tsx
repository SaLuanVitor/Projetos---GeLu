import { getAiAgents } from "@/services/api";
import Link from "next/link";

async function loadAgents() {
  try {
    return await getAiAgents();
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const agents = await loadAgents();

  return (
    <main className="min-h-screen">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-leaf-700">
              Gelu - Menu
            </p>
            <h1 className="mt-2 max-w-3xl text-4xl font-semibold text-ink">
              Base do sistema de receitas, dietas, treinos e IA assistiva.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Monolito modular com backend Spring Boot, frontend Next.js e agentes Codex instalados
              para guiar desenvolvimento, suporte e fluxos de IA.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                className="rounded-md bg-leaf-700 px-4 py-2 text-sm font-semibold text-white"
                href="/login"
              >
                Entrar
              </Link>
              <Link
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                href="/cadastro"
              >
                Criar conta
              </Link>
              <Link
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                href="/perfil"
              >
                Perfil
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Status label="Backend" value="/api/v1/health" />
            <Status label="Agentes" value={`${agents.length} carregados`} />
            <Status label="Banco" value="PostgreSQL + Flyway" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-ink">Agentes disponiveis</h2>
            <p className="mt-1 text-sm text-slate-600">
              Catalogo exposto pelo modulo de IA do backend.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {agents.length > 0 ? (
            agents.map((agent) => (
              <article key={agent.key} className="rounded-lg border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-ink">{agent.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{agent.purpose}</p>
                  </div>
                  <span className="rounded-md bg-leaf-50 px-2 py-1 text-xs font-medium text-leaf-700">
                    {agent.key}
                  </span>
                </div>
                <p className="mt-4 text-xs text-slate-500">{agent.codexFile}</p>
              </article>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
              Backend offline ou catalogo ainda indisponivel.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function Status({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}
