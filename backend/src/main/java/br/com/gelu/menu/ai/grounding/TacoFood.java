package br.com.gelu.menu.ai.grounding;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "taco_foods")
public class TacoFood {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "food_name", nullable = false)
    private String foodName;

    @Column(nullable = false)
    private String category;

    @Column(name = "calories_100g", nullable = false, precision = 8, scale = 2)
    private BigDecimal calories100g;

    @Column(name = "proteins_100g", nullable = false, precision = 8, scale = 2)
    private BigDecimal proteins100g;

    @Column(name = "carbohydrates_100g", nullable = false, precision = 8, scale = 2)
    private BigDecimal carbohydrates100g;

    @Column(name = "fats_100g", nullable = false, precision = 8, scale = 2)
    private BigDecimal fats100g;

    @Column(name = "fibers_100g", precision = 8, scale = 2)
    private BigDecimal fibers100g;

    @Column(name = "sodium_mg_100g", precision = 8, scale = 2)
    private BigDecimal sodiumMg100g;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public TacoFood() {}

    public TacoFood(UUID id, String foodName, String category, BigDecimal calories100g, BigDecimal proteins100g, BigDecimal carbohydrates100g, BigDecimal fats100g, BigDecimal fibers100g, BigDecimal sodiumMg100g, LocalDateTime createdAt) {
        this.id = id;
        this.foodName = foodName;
        this.category = category;
        this.calories100g = calories100g;
        this.proteins100g = proteins100g;
        this.carbohydrates100g = carbohydrates100g;
        this.fats100g = fats100g;
        this.fibers100g = fibers100g;
        this.sodiumMg100g = sodiumMg100g;
        this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getFoodName() { return foodName; }
    public void setFoodName(String foodName) { this.foodName = foodName; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public BigDecimal getCalories100g() { return calories100g; }
    public void setCalories100g(BigDecimal calories100g) { this.calories100g = calories100g; }

    public BigDecimal getProteins100g() { return proteins100g; }
    public void setProteins100g(BigDecimal proteins100g) { this.proteins100g = proteins100g; }

    public BigDecimal getCarbohydrates100g() { return carbohydrates100g; }
    public void setCarbohydrates100g(BigDecimal carbohydrates100g) { this.carbohydrates100g = carbohydrates100g; }

    public BigDecimal getFats100g() { return fats100g; }
    public void setFats100g(BigDecimal fats100g) { this.fats100g = fats100g; }

    public BigDecimal getFibers100g() { return fibers100g; }
    public void setFibers100g(BigDecimal fibers100g) { this.fibers100g = fibers100g; }

    public BigDecimal getSodiumMg100g() { return sodiumMg100g; }
    public void setSodiumMg100g(BigDecimal sodiumMg100g) { this.sodiumMg100g = sodiumMg100g; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
