package br.com.gelu.menu.meals.dto;

import br.com.gelu.menu.meals.FoodItemIdentified;
import java.math.BigDecimal;
import java.util.List;

public record AnalyzeMealPhotoResponse(
    String dishName,
    String confidence,
    String photoUrl,
    BigDecimal totalCalories,
    BigDecimal proteins,
    BigDecimal carbohydrates,
    BigDecimal fats,
    BigDecimal fibers,
    BigDecimal sodium,
    List<FoodItemIdentified> items,
    String nutritionNotes) {}
