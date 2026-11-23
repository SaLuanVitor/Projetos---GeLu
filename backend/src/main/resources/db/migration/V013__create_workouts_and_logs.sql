CREATE TABLE workouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'MUSCULACAO',
    calories_per_hour INT NOT NULL DEFAULT 400,
    default_duration_minutes INT NOT NULL DEFAULT 60,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_workouts_user ON workouts(user_id);
CREATE INDEX idx_workouts_family ON workouts(family_id);

CREATE TABLE workout_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES families(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workout_id UUID REFERENCES workouts(id) ON DELETE SET NULL,
    title VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'MUSCULACAO',
    duration_minutes INT NOT NULL DEFAULT 60,
    calories_burned INT NOT NULL DEFAULT 400,
    performed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    completed BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_workout_logs_user ON workout_logs(user_id);
CREATE INDEX idx_workout_logs_family ON workout_logs(family_id);
CREATE INDEX idx_workout_logs_date ON workout_logs(performed_at);
