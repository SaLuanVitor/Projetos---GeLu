CREATE TABLE couple_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    category VARCHAR(30) NOT NULL DEFAULT 'RECADO',
    color VARCHAR(30) NOT NULL DEFAULT 'yellow',
    pinned BOOLEAN NOT NULL DEFAULT TRUE,
    acknowledged_at TIMESTAMP,
    acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_couple_notes_family ON couple_notes(family_id, resolved, pinned);

CREATE TABLE schedule_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    day_of_week VARCHAR(10) NOT NULL,
    start_time VARCHAR(5) NOT NULL,
    end_time VARCHAR(5) NOT NULL,
    title VARCHAR(150) NOT NULL,
    category VARCHAR(30) NOT NULL DEFAULT 'TRABALHO',
    notes TEXT,
    goal_tag VARCHAR(50),
    recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
    assigned_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_schedule_activities_family_day ON schedule_activities(family_id, day_of_week);

CREATE TABLE schedule_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES schedule_activities(id) ON DELETE CASCADE,
    completion_date DATE NOT NULL,
    completed_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_activity_date UNIQUE (activity_id, completion_date)
);

CREATE INDEX idx_schedule_completions_activity ON schedule_completions(activity_id, completion_date);

CREATE TABLE family_weekly_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    goal_tag VARCHAR(50) NOT NULL,
    target_count INT NOT NULL DEFAULT 1,
    unit VARCHAR(30) NOT NULL DEFAULT 'vezes',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_family_goals_family ON family_weekly_goals(family_id);
