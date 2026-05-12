import { PlaceholderPage } from "@/components/layout/PlaceholderPage";
import { useTranslations } from "next-intl";

export default function WeeklyDietPage() {
  const t = useTranslations("Placeholder");

  return (
    <PlaceholderPage title={t("titles.weeklyDiet")} description={t("descriptions.weeklyDiet")} />
  );
}
