-- V024: Favoritos de receitas por usuário
CREATE TABLE IF NOT EXISTS user_favorite_recipes (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_user_favorite_recipes PRIMARY KEY (user_id, recipe_id)
);

CREATE INDEX IF NOT EXISTS idx_user_favorite_recipes_user_id ON user_favorite_recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorite_recipes_recipe_id ON user_favorite_recipes(recipe_id);

-- Migra favoritos legados da tabela recipes para a nova tabela por usuário
INSERT INTO user_favorite_recipes (user_id, recipe_id, created_at)
SELECT user_id, id, created_at
FROM recipes
WHERE favorite = TRUE
ON CONFLICT DO NOTHING;
