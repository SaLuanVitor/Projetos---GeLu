import type { DietMealResponse } from "@/types/api";

export type MealCategory =
  | "Café da Manhã"
  | "Almoço"
  | "Lanche da Tarde"
  | "Jantar"
  | "Ceia / Snack"
  | "Refeição";

export interface WeekOption {
  id: string; // ISO Monday date string: YYYY-MM-DD
  label: string; // e.g. "Semana Atual (23/11 a 29/11)"
  shortLabel: string; // e.g. "Semana Atual"
  range: string; // e.g. "23/11 a 29/11"
}

/**
 * Retorna a segunda-feira correspondente à data fornecida (no fuso local).
 */
export function getMondayOfDate(d: Date): string {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // 0 = Seg, 6 = Dom
  date.setDate(date.getDate() - day);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const dayOfMonth = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${dayOfMonth}`;
}

/**
 * Gera as opções de semanas para planejamento (Semana Atual, Próxima Semana, etc.)
 */
export function getPlanningWeekOptions(count = 4): WeekOption[] {
  const options: WeekOption[] = [];
  const now = new Date();
  const baseMondayStr = getMondayOfDate(now);
  const [bYear, bMonth, bDay] = baseMondayStr.split("-").map(Number);
  const baseMonday = new Date(bYear, bMonth - 1, bDay);

  for (let i = 0; i < count; i++) {
    const monday = new Date(baseMonday);
    monday.setDate(monday.getDate() + i * 7);

    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);

    const mondayStr = getMondayOfDate(monday);

    const monDay = String(monday.getDate()).padStart(2, "0");
    const monMonth = String(monday.getMonth() + 1).padStart(2, "0");
    const sunDay = String(sunday.getDate()).padStart(2, "0");
    const sunMonth = String(sunday.getMonth() + 1).padStart(2, "0");

    const range = `${monDay}/${monMonth} a ${sunDay}/${sunMonth}`;
    let shortLabel = `Em ${i} semanas`;
    if (i === 0) shortLabel = "Semana Atual";
    else if (i === 1) shortLabel = "Próxima Semana";
    else if (i === 2) shortLabel = "Daqui a 2 semanas";

    options.push({
      id: mondayStr,
      label: `${shortLabel} (${range})`,
      shortLabel,
      range,
    });
  }

  return options;
}

/**
 * Detecta a categoria / momento de uma refeição a partir do nome ou horário.
 */
export function detectMealCategory(mealName: string, mealTime?: string | null): MealCategory {
  const n = (mealName || "").toLowerCase();

  if (n.includes("café") || n.includes("cafe") || n.includes("desjejum") || n.includes("manhã") || n.includes("manha")) {
    return "Café da Manhã";
  }
  if (n.includes("almoço") || n.includes("almoco")) {
    return "Almoço";
  }
  if (n.includes("lanche") || n.includes("merenda") || n.includes("tarde")) {
    return "Lanche da Tarde";
  }
  if (n.includes("jantar") || n.includes("janta") || n.includes("jantinha")) {
    return "Jantar";
  }
  if (n.includes("ceia") || n.includes("snack") || n.includes("noite")) {
    return "Ceia / Snack";
  }

  if (mealTime) {
    const [h] = mealTime.split(":").map(Number);
    if (!isNaN(h)) {
      if (h >= 5 && h < 11) return "Café da Manhã";
      if (h >= 11 && h < 15) return "Almoço";
      if (h >= 15 && h < 18) return "Lanche da Tarde";
      if (h >= 18 && h < 22) return "Jantar";
      return "Ceia / Snack";
    }
  }

  return "Refeição";
}

/**
 * Verifica se já existe uma refeição conflitante no mesmo dia da semana e momento/horário.
 */
export function findConflictingMeal(
  meals: DietMealResponse[] | undefined,
  targetDay: string,
  targetMealName: string,
  targetMealTime?: string | null,
  excludeMealId?: string | null
): DietMealResponse | null {
  if (!meals || meals.length === 0) return null;

  const targetCategory = detectMealCategory(targetMealName, targetMealTime);
  const targetTimeStr = targetMealTime ? targetMealTime.trim() : "";

  for (const meal of meals) {
    if (excludeMealId && meal.id === excludeMealId) continue;
    if (meal.weekDay.toUpperCase() !== targetDay.toUpperCase()) continue;

    // 1. Conflito por categoria de refeição (ex: já existe um "Almoço" na Segunda)
    const mealCategory = detectMealCategory(meal.mealName, meal.mealTime);
    if (targetCategory !== "Refeição" && mealCategory === targetCategory) {
      return meal;
    }

    // 2. Conflito por proximidade de horário (dentro de 45 minutos)
    if (targetTimeStr && meal.mealTime) {
      const [th, tm] = targetTimeStr.split(":").map(Number);
      const [mh, mm] = meal.mealTime.split(":").map(Number);
      if (!isNaN(th) && !isNaN(tm) && !isNaN(mh) && !isNaN(mm)) {
        const diff = Math.abs(th * 60 + tm - (mh * 60 + mm));
        if (diff <= 45) {
          return meal;
        }
      }
    }

    // 3. Conflito por nome idêntico (ex: ambos são "Almoço Saudável")
    if (
      targetMealName.trim() &&
      meal.mealName.trim().toLowerCase() === targetMealName.trim().toLowerCase()
    ) {
      return meal;
    }
  }

  return null;
}
