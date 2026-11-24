-- Migration V014: Tabela TACO / IBGE para Grounding Nutricional
CREATE TABLE taco_foods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    food_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    calories_100g NUMERIC(8,2) NOT NULL,
    proteins_100g NUMERIC(8,2) NOT NULL,
    carbohydrates_100g NUMERIC(8,2) NOT NULL,
    fats_100g NUMERIC(8,2) NOT NULL,
    fibers_100g NUMERIC(8,2) DEFAULT 0.0,
    sodium_mg_100g NUMERIC(8,2) DEFAULT 0.0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_taco_foods_name ON taco_foods(LOWER(food_name));
CREATE INDEX idx_taco_foods_category ON taco_foods(category);

-- Alimentos base essenciais da culinária brasileira (TACO 4ª edição)
INSERT INTO taco_foods (food_name, category, calories_100g, proteins_100g, carbohydrates_100g, fats_100g, fibers_100g, sodium_mg_100g) VALUES
('Arroz branco cozido', 'Cereais', 128.0, 2.5, 28.1, 0.2, 1.6, 1.0),
('Arroz integral cozido', 'Cereais', 124.0, 2.6, 25.8, 1.0, 2.7, 1.0),
('Feijão carioca cozido', 'Leguminosas', 76.0, 4.8, 13.6, 0.5, 8.5, 2.0),
('Feijão preto cozido', 'Leguminosas', 77.0, 4.5, 14.0, 0.5, 8.4, 2.0),
('Peito de frango grelhado', 'Carnes e derivados', 165.0, 31.5, 0.0, 3.2, 0.0, 50.0),
('Peito de frango cozido', 'Carnes e derivados', 163.0, 31.0, 0.0, 3.0, 0.0, 52.0),
('Carne bovina patinho grelhado', 'Carnes e derivados', 219.0, 35.9, 0.0, 7.3, 0.0, 65.0),
('Carne moída refogada', 'Carnes e derivados', 212.0, 26.7, 1.2, 10.9, 0.0, 80.0),
('Filé de tilápia grelhado', 'Pescados', 128.0, 26.0, 0.0, 2.7, 0.0, 56.0),
('Ovo de galinha cozido', 'Ovos e derivados', 143.0, 13.0, 1.6, 8.9, 0.0, 146.0),
('Ovo de galinha frito', 'Ovos e derivados', 240.0, 15.6, 1.2, 18.6, 0.0, 165.0),
('Omelete simples', 'Ovos e derivados', 170.0, 13.0, 1.5, 12.0, 0.0, 160.0),
('Batata doce cozida', 'Tubérculos', 77.0, 0.6, 18.4, 0.1, 2.2, 3.0),
('Batata inglesa cozida', 'Tubérculos', 52.0, 1.2, 11.9, 0.0, 1.3, 2.0),
('Mandioca cozida', 'Tubérculos', 125.0, 0.6, 30.1, 0.3, 1.6, 1.0),
('Aveia em flocos', 'Cereais', 394.0, 13.9, 66.6, 8.5, 9.1, 5.0),
('Banana prata crua', 'Frutas', 98.0, 1.3, 26.0, 0.1, 2.0, 1.0),
('Maçã fuji com casca', 'Frutas', 56.0, 0.3, 15.2, 0.2, 1.3, 1.0),
('Mamão papaia cru', 'Frutas', 40.0, 0.5, 10.4, 0.1, 1.0, 2.0),
('Pão francês', 'Panificação', 300.0, 8.0, 58.7, 3.1, 2.3, 648.0),
('Pão de forma integral', 'Panificação', 253.0, 9.4, 49.9, 3.7, 6.9, 506.0),
('Queijo minas frescal', 'Laticínios', 264.0, 17.4, 3.2, 20.2, 0.0, 430.0),
('Queijo mussarela', 'Laticínios', 330.0, 22.6, 3.0, 25.2, 0.0, 580.0),
('Leite desnatado', 'Laticínios', 35.0, 3.4, 4.9, 0.1, 0.0, 53.0),
('Leite integral', 'Laticínios', 60.0, 3.1, 4.7, 3.2, 0.0, 50.0),
('Iogurte natural desnatado', 'Laticínios', 43.0, 4.0, 6.0, 0.3, 0.0, 60.0),
('Azeite de oliva extravirgem', 'Óleos e gorduras', 884.0, 0.0, 0.0, 100.0, 0.0, 0.0),
('Salada verde alface e tomate', 'Hortaliças', 18.0, 1.0, 3.5, 0.2, 1.5, 8.0),
('Brócolis cozido', 'Hortaliças', 25.0, 2.1, 4.4, 0.5, 3.4, 12.0),
('Cenoura cozida', 'Hortaliças', 30.0, 0.8, 6.7, 0.2, 2.6, 25.0);
