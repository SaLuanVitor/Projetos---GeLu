import { AppShell } from "@/components/layout/AppShell";
import { ActionLink } from "@/components/ui/ActionButton";
import { NotebookPageHeader } from "@/components/ui/Notebook";
import { PaperCard } from "@/components/ui/PaperCard";
import { useTranslations } from "next-intl";

export function PlaceholderPage({ description, title }: { description: string; title: string }) {
  const t = useTranslations("Placeholder");

  return (
    <AppShell>
      <main className="mx-auto max-w-6xl px-5 py-10">
        <NotebookPageHeader eyebrow={t("soon")} subtitle={description} title={title} />
        <PaperCard className="mt-10 rotate-[-1deg]" ink tape="green">
          <p className="scribble-border paper-dots-block p-5 text-sm leading-6 text-on-surface-variant">
            {t("prepared")}
          </p>
          <ActionLink className="mt-6" href="/dashboard" variant="outline">
            {t("back")}
          </ActionLink>
        </PaperCard>
      </main>
    </AppShell>
  );
}
