import { AppShell } from "@/components/layout/AppShell";
import { ActionLink } from "@/components/ui/ActionButton";
import { PaperCard } from "@/components/ui/PaperCard";

export function PlaceholderPage({ description, title }: { description: string; title: string }) {
  return (
    <AppShell>
      <main className="mx-auto max-w-5xl px-5 py-10">
        <PaperCard tape="brown">
          <p className="text-sm font-bold uppercase tracking-wide text-secondary">
            Pagina preparada
          </p>
          <h1 className="mt-3 font-display text-5xl font-extrabold text-primary">{title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-on-surface-variant">
            {description}
          </p>
          <p className="mt-4 rounded-lg border-2 border-dashed border-outline-variant bg-surface-container-lowest p-4 text-sm text-on-surface-variant">
            Esta folha visual segue o design das telas, mas a regra de negocio sera implementada na
            sprint correspondente.
          </p>
          <ActionLink className="mt-6" href="/dashboard" variant="outline">
            Voltar ao inicio
          </ActionLink>
        </PaperCard>
      </main>
    </AppShell>
  );
}
