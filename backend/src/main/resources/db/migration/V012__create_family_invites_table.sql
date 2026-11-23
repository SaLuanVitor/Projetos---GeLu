CREATE TABLE family_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    invited_email VARCHAR(255) NOT NULL,
    invited_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(30) NOT NULL DEFAULT 'MEMBER',
    token VARCHAR(100) NOT NULL UNIQUE,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_family_invites_family ON family_invites(family_id);
CREATE INDEX idx_family_invites_email ON family_invites(invited_email);
CREATE INDEX idx_family_invites_token ON family_invites(token);
CREATE INDEX idx_family_invites_status ON family_invites(status);
