-- V015: Configurações globais do sistema, logs de IA e auditoria de sistema

CREATE TABLE system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by VARCHAR(255)
);

INSERT INTO system_settings (key, value, updated_at, updated_by) VALUES
    ('support_email', 'luanvitors_852@hotmail.com', NOW(), 'system'),
    ('support_phone', '(11) 99999-9999', NOW(), 'system'),
    ('support_whatsapp', '5511999999999', NOW(), 'system'),
    ('support_hours', 'Segunda a Sexta, das 09:00 às 18:00', NOW(), 'system'),
    ('system_broadcast_banner', '', NOW(), 'system'),
    ('gemini_api_key', '', NOW(), 'system'),
    ('gemini_model', 'gemini-1.5-flash', NOW(), 'system');

CREATE TABLE ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    family_id UUID REFERENCES families(id) ON DELETE SET NULL,
    operation_type VARCHAR(50) NOT NULL,
    model_name VARCHAR(50) NOT NULL,
    prompt_tokens INT DEFAULT 0,
    completion_tokens INT DEFAULT 0,
    total_tokens INT DEFAULT 0,
    latency_ms BIGINT DEFAULT 0,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ai_usage_logs_created_at ON ai_usage_logs(created_at DESC);

CREATE TABLE system_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_email VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_system_audit_logs_created_at ON system_audit_logs(created_at DESC);
