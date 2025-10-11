const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'cardapio.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Erro ao conectar ao banco de dados para inicialização:", err.message);
    } else {
        console.log("Conectado ao banco de dados para inicialização.");
        db.serialize(() => {
            // Drop tables if they exist (for fresh start)
            db.run("DROP TABLE IF EXISTS cardapio");
            db.run("DROP TABLE IF EXISTS receitas");

            // Create receitas table
            db.run(`
                CREATE TABLE receitas (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nome TEXT NOT NULL,
                    ingredientes TEXT NOT NULL, -- Ingredientes separados por linha
                    descricao TEXT
                )
            `);

            // Create cardapio table
            db.run(`
                CREATE TABLE cardapio (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    dia TEXT UNIQUE NOT NULL, -- Garante que cada dia só tem 1 receita
                    receita_id INTEGER,
                    FOREIGN KEY (receita_id) REFERENCES receitas(id)
                )
            `);

            // Populate cardapio table with default days
            const stmt = db.prepare("INSERT INTO cardapio (dia, receita_id) VALUES (?, NULL)");
            const diasSemana = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"];
            diasSemana.forEach(dia => stmt.run(dia));
            stmt.finalize();

            console.log("Banco de dados inicializado com sucesso!");
            console.log(`Você pode agora rodar 'node server.js'`);
        });
    }
});