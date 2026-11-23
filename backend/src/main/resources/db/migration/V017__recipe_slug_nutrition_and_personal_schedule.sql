-- V017: Recipe slug, nutrition macros, and personal schedule & goals support

-- 1. Recipes slug e macronutrientes
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS slug VARCHAR(180);
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS carbohydrates NUMERIC(8,2);
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS proteins NUMERIC(8,2);
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS fats NUMERIC(8,2);
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS fibers NUMERIC(8,2);
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS sodium NUMERIC(8,2);

CREATE UNIQUE INDEX IF NOT EXISTS uk_recipes_slug ON recipes(slug);

-- 2. Schedule activities permitindo agenda individual
ALTER TABLE schedule_activities ALTER COLUMN family_id DROP NOT NULL;
ALTER TABLE schedule_activities ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_schedule_activities_user_day ON schedule_activities(user_id, day_of_week);

-- 3. Family weekly goals permitindo metas individuais
ALTER TABLE family_weekly_goals ALTER COLUMN family_id DROP NOT NULL;
ALTER TABLE family_weekly_goals ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_family_goals_user ON family_weekly_goals(user_id);
