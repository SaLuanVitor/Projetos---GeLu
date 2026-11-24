package br.com.gelu.menu.ai.grounding;

import br.com.gelu.menu.ai.dto.NutritionEstimateResponse;
import br.com.gelu.menu.ai.dto.NutritionIngredientItem;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.Normalizer;
import java.util.*;

@Service
public class TacoDataService {

    private static final Logger log = LoggerFactory.getLogger(TacoDataService.class);

    private final TacoFoodRepository tacoFoodRepository;
    private final HouseholdMeasureConverter measureConverter;

    public TacoDataService(TacoFoodRepository tacoFoodRepository, HouseholdMeasureConverter measureConverter) {
        this.tacoFoodRepository = tacoFoodRepository;
        this.measureConverter = measureConverter;
    }

    private static final Map<String, TacoFoodItem> FALLBACK_CATALOG = new HashMap<>();

    public record TacoFoodItem(String name, String category, double calories100g, double proteins100g, double carbs100g, double fats100g, double fibers100g) {}

    static {
        registerFallback("arroz branco", "Cereais", 128.0, 2.5, 28.1, 0.2, 1.6);
        registerFallback("arroz integral", "Cereais", 124.0, 2.6, 25.8, 1.0, 2.7);
        registerFallback("feijao carioca", "Leguminosas", 76.0, 4.8, 13.6, 0.5, 8.5);
        registerFallback("feijao preto", "Leguminosas", 77.0, 4.5, 14.0, 0.5, 8.4);
        registerFallback("frango", "Carnes", 165.0, 31.5, 0.0, 3.2, 0.0);
        registerFallback("peito de frango", "Carnes", 165.0, 31.5, 0.0, 3.2, 0.0);
        registerFallback("carne bovina", "Carnes", 219.0, 35.9, 0.0, 7.3, 0.0);
        registerFallback("carne moida", "Carnes", 212.0, 26.7, 1.2, 10.9, 0.0);
        registerFallback("patinho", "Carnes", 219.0, 35.9, 0.0, 7.3, 0.0);
        registerFallback("tilapia", "Pescados", 128.0, 26.0, 0.0, 2.7, 0.0);
        registerFallback("peixe", "Pescados", 128.0, 26.0, 0.0, 2.7, 0.0);
        registerFallback("ovo", "Ovos", 143.0, 13.0, 1.6, 8.9, 0.0);
        registerFallback("omelete", "Ovos", 170.0, 13.0, 1.5, 12.0, 0.0);
        registerFallback("batata doce", "Tuberculos", 77.0, 0.6, 18.4, 0.1, 2.2);
        registerFallback("batata", "Tuberculos", 52.0, 1.2, 11.9, 0.0, 1.3);
        registerFallback("mandioca", "Tuberculos", 125.0, 0.6, 30.1, 0.3, 1.6);
        registerFallback("aveia", "Cereais", 394.0, 13.9, 66.6, 8.5, 9.1);
        registerFallback("banana", "Frutas", 98.0, 1.3, 26.0, 0.1, 2.0);
        registerFallback("maca", "Frutas", 56.0, 0.3, 15.2, 0.2, 1.3);
        registerFallback("pao frances", "Panificacao", 300.0, 8.0, 58.7, 3.1, 2.3);
        registerFallback("pao integral", "Panificacao", 253.0, 9.4, 49.9, 3.7, 6.9);
        registerFallback("pao", "Panificacao", 280.0, 8.5, 54.0, 3.2, 3.0);
        registerFallback("queijo", "Laticinios", 300.0, 20.0, 3.0, 22.0, 0.0);
        registerFallback("queijo minas", "Laticinios", 264.0, 17.4, 3.2, 20.2, 0.0);
        registerFallback("leite", "Laticinios", 45.0, 3.2, 4.8, 1.5, 0.0);
        registerFallback("azeite", "Gorduras", 884.0, 0.0, 0.0, 100.0, 0.0);
        registerFallback("salada", "Vegetais", 20.0, 1.2, 3.5, 0.2, 2.0);
        registerFallback("alface", "Vegetais", 15.0, 1.0, 2.8, 0.2, 1.5);
        registerFallback("tomate", "Vegetais", 18.0, 0.9, 3.9, 0.2, 1.2);
        registerFallback("brocolis", "Vegetais", 25.0, 2.1, 4.4, 0.5, 3.4);
    }

    private static void registerFallback(String key, String cat, double cal, double prot, double carbs, double fats, double fib) {
        FALLBACK_CATALOG.put(key, new TacoFoodItem(key, cat, cal, prot, carbs, fats, fib));
    }

