package br.com.gelu.menu.diet.dto;

import br.com.gelu.menu.diet.WeeklyDiet;
import java.time.format.DateTimeFormatter;
import java.util.List;

public record WeeklyDietResponse(
    String id,
    String familyId,
    String userId,
    String title,
    String weekStart,
    String weekEnd,
    List<DietMealResponse> meals) {

  private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ISO_LOCAL_DATE;

  public static WeeklyDietResponse from(WeeklyDiet diet) {
    return new WeeklyDietResponse(
        diet.getId().toString(),
        diet.getFamily() != null ? diet.getFamily().getId().toString() : null,
        diet.getUser().getId().toString(),
        diet.getTitle(),
        diet.getWeekStart().format(DATE_FMT),
        diet.getWeekEnd().format(DATE_FMT),
        diet.getMeals().stream().map(DietMealResponse::from).toList());
  }
}
