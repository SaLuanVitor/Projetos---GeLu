CREATE TABLE audit_logs (
    id UUID PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    family_id UUID,
    action VARCHAR(50) NOT NULL,
    user_id UUID NOT NULL,
    user_name VARCHAR(150) NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    CONSTRAINT fk_audit_family FOREIGN KEY (family_id) REFERENCES families (id) ON DELETE CASCADE
);

CREATE INDEX idx_audit_logs_family_id ON audit_logs (family_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs (entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at DESC);
