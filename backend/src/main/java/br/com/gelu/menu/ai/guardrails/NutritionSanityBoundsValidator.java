package br.com.gelu.menu.ai.guardrails;

import java.math.BigDecimal;
import java.math.RoundingMode;
import org.springframework.stereotype.Service;

/**
 * Output Guardrail: Validador de Sanidade Nutricional e Limites Físicos.
 * Garante que nenhuma alucinação química ou calórica gerada pelo LLM
 * chegue ao usuário final ou seja persistida no banco de dados.
 */
@Service
public class NutritionSanityBoundsValidator {

  public static final int MIN_MEAL_CALORIES = 50;
  public static final int MAX_MEAL_CALORIES = 3500;
  public static final int MAX_SERVING_CALORIES = 4000;
  public static final double MAX_MACRO_VARIANCE_TOLERANCE = 0.40; // 40% de margem de tolerância (fibras, umidade, arredondamentos)

  /**
   * Valida calorias e consistência biológica de uma sugestão de refeição.
   *
   * @param calories Calorias estimadas
   * @param proteinStr Proteína em formato textual (ex: "35g")
   * @param carbsStr Carboidratos em formato textual (ex: "40g")
   * @param fatStr Gorduras em formato textual (ex: "10g")
   * @throws SanityBoundsException se os limites físicos forem violados
   */
  public void validateMealSuggestion(int calories, String proteinStr, String carbsStr, String fatStr) {
    if (calories < MIN_MEAL_CALORIES || calories > MAX_MEAL_CALORIES) {
      throw new SanityBoundsException(
          String.format("Calorias da refeição (%d kcal) fora dos limites físicos aceitáveis (%d-%d kcal).",
              calories, MIN_MEAL_CALORIES, MAX_MEAL_CALORIES));
    }

    double protein = parseGrams(proteinStr);
    double carbs = parseGrams(carbsStr);
    double fat = parseGrams(fatStr);

    if (protein < 0 || protein > 400 || carbs < 0 || carbs > 500 || fat < 0 || fat > 300) {
      throw new SanityBoundsException("Macronutrientes fora dos limites biológicos humanos plausíveis.");
    }

    // Fórmula Atwater: 4 kcal por grama de carbo/proteína, 9 kcal por grama de gordura
    double atwaterCalculated = (protein * 4.0) + (carbs * 4.0) + (fat * 9.0);

    // Se todos os macros foram informados de forma plausível, valida a coerência da soma
    if (atwaterCalculated > 40.0) {
      double diff = Math.abs(calories - atwaterCalculated);
      double maxVal = Math.max(calories, atwaterCalculated);
      if (maxVal > 0 && (diff / maxVal) > MAX_MACRO_VARIANCE_TOLERANCE) {
        throw new SanityBoundsException(
            String.format("Inconsistência biológica detectada: calorias reportadas (%d) divergem da soma dos macronutrientes (%.1f kcal).",
                calories, atwaterCalculated));
      }
    }
  }

  /**
   * Valida a estimativa nutricional de uma receita inteira.
   */
  public void validateNutritionEstimate(
      BigDecimal totalCalories,
      BigDecimal carbohydrates,
      BigDecimal proteins,
      BigDecimal fats,
      int servings) {

    if (totalCalories == null || totalCalories.compareTo(BigDecimal.ZERO) <= 0) {
      throw new SanityBoundsException("Total calórico da receita deve ser estritamente positivo.");
    }

    if (servings <= 0) {
      throw new SanityBoundsException("Número de porções deve ser maior que zero.");
    }

    BigDecimal calsPerServing = totalCalories.divide(BigDecimal.valueOf(servings), 1, RoundingMode.HALF_UP);
    if (calsPerServing.compareTo(BigDecimal.valueOf(MAX_SERVING_CALORIES)) > 0) {
      throw new SanityBoundsException(
          String.format("Calorias por porção (%.1f kcal) excedem o teto físico de %d kcal.",
              calsPerServing.doubleValue(), MAX_SERVING_CALORIES));
    }

    if (carbohydrates != null && carbohydrates.compareTo(BigDecimal.ZERO) < 0) {
      throw new SanityBoundsException("Carboidratos não podem ser negativos.");
    }
    if (proteins != null && proteins.compareTo(BigDecimal.ZERO) < 0) {
      throw new SanityBoundsException("Proteínas não podem ser negativas.");
    }
    if (fats != null && fats.compareTo(BigDecimal.ZERO) < 0) {
      throw new SanityBoundsException("Gorduras não podem ser negativas.");
    }
  }

  private double parseGrams(String input) {
    if (input == null || input.isBlank()) {
      return 0.0;
    }
    try {
      String clean = input.toLowerCase().replace("g", "").replace(",", ".").trim();
      return Double.parseDouble(clean);
    } catch (Exception e) {
      return 0.0;
    }
  }
}
