const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 🚀 Cria tabelas se não existirem
async function inicializar() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id BIGINT PRIMARY KEY,
      nome TEXT,
      username TEXT,
      carteira TEXT,
      valor NUMERIC DEFAULT 0,
      rendimento NUMERIC DEFAULT 0,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS rendimentos (
      id SERIAL PRIMARY KEY,
      user_id BIGINT REFERENCES usuarios(id),
      percentual NUMERIC,
      valor NUMERIC,
      data TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS resgates (
      id SERIAL PRIMARY KEY,
      user_id BIGINT REFERENCES usuarios(id),
      valor NUMERIC,
      status TEXT DEFAULT 'pendente',
      solicitado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

module.exports = {
  query: (text, params) => pool.query(text, params),
  inicializar
};