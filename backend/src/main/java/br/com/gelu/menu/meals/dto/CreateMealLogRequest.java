package br.com.gelu.menu.meals.dto;

import br.com.gelu.menu.meals.FoodItemIdentified;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record CreateMealLogRequest(
    String mealType,
    String dishName,
    String photoUrl,
    BigDecimal totalCalories,
    BigDecimal proteins,
    BigDecimal carbohydrates,
    BigDecimal fats,
    BigDecimal fibers,
    BigDecimal sodium,
    List<FoodItemIdentified> items,
    String aiNotes,
    UUID dietMealId,
    String status,
    String inputMethod,
    String rawInputText,
    String skipReason,
    LocalDateTime consumedAt) {

  public CreateMealLogRequest(
      String mealType,
      String dishName,
      BigDecimal totalCalories,
      BigDecimal proteins,
      BigDecimal carbohydrates,
      BigDecimal fats,
      LocalDateTime consumedAt,
      String notes) {
    this(
        mealType,
        dishName,
        null,
        totalCalories,
        proteins,
        carbohydrates,
        fats,
        BigDecimal.ZERO,
        BigDecimal.ZERO,
        List.of(),
        notes,
        null,
        "COMPLETED",
        "EXCEL_IMPORT",
        null,
        null,
        consumedAt);
  }
}
