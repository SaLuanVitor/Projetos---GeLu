import { PlaceholderPage } from "@/components/layout/PlaceholderPage";
import { useTranslations } from "next-intl";

export default function RecipesPage() {
  const t = useTranslations("Placeholder");

  return <PlaceholderPage title={t("titles.recipes")} description={t("descriptions.recipes")} />;
}
