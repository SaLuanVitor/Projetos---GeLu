CREATE TABLE recipe_media (
  id UUID PRIMARY KEY,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  object_key VARCHAR(700) NOT NULL UNIQUE,
  file_name VARCHAR(255) NOT NULL,
  content_type VARCHAR(80) NOT NULL,
  size_bytes BIGINT NOT NULL,
  is_main BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recipe_media_recipe_id ON recipe_media(recipe_id);
CREATE INDEX idx_recipe_media_user_id ON recipe_media(user_id);
CREATE UNIQUE INDEX idx_recipe_media_one_main
  ON recipe_media(recipe_id)
  WHERE is_main = TRUE;
