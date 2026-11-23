import { PaperCard } from "@/components/ui/PaperCard";

export function DashboardCard({
  accent = "orange",
  label,
  title,
  value
}: {
  accent?: "orange" | "green" | "brown";
  label: string;
  title: string;
  value: string;
}) {
  const accentClass = {
    orange: "text-primary",
    green: "text-secondary",
    brown: "text-tertiary"
  }[accent];

  return (
    <PaperCard tape={accent} className="min-h-36">
      <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">{label}</p>
      <h3 className="mt-3 font-display text-2xl font-bold text-tertiary">{title}</h3>
      <p className={`mt-4 font-display text-3xl font-extrabold ${accentClass}`}>{value}</p>
    </PaperCard>
  );
}
