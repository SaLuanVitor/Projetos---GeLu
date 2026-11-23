package br.com.gelu.menu.diet.dto;

import br.com.gelu.menu.diet.DietMeal;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.List;

public record DietMealResponse(
    String id,
    String dietId,
    String weekDay,
    String mealName,
    String mealTime,
    String notes,
    int orderIndex,
    List<DietMealRecipeItemResponse> recipes,
    List<DietMealPersonResponse> people,
    BigDecimal totalEstimatedCalories) {

  private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

  public static DietMealResponse from(DietMeal meal) {
    List<DietMealRecipeItemResponse> recipeResponses =
        meal.getRecipes().stream()
            .map(
                r -> {
                  BigDecimal calPerServing =
                      r.getRecipe().getEstimatedCalories() != null
                          ? r.getRecipe().getEstimatedCalories()
                          : BigDecimal.ZERO;
                  BigDecimal total = calPerServing.multiply(r.getServings());
                  return new DietMealRecipeItemResponse(
                      r.getId().toString(),
                      r.getRecipe().getId().toString(),
                      r.getRecipe().getName(),
                      r.getServings(),
                      calPerServing,
                      total,
                      r.getRecipe().getPrepTimeMinutes(),
                      r.getRecipe().getCategory());
                })
            .toList();

    List<DietMealPersonResponse> peopleResponses =
        meal.getPeople().stream()
            .map(
                u ->
                    new DietMealPersonResponse(
                        u.getId().toString(), u.getName(), u.getEmail()))
            .toList();

    BigDecimal totalCalories =
        recipeResponses.stream()
            .map(DietMealRecipeItemResponse::totalCalories)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

    return new DietMealResponse(
        meal.getId().toString(),
        meal.getDiet().getId().toString(),
        meal.getWeekDay(),
        meal.getMealName(),
        meal.getMealTime() != null ? meal.getMealTime().format(TIME_FMT) : null,
        meal.getNotes(),
        meal.getOrderIndex(),
        recipeResponses,
        peopleResponses,
        totalCalories);
  }
}
