const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function inicializar() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id BIGINT PRIMARY KEY,
      nome TEXT,
      investido NUMERIC DEFAULT 0,
      rendimento NUMERIC DEFAULT 0
    );
    
    CREATE TABLE IF NOT EXISTS depositos (
      id SERIAL PRIMARY KEY,
      user_id BIGINT,
      valor NUMERIC,
      hash TEXT UNIQUE,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function getUser(id) {
  const res = await pool.query('SELECT * FROM usuarios WHERE id = $1', [id]);
  return res.rows[0];
}

async function addUser(id, nome) {
  await pool.query('INSERT INTO usuarios (id, nome) VALUES ($1, $2) ON CONFLICT DO NOTHING', [id, nome]);
}

async function registrarDeposito(user_id, valor, hash) {
  await pool.query('INSERT INTO depositos (user_id, valor, hash) VALUES ($1, $2, $3)', [user_id, valor, hash]);
  await pool.query('UPDATE usuarios SET investido = investido + $1 WHERE id = $2', [valor, user_id]);
}

async function txJaRegistrada(hash) {
  const res = await pool.query('SELECT 1 FROM depositos WHERE hash = $1', [hash]);
  return res.rowCount > 0;
}

async function getCarteira(id) {
  const res = await pool.query('SELECT investido, rendimento FROM usuarios WHERE id = $1', [id]);
  return res.rows[0] || { investido: 0, rendimento: 0 };
}

async function getAdminPanel() {
  const users = await pool.query('SELECT COUNT(*) FROM usuarios');
  const invest = await pool.query('SELECT SUM(investido) AS total FROM usuarios');
  const rend = await pool.query('SELECT SUM(rendimento) AS total FROM usuarios');

  return {
    usuarios: parseInt(users.rows[0].count),
    investido: parseFloat(invest.rows[0].total || 0),
    rendimento: parseFloat(rend.rows[0].total || 0)
  };
}

async function getUserByAddress(address) {
  const res = await pool.query('SELECT * FROM usuarios WHERE carteira = $1', [address.toLowerCase()]);
  return res.rows[0];
}

module.exports = {
  inicializar,
  getUser,
  addUser,
  getCarteira,
  registrarDeposito,
  getAdminPanel,
  getUserByAddress,
  txJaRegistrada
};