import { PlaceholderPage } from "@/components/layout/PlaceholderPage";
import { useTranslations } from "next-intl";

export default function FamilyPage() {
  const t = useTranslations("Placeholder");

  return <PlaceholderPage title={t("titles.family")} description={t("descriptions.family")} />;
}
