package br.com.gelu.menu.meals;

import java.math.BigDecimal;

public record FoodItemIdentified(
    String name,
    String portion,
    BigDecimal calories,
    BigDecimal proteins,
    BigDecimal carbohydrates,
    BigDecimal fats) {}
