package br.com.gelu.menu.ai.grounding;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class HouseholdMeasureConverterTest {

    private HouseholdMeasureConverter converter;

    @BeforeEach
    void setUp() {
        converter = new HouseholdMeasureConverter();
    }

    @Test
    @DisplayName("Deve converter colheres de sopa de arroz corretamente")
    void testColheresDeSopaArroz() {
        var result = converter.convertToGrams("3 colheres de sopa", "Arroz branco cozido");
        // 3 colheres * 25g = 75g
        assertThat(result.grams()).isEqualByComparingTo(BigDecimal.valueOf(75.0));
        assertThat(result.multiplier()).isEqualTo(0.75);
    }

    @Test
    @DisplayName("Deve converter concha de feijão para gramatura IBGE")
    void testConchaFeijao() {
        var result = converter.convertToGrams("1 concha", "Feijão carioca");
        // 1 concha = 130g
        assertThat(result.grams()).isEqualByComparingTo(BigDecimal.valueOf(130.0));
    }

    @Test
    @DisplayName("Deve reconhecer gramas explícitas diretamente")
    void testGramasExplicitas() {
        var result = converter.convertToGrams("150g", "Frango grelhado");
        assertThat(result.grams()).isEqualByComparingTo(BigDecimal.valueOf(150.0));
        assertThat(result.multiplier()).isEqualTo(1.5);
    }

    @Test
    @DisplayName("Deve converter filé / bife médio para ~120g")
    void testFileBife() {
        var result = converter.convertToGrams("2 filés médios", "Peito de frango");
        // 2 * 120g = 240g
        assertThat(result.grams()).isEqualByComparingTo(BigDecimal.valueOf(240.0));
    }
}
