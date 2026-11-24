import {
  Coffee,
  Apple,
  Soup,
  Sandwich,
  Salad,
  Moon,
  Cookie,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

export const MEAL_ICON_MAP: Record<string, LucideIcon> = {
  BREAKFAST: Coffee,
  "CAFÉ DA MANHÃ": Coffee,
  "CAFE DA MANHA": Coffee,
  MORNING_SNACK: Apple,
  "LANCHE DA MANHÃ": Apple,
  "LANCHE MANHÃ": Apple,
  "LANCHE MANHA": Apple,
  LUNCH: Soup,
  ALMOÇO: Soup,
  ALMOCO: Soup,
  AFTERNOON_SNACK: Sandwich,
  "LANCHE DA TARDE": Sandwich,
  "LANCHE TARDE": Sandwich,
  DINNER: Salad,
  JANTAR: Salad,
  SUPPER: Moon,
  CEIA: Moon,
  SNACK: Cookie,
  "LANCHE LIVRE": Cookie,
};

export function getMealIcon(mealTypeOrName?: string): LucideIcon {
  if (!mealTypeOrName) return UtensilsCrossed;
  const key = mealTypeOrName.trim().toUpperCase();
  return MEAL_ICON_MAP[key] || UtensilsCrossed;
}
