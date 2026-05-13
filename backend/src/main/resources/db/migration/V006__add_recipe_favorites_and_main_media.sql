ALTER TABLE recipes
    ADD COLUMN favorite BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE recipes
    ADD COLUMN main_media_type VARCHAR(20) NOT NULL DEFAULT 'IMAGE';

ALTER TABLE recipes
    ADD CONSTRAINT chk_recipes_main_media_type
        CHECK (main_media_type IN ('IMAGE', 'VIDEO'));

CREATE INDEX idx_recipes_user_favorite_created_at
    ON recipes(user_id, favorite DESC, created_at DESC);
