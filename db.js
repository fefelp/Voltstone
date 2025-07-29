const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 🚀 Criação automática das tabelas
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

    CREATE TABLE IF NOT EXISTS transacoes (
      hash TEXT PRIMARY KEY,
      user_id BIGINT REFERENCES usuarios(id),
      valor NUMERIC,
      data TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function getUser(id) {
  const res = await pool.query("SELECT * FROM usuarios WHERE id = $1", [id]);
  return res.rows[0];
}

async function getUserByAddress(address) {
  const res = await pool.query("SELECT * FROM usuarios WHERE carteira = $1", [address.toLowerCase()]);
  return res.rows[0];
}

async function addUser(id, nome, username = "") {
  await pool.query("INSERT INTO usuarios (id, nome, username) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING", [id, nome, username]);
}

async function setCarteira(id, carteira) {
  await pool.query("UPDATE usuarios SET carteira = $1 WHERE id = $2", [carteira.toLowerCase(), id]);
}

async function getCarteiraInfo(id) {
  const res = await pool.query("SELECT valor, rendimento FROM usuarios WHERE id = $1", [id]);
  return res.rows[0];
}

async function registrarDeposito(id, valor, hash) {
  await pool.query(`
    INSERT INTO transacoes (hash, user_id, valor) VALUES ($1, $2, $3);
    UPDATE usuarios SET valor = valor + $3 WHERE id = $2;
  `, [hash, id, valor]);
}

async function isTxRegistrada(hash) {
  const res = await pool.query("SELECT 1 FROM transacoes WHERE hash = $1", [hash]);
  return res.rows.length > 0;
}

async function getAdminPanel() {
  const res = await pool.query(`
    SELECT COUNT(*) AS usuarios,
           SUM(valor) AS total,
           SUM(rendimento) AS rendimento
    FROM usuarios;
  `);
  return {
    count: parseInt(res.rows[0].usuarios || 0),
    total: parseFloat(res.rows[0].total || 0),
    rendimento: parseFloat(res.rows[0].rendimento || 0)
  };
}

module.exports = {
  inicializar,
  getUser,
  getUserByAddress,
  addUser,
  setCarteira,
  getCarteiraInfo,
  registrarDeposito,
  isTxRegistrada,
  getAdminPanel
};