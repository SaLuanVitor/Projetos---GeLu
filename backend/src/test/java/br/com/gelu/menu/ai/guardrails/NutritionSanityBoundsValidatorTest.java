package br.com.gelu.menu.ai.guardrails;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class NutritionSanityBoundsValidatorTest {

  private NutritionSanityBoundsValidator validator;

  @BeforeEach
  void setUp() {
    validator = new NutritionSanityBoundsValidator();
  }

  @Test
  @DisplayName("Deve aprovar refeição com calorias e proporções plausíveis")
  void shouldApproveValidMealSuggestion() {
    // 35g prot (140 kcal) + 40g carb (160 kcal) + 10g fat (90 kcal) = 390 kcal
    // Informado: 420 kcal (dentro dos 40% de margem)
    assertThatCode(() -> validator.validateMealSuggestion(420, "35g", "40g", "10g"))
        .doesNotThrowAnyException();
  }

  @Test
  @DisplayName("Deve reprovar refeição com calorias absurdamente altas (alucinação de LLM)")
  void shouldRejectExcessiveCalories() {
    assertThatThrownBy(() -> validator.validateMealSuggestion(8500, "30g", "40g", "10g"))
        .isInstanceOf(SanityBoundsException.class)
        .hasMessageContaining("fora dos limites físicos");
  }

  @Test
  @DisplayName("Deve reprovar refeição com calorias negativas ou nulas")
  void shouldRejectNegativeOrZeroCalories() {
    assertThatThrownBy(() -> validator.validateMealSuggestion(0, "30g", "40g", "10g"))
        .isInstanceOf(SanityBoundsException.class);

    assertThatThrownBy(() -> validator.validateMealSuggestion(-150, "30g", "40g", "10g"))
        .isInstanceOf(SanityBoundsException.class);
  }

  @Test
  @DisplayName("Deve reprovar incoerência biológica severa entre macros e calorias")
  void shouldRejectWildMacroInconsistency() {
    // 5g prot (20) + 5g carb (20) + 2g fat (18) = 58 kcal
    // Mas o modelo alucinou 1.200 kcal!
    assertThatThrownBy(() -> validator.validateMealSuggestion(1200, "5g", "5g", "2g"))
        .isInstanceOf(SanityBoundsException.class)
        .hasMessageContaining("Inconsistência biológica");
  }

  @Test
  @DisplayName("Deve aprovar estimativa de receita válida")
  void shouldApproveValidNutritionEstimate() {
    assertThatCode(
            () ->
                validator.validateNutritionEstimate(
                    BigDecimal.valueOf(650.0),
                    BigDecimal.valueOf(50.0),
                    BigDecimal.valueOf(40.0),
                    BigDecimal.valueOf(15.0),
                    2))
        .doesNotThrowAnyException();
  }

  @Test
  @DisplayName("Deve reprovar estimativa de receita com calorias por porção acima de 4000 kcal")
  void shouldRejectExcessiveEstimatePerServing() {
    assertThatThrownBy(
            () ->
                validator.validateNutritionEstimate(
                    BigDecimal.valueOf(15000.0),
                    BigDecimal.valueOf(50.0),
                    BigDecimal.valueOf(40.0),
                    BigDecimal.valueOf(15.0),
                    2)) // 7500 kcal por porção!
        .isInstanceOf(SanityBoundsException.class)
        .hasMessageContaining("excedem o teto físico");
  }
}
