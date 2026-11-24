-- V025: Adiciona suporte a rotina semanal de treinos, lista de exercícios e intensidade
ALTER TABLE workouts
    ADD COLUMN IF NOT EXISTS days_of_week VARCHAR(100),
    ADD COLUMN IF NOT EXISTS exercises_json TEXT,
    ADD COLUMN IF NOT EXISTS favorite BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS intensity VARCHAR(30) NOT NULL DEFAULT 'MODERADO';

CREATE INDEX IF NOT EXISTS idx_workouts_favorite ON workouts(user_id, favorite);
