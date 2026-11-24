-- V020: Extensão de meal_logs para rastreamento de planejamento e criação de hábitos alimentares da IA

-- 1. Campos para vincular refeição planejada, status de execução e método de entrada
ALTER TABLE meal_logs
  ADD COLUMN IF NOT EXISTS diet_meal_id UUID REFERENCES diet_meals(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'CUSTOM_CONSUMED',
  ADD COLUMN IF NOT EXISTS input_method VARCHAR(30) NOT NULL DEFAULT 'MANUAL',
  ADD COLUMN IF NOT EXISTS raw_input_text TEXT,
  ADD COLUMN IF NOT EXISTS skip_reason VARCHAR(100);

-- 2. Índice composto para buscas rápidas de checklist diário
CREATE INDEX IF NOT EXISTS idx_meal_logs_user_diet_date ON meal_logs(user_id, diet_meal_id, consumed_at);

-- 3. Tabela de hábitos agregados e aprendizado contínuo da IA
CREATE TABLE IF NOT EXISTS user_eating_habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  habit_key VARCHAR(80) NOT NULL,
  habit_data JSONB NOT NULL,
  confidence_score NUMERIC(5, 2) DEFAULT 1.0,
  last_analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT uk_user_habit_key UNIQUE (user_id, habit_key)
);

CREATE INDEX IF NOT EXISTS idx_user_habits_user ON user_eating_habits(user_id);
