package br.com.gelu.menu.meals.dto;

import br.com.gelu.menu.meals.FoodItemIdentified;
import java.util.List;

public record ParseMealTextResponse(
    String dishName,
    Double totalCalories,
    Double proteins,
    Double carbohydrates,
    Double fats,
    Double fibers,
    Double sodium,
    List<FoodItemIdentified> items,
    String aiNotes) {}
