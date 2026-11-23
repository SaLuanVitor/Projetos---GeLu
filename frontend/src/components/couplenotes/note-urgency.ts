export type NoteUrgency = "urgent" | "attention" | "love" | "gentle" | "info";

export type NoteUrgencyConfig = {
  id: NoteUrgency;
  label: string;
  badge: string;
  badgeColor: string;
  bg: string;
  border: string;
  tapeBg: string;
  titleColor: string;
  textColor: string;
};

export const URGENCY_CONFIGS: Record<NoteUrgency, NoteUrgencyConfig> = {
  urgent: {
    id: "urgent",
    label: "🔴 Urgente / Não esquecer",
    badge: "🔴 Urgente",
    badgeColor: "bg-rose-100 text-rose-900 border-rose-300",
    bg: "bg-[#FFF1F2]", // rose-50 sólido de alto contraste
    border: "border-rose-300 shadow-rose-200/50",
    tapeBg: "bg-rose-200/90",
    titleColor: "text-rose-950",
    textColor: "text-stone-900",
  },
  attention: {
    id: "attention",
    label: "🟡 Atenção / Rotina do Dia",
    badge: "🟡 Atenção",
    badgeColor: "bg-amber-100 text-amber-950 border-amber-300",
    bg: "bg-[#FEFCE8]", // yellow-50 sólido
    border: "border-amber-300 shadow-amber-200/50",
    tapeBg: "bg-[#ffdcc6]",
    titleColor: "text-amber-950",
    textColor: "text-stone-900",
  },
  love: {
    id: "love",
    label: "💖 Amor & Carinho",
    badge: "💖 Com Amor",
    badgeColor: "bg-pink-100 text-pink-900 border-pink-300",
    bg: "bg-[#FDF2F8]", // pink-50 sólido
    border: "border-pink-300 shadow-pink-200/50",
    tapeBg: "bg-pink-200/90",
    titleColor: "text-pink-950",
    textColor: "text-stone-900",
  },
  gentle: {
    id: "gentle",
    label: "🟢 Lembrete / Tranquilo",
    badge: "🟢 Lembrete",
    badgeColor: "bg-emerald-100 text-emerald-950 border-emerald-300",
    bg: "bg-[#F0FDF4]", // emerald-50 sólido
    border: "border-emerald-300 shadow-emerald-200/50",
    tapeBg: "bg-[#baf0b6]",
    titleColor: "text-emerald-950",
    textColor: "text-stone-900",
  },
  info: {
    id: "info",
    label: "🔵 Informativo / Dica",
    badge: "🔵 Info",
    badgeColor: "bg-sky-100 text-sky-950 border-sky-300",
    bg: "bg-[#F0F9FF]", // sky-50 sólido
    border: "border-sky-300 shadow-sky-200/50",
    tapeBg: "bg-sky-200/90",
    titleColor: "text-sky-950",
    textColor: "text-stone-900",
  },
};

export function getNoteUrgencyConfig(key?: string | null): NoteUrgencyConfig {
  const normalized = key ? key.toLowerCase() : "attention";
  if (normalized === "urgent" || normalized === "red") return URGENCY_CONFIGS.urgent;
  if (normalized === "pink" || normalized === "love" || normalized === "lavender")
    return URGENCY_CONFIGS.love;
  if (normalized === "green" || normalized === "gentle") return URGENCY_CONFIGS.gentle;
  if (normalized === "blue" || normalized === "info") return URGENCY_CONFIGS.info;
  return URGENCY_CONFIGS.attention; // padrão: yellow / attention
}
