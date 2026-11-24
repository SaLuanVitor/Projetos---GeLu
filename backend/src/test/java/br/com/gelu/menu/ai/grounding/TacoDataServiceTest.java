package br.com.gelu.menu.ai.grounding;

import br.com.gelu.menu.ai.dto.NutritionIngredientItem;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TacoDataServiceTest {

    @Mock
    private TacoFoodRepository tacoFoodRepository;

    private HouseholdMeasureConverter measureConverter;
    private TacoDataService tacoDataService;

    @BeforeEach
    void setUp() {
        measureConverter = new HouseholdMeasureConverter();
        tacoDataService = new TacoDataService(tacoFoodRepository, measureConverter);
    }

    @Test
    @DisplayName("Deve estimar refeição com ingredientes TACO conhecidos usando fallback seguro")
    void testEstimateFromIngredientsFallbackCatalog() {
        when(tacoFoodRepository.searchByName(anyString())).thenReturn(Collections.emptyList());

        List<NutritionIngredientItem> ingredients = List.of(
                new NutritionIngredientItem("Arroz branco cozido", "3 colheres de sopa", "colher"),
                new NutritionIngredientItem("Feijão carioca", "1 concha", "concha"),
                new NutritionIngredientItem("Peito de frango", "1 filé", "unidade")
        );

        var response = tacoDataService.estimateFromIngredients(ingredients, 1);

        assertThat(response).isNotNull();
        assertThat(response.source()).isEqualTo("GROUNDING_TACO_IBGE");
        assertThat(response.totalCalories().doubleValue()).isGreaterThan(200.0);
        assertThat(response.proteins().doubleValue()).isGreaterThan(25.0);
        assertThat(response.carbohydrates().doubleValue()).isGreaterThan(20.0);
    }
}
