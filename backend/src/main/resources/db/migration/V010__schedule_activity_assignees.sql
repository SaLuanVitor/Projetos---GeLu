CREATE TABLE schedule_activity_assignees (
    activity_id UUID NOT NULL,
    user_id UUID NOT NULL,
    PRIMARY KEY (activity_id, user_id),
    CONSTRAINT fk_assignee_activity FOREIGN KEY (activity_id) REFERENCES schedule_activities (id) ON DELETE CASCADE,
    CONSTRAINT fk_assignee_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_activity_assignees_user ON schedule_activity_assignees (user_id);

-- Migra atribuições existentes da coluna antiga caso existam
INSERT INTO schedule_activity_assignees (activity_id, user_id)
SELECT id, assigned_to_user_id
FROM schedule_activities
WHERE assigned_to_user_id IS NOT NULL
ON CONFLICT DO NOTHING;
