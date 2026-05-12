import { PlaceholderPage } from "@/components/layout/PlaceholderPage";
import { useTranslations } from "next-intl";

export default function AiSuggestionsPage() {
  const t = useTranslations("Placeholder");

  return <PlaceholderPage title={t("titles.ai")} description={t("descriptions.ai")} />;
}
