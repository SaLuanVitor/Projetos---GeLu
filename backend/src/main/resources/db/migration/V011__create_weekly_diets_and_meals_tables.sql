-- V011: Criar tabelas para planejamento de dietas e cardapios semanais

CREATE TABLE IF NOT EXISTS weekly_diets (
    id UUID PRIMARY KEY,
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_weekly_diets_family_week UNIQUE (family_id, week_start)
);

CREATE TABLE IF NOT EXISTS diet_meals (
    id UUID PRIMARY KEY,
    diet_id UUID NOT NULL REFERENCES weekly_diets(id) ON DELETE CASCADE,
    week_day VARCHAR(20) NOT NULL, -- SEG, TER, QUA, QUI, SEX, SAB, DOM
    meal_name VARCHAR(80) NOT NULL, -- Cafe da Manha, Almoco, Lanche, Jantar, Ceia
    meal_time TIME,
    notes TEXT,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS diet_meal_recipes (
    id UUID PRIMARY KEY,
    diet_meal_id UUID NOT NULL REFERENCES diet_meals(id) ON DELETE CASCADE,
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    servings NUMERIC(8,2) NOT NULL DEFAULT 1.0,
    CONSTRAINT uk_diet_meal_recipes UNIQUE (diet_meal_id, recipe_id)
);

CREATE TABLE IF NOT EXISTS diet_meal_people (
    diet_meal_id UUID NOT NULL REFERENCES diet_meals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (diet_meal_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_weekly_diets_family_id ON weekly_diets(family_id);
CREATE INDEX IF NOT EXISTS idx_weekly_diets_user_id ON weekly_diets(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_diets_week_start ON weekly_diets(week_start);
CREATE INDEX IF NOT EXISTS idx_diet_meals_diet_id ON diet_meals(diet_id);
CREATE INDEX IF NOT EXISTS idx_diet_meals_week_day ON diet_meals(week_day);
CREATE INDEX IF NOT EXISTS idx_diet_meal_recipes_recipe_id ON diet_meal_recipes(recipe_id);
