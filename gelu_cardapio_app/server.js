const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

// ==========================================================
// CONFIGURAÇÃO DO EXPRESS
// ==========================================================
// Permite que o Express entenda JSON no corpo das requisições (para POST/PUT)
app.use(express.json()); 
// Serve arquivos estáticos (HTML, CSS, JS do frontend) da pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================================
// INICIALIZAÇÃO DO BANCO DE DADOS SQLite
// ==========================================================
const db = new sqlite3.Database(path.join(__dirname, 'cardapio.db'), (err) => {
    if (err) {
        console.error("Erro ao conectar ao banco de dados:", err.message);
    } else {
        console.log("Conectado ao banco de dados SQLite.");
    }
});

// ==========================================================
// ROTAS DE API (BACKEND)
// ==========================================================

// --- ROTAS PARA RECEITAS ---
// GET /api/receitas: Retorna todas as receitas cadastradas
app.get('/api/receitas', (req, res) => {
    db.all("SELECT id, nome, ingredientes, descricao FROM receitas ORDER BY nome", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// POST /api/receitas: Adiciona uma nova receita
app.post('/api/receitas', (req, res) => {
    const { nome, ingredientes, descricao } = req.body;
    if (!nome || !ingredientes) {
        return res.status(400).json({ error: "Nome e ingredientes são obrigatórios." });
    }
    db.run("INSERT INTO receitas (nome, ingredientes, descricao) VALUES (?, ?, ?)", 
           [nome, ingredientes, descricao], 
           function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID, nome, ingredientes, descricao });
    });
});

// PUT /api/receitas/:id: Atualiza uma receita existente
app.put('/api/receitas/:id', (req, res) => {
    const { id } = req.params;
    const { nome, ingredientes, descricao } = req.body;
    
    // IMPORTANTE: Verifique se as variáveis req.body estão a ser lidas!
    if (!nome || !ingredientes) {
        return res.status(400).json({ error: "Nome e ingredientes são obrigatórios para atualizar a receita." });
    }

    const sql = `UPDATE receitas SET nome = ?, ingredientes = ?, descricao = ? WHERE id = ?`;
    
    db.run(sql, [nome, ingredientes, descricao, id], function(err) {
        if (err) {
            // Este log é vital para o debug
            console.error("Erro ao executar UPDATE no SQLite:", err.message); 
            return res.status(500).json({ error: "Erro interno do servidor ao atualizar a receita." });
        }
        if (this.changes === 0) {
            // Se this.changes for 0, o ID não existe ou os dados são os mesmos
            return res.status(404).json({ message: "Receita não encontrada para o ID fornecido ou nenhum dado alterado." });
        }
        res.json({ message: "Receita atualizada com sucesso.", id: parseInt(id) });
    });
});

// DELETE /api/receitas/:id: Remove uma receita
app.delete('/api/receitas/:id', (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM receitas WHERE id = ?", [id], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: "Receita não encontrada." });
        }
        // Também remove a associação no cardápio, se houver
        db.run("UPDATE cardapio SET receita_id = NULL WHERE receita_id = ?", [id]);
        res.json({ message: "Receita removida com sucesso." });
    });
});

// --- ROTAS PARA O CARDÁPIO ---
// GET /api/cardapio: Retorna o cardápio semanal completo com detalhes das receitas
app.get('/api/cardapio', (req, res) => {
    const sql = `
        SELECT c.dia, r.id AS receita_id, r.nome AS receita_nome, r.ingredientes
        FROM cardapio c
        LEFT JOIN receitas r ON c.receita_id = r.id
        ORDER BY CASE c.dia
            WHEN 'Segunda-feira' THEN 1 WHEN 'Terça-feira' THEN 2 WHEN 'Quarta-feira' THEN 3
            WHEN 'Quinta-feira' THEN 4 WHEN 'Sexta-feira' THEN 5 WHEN 'Sábado' THEN 6
            WHEN 'Domingo' THEN 7 END;
    `;
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// POST /api/cardapio: Atualiza ou define uma receita para um dia específico
app.post('/api/cardapio', (req, res) => {
    const { dia, receita_id } = req.body; // receita_id pode ser null para limpar
    
    // Convert recipe_id to NULL if it's an empty string or 0
    const final_receita_id = receita_id ? parseInt(receita_id) : null;

    db.run("UPDATE cardapio SET receita_id = ? WHERE dia = ?", 
           [final_receita_id, dia], 
           function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: "Dia do cardápio não encontrado ou receita_id inválido." });
        }
        res.json({ message: `Cardápio para ${dia} atualizado.`, dia, receita_id: final_receita_id });
    });
});

// POST /api/cardapio: Atualiza ou define uma receita para um dia específico
// GET /api/compras: Gera uma lista de ingredientes agregados do cardápio
app.get('/api/compras', (req, res) => {
    const sql = `
        SELECT r.ingredientes
        FROM cardapio c
        JOIN receitas r ON c.receita_id = r.id
        WHERE c.receita_id IS NOT NULL;
    `;
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        const listaCompras = {};
        rows.forEach(row => {
            const ingredientesArray = row.ingredientes.split('\n').map(item => item.trim()).filter(item => item);
            ingredientesArray.forEach(ingrediente => {
                const key = ingrediente.toLowerCase();
                listaCompras[key] = true; // Usar um objeto para ter itens únicos
            });
        });
        res.json(Object.keys(listaCompras).sort()); // Retorna itens únicos e ordenados
    });
});


// ==========================================================
// TRATAMENTO DE 404 PARA EVITAR RETORNO DE HTML EM REQUISIÇÕES DE API
// ==========================================================

// 1. Manipulador 404 para rotas /api/* que não foram encontradas.
// Este bloco garante que, se o Express não encontrar nenhuma das rotas acima que começam com /api,
// ele retorne um erro JSON, impedindo o "Unexpected token '<'".
app.use('/api', (req, res) => {
    res.status(404).json({ 
        error: "Rota de API não encontrada.", 
        path: req.path, 
        method: req.method,
        detail: `Nenhuma rota ${req.method} correspondente a /api${req.path} foi definida no servidor.`
    });
});

// 2. Manipulador 404 genérico (para URLs que não são /api e não são arquivos estáticos).
app.use((req, res) => {
    res.status(404).send("Página não encontrada.");
});


// ==========================================================
// INICIALIZAÇÃO DO SERVIDOR
// ==========================================================
app.listen(PORT, () => {
    console.log(`Servidor Node.js rodando em http://localhost:${PORT}`);
});
