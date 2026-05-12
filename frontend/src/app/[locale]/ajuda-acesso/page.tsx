import {
  AuthNotebookShell,
  AuthPanelHeader,
  AuthStickerLink
} from "@/components/layout/AuthNotebookShell";
import { PaperCard } from "@/components/ui/PaperCard";
import { useTranslations } from "next-intl";

export default function AccessHelpPage() {
  const t = useTranslations("Auth.accessHelp");
  const auth = useTranslations("Auth");
  const helpItems = t.raw("items") as Array<{ title: string; description: string }>;

  return (
    <AuthNotebookShell featureLabel={t("feature")}>
      <AuthPanelHeader eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />

      <div className="mt-6 space-y-4">
        {helpItems.map((item) => (
          <PaperCard className="bg-surface-container-lowest p-4" key={item.title} tape="none">
            <h2 className="font-display text-2xl font-bold text-tertiary">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">{item.description}</p>
          </PaperCard>
        ))}
      </div>

      <div className="mt-7">
        <AuthStickerLink href="/login">{auth("loginBack")}</AuthStickerLink>
      </div>
    </AuthNotebookShell>
  );
}
