CREATE TABLE recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    name VARCHAR(150) NOT NULL,
    description TEXT,
    category VARCHAR(80),
    prep_time_minutes INTEGER,
    estimated_calories NUMERIC(8,2),
    servings INTEGER,
    video_url VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recipes_user_created_at ON recipes(user_id, created_at DESC);
CREATE INDEX idx_recipes_user_category ON recipes(user_id, category);

CREATE TABLE recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    name VARCHAR(150) NOT NULL,
    quantity VARCHAR(80),
    unit VARCHAR(40)
);

CREATE INDEX idx_recipe_ingredients_recipe_position ON recipe_ingredients(recipe_id, position);
CREATE INDEX idx_recipe_ingredients_name ON recipe_ingredients(name);

CREATE TABLE recipe_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    instruction TEXT NOT NULL
);

CREATE INDEX idx_recipe_steps_recipe_position ON recipe_steps(recipe_id, position);
