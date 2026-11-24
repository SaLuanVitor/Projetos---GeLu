-- Migration V023: Tabela de Feedback de IA e RLHF contínuo
CREATE TABLE ai_feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    feature_type VARCHAR(50) NOT NULL, -- SUGGESTION, FOOD_VISION, FOOD_PARSER, NUTRITION_ESTIMATE
    item_title VARCHAR(255),
    is_positive BOOLEAN NOT NULL,
    comment TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_feedbacks_user ON ai_feedbacks(user_id);
CREATE INDEX idx_ai_feedbacks_feature ON ai_feedbacks(feature_type);
CREATE INDEX idx_ai_feedbacks_positive ON ai_feedbacks(is_positive);
CREATE INDEX idx_ai_feedbacks_created ON ai_feedbacks(created_at DESC);
