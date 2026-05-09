CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    email VARCHAR(180) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    birth_date DATE,
    height_cm NUMERIC(5,2),
    current_weight NUMERIC(6,2),
    biological_sex VARCHAR(20),
    goal VARCHAR(80),
    basal_calories NUMERIC(8,2),
    daily_calorie_goal NUMERIC(8,2),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX uk_users_email ON users(email);

CREATE TABLE ai_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    suggestion_type VARCHAR(50) NOT NULL,
    context_summary TEXT NOT NULL,
    suggestion TEXT NOT NULL,
    accepted BOOLEAN,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_suggestions_user_type ON ai_suggestions(user_id, suggestion_type);
