-- V019: Create meal logs table for visual food recognition and daily nutrition diary

CREATE TABLE IF NOT EXISTS meal_logs (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    family_id UUID REFERENCES families(id) ON DELETE SET NULL,
    meal_type VARCHAR(30) NOT NULL, -- BREAKFAST, LUNCH, DINNER, SNACK, OTHER
    dish_name VARCHAR(150) NOT NULL,
    photo_url VARCHAR(500),
    total_calories NUMERIC(8,2) NOT NULL,
    proteins NUMERIC(8,2) NOT NULL,
    carbohydrates NUMERIC(8,2) NOT NULL,
    fats NUMERIC(8,2) NOT NULL,
    fibers NUMERIC(8,2) DEFAULT 0,
    sodium NUMERIC(8,2) DEFAULT 0,
    items_json TEXT,
    ai_notes TEXT,
    consumed_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_meal_logs_user_consumed ON meal_logs(user_id, consumed_at);
CREATE INDEX IF NOT EXISTS idx_meal_logs_family_consumed ON meal_logs(family_id, consumed_at);