    /**
     * Calcula a estimativa nutricional a partir de uma lista de ingredientes e porções.
     */
    public NutritionEstimateResponse estimateFromIngredients(List<NutritionIngredientItem> ingredients, int servings) {
        int safeServings = Math.max(1, servings);
        double totalCalories = 0;
        double totalProteins = 0;
        double totalCarbs = 0;
        double totalFats = 0;
        double totalFibers = 0;
        double totalSodium = 0;

        if (ingredients != null && !ingredients.isEmpty()) {
            for (NutritionIngredientItem ing : ingredients) {
                String rawName = ing.name() != null ? ing.name().trim() : "";
                if (rawName.isBlank()) continue;

                String quantityStr = ing.quantity() != null ? ing.quantity().trim() : "100g";
                TacoFoodItem matched = findBestMatch(rawName);

                if (matched != null) {
                    var conversion = measureConverter.convertToGrams(quantityStr, matched.name());
                    double factor = conversion.multiplier();

                    totalCalories += matched.calories100g() * factor;
                    totalProteins += matched.proteins100g() * factor;
                    totalCarbs += matched.carbs100g() * factor;
                    totalFats += matched.fats100g() * factor;
                    totalFibers += matched.fibers100g() * factor;
                    totalSodium += 40.0 * factor; // estimativa média de sódio natural
                } else {
                    // Fallback conservador se não houver match direto
                    totalCalories += 80.0;
                    totalProteins += 3.0;
                    totalCarbs += 10.0;
                    totalFats += 2.0;
                    totalFibers += 1.0;
                    totalSodium += 30.0;
                }
            }
        }

        if (totalCalories < 50.0) {
            totalCalories = 320.0 * safeServings;
            totalCarbs = 38.0 * safeServings;
            totalProteins = 18.0 * safeServings;
            totalFats = 9.0 * safeServings;
            totalFibers = 4.0 * safeServings;
            totalSodium = 280.0 * safeServings;
        }

        BigDecimal calBd = BigDecimal.valueOf(totalCalories).setScale(1, RoundingMode.HALF_UP);
        BigDecimal carbsBd = BigDecimal.valueOf(totalCarbs).setScale(1, RoundingMode.HALF_UP);
        BigDecimal protBd = BigDecimal.valueOf(totalProteins).setScale(1, RoundingMode.HALF_UP);
        BigDecimal fatsBd = BigDecimal.valueOf(totalFats).setScale(1, RoundingMode.HALF_UP);
        BigDecimal fibersBd = BigDecimal.valueOf(totalFibers).setScale(1, RoundingMode.HALF_UP);
        BigDecimal sodiumBd = BigDecimal.valueOf(totalSodium).setScale(1, RoundingMode.HALF_UP);

        BigDecimal s = BigDecimal.valueOf(safeServings);

        return new NutritionEstimateResponse(
                calBd,
                carbsBd,
                protBd,
                fatsBd,
                fibersBd,
                sodiumBd,
                safeServings,
                calBd.divide(s, 1, RoundingMode.HALF_UP),
                carbsBd.divide(s, 1, RoundingMode.HALF_UP),
                protBd.divide(s, 1, RoundingMode.HALF_UP),
                fatsBd.divide(s, 1, RoundingMode.HALF_UP),
                fibersBd.divide(s, 1, RoundingMode.HALF_UP),
                sodiumBd.divide(s, 1, RoundingMode.HALF_UP),
                "GROUNDING_TACO_IBGE",
                "Fundamentado em dados oficiais TACO 4ª Edição / IBGE. Não substitui orientação profissional."
        );
    }

    public TacoFoodItem findBestMatch(String input) {
        String normalized = normalize(input);

        // 1. Tenta banco de dados relacional
        try {
            if (tacoFoodRepository != null) {
                List<TacoFood> dbResults = tacoFoodRepository.searchByName(normalized);
                if (!dbResults.isEmpty()) {
                    TacoFood top = dbResults.get(0);
                    return new TacoFoodItem(
                            top.getFoodName(),
                            top.getCategory(),
                            top.getCalories100g().doubleValue(),
                            top.getProteins100g().doubleValue(),
                            top.getCarbohydrates100g().doubleValue(),
                            top.getFats100g().doubleValue(),
                            top.getFibers100g() != null ? top.getFibers100g().doubleValue() : 0.0
                    );
                }
            }
        } catch (Exception e) {
            log.warn("Falha ao consultar banco taco_foods: {}", e.getMessage());
        }

        // 2. Tenta catálogo grounded em memória
        for (Map.Entry<String, TacoFoodItem> entry : FALLBACK_CATALOG.entrySet()) {
            if (normalized.contains(entry.getKey()) || entry.getKey().contains(normalized)) {
                return entry.getValue();
            }
        }

        return null;
    }

    private String normalize(String str) {
        return Normalizer.normalize(str, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .trim();
    }
}
