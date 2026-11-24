-- Migration V015: Memória Viva JSONB e Perfil de Hábitos Alimentares do Usuário
CREATE TABLE user_dietary_habits (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    habit_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_dietary_habits_user ON user_dietary_habits(user_id);
