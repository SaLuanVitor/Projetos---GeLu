import { PlaceholderPage } from "@/components/layout/PlaceholderPage";
import { useTranslations } from "next-intl";

export default function HelpPage() {
  const t = useTranslations("Placeholder");

  return <PlaceholderPage title={t("titles.help")} description={t("descriptions.help")} />;
}
