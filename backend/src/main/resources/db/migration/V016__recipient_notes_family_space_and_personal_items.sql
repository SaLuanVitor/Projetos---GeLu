-- V016: Suporte a destinatário específico em bilhetes, tabela para 'Nosso Espaço' e escopo pessoal em receitas

-- 1. Destinatário de bilhete (null = todos da família; preenchido = privado para o destinatário ou autor)
ALTER TABLE couple_notes ADD COLUMN recipient_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX idx_couple_notes_recipient ON couple_notes(recipient_user_id);

-- 2. Tabela para a seção 'Nosso Espaço' (acordos, rotina, alimentação, bem-estar, finanças e contatos)
CREATE TABLE family_space_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(30) NOT NULL, -- 'ROTINA', 'ALIMENTACAO', 'BEM_ESTAR', 'FINANCAS', 'CONTATOS'
    title VARCHAR(150) NOT NULL,
    description TEXT,
    highlight_tag VARCHAR(50),
    pinned BOOLEAN NOT NULL DEFAULT FALSE,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_family_space_items_family_cat ON family_space_items(family_id, category);

-- 3. Escopo pessoal vs familiar em receitas
ALTER TABLE recipes ADD COLUMN is_personal BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE recipes ADD COLUMN family_id UUID REFERENCES families(id) ON DELETE SET NULL;
CREATE INDEX idx_recipes_family_id ON recipes(family_id);
CREATE INDEX idx_recipes_is_personal ON recipes(user_id, is_personal);
