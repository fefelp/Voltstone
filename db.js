const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Create tables if not exist
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
      status TEXT DEFAULT 'pending',
      solicitado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transacoes (
      hash TEXT PRIMARY KEY,
      from_address TEXT,
      valor NUMERIC,
      user_id BIGINT REFERENCES usuarios(id),
      data TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function addUser(id, nome, username = '') {
  await pool.query(
    'INSERT INTO usuarios (id, nome, username) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
    [id, nome, username]
  );
}

async function getUser(id) {
  const res = await pool.query('SELECT * FROM usuarios WHERE id = $1', [id]);
  return res.rows[0];
}

async function getCarteira(id) {
  const res = await pool.query('SELECT valor, rendimento FROM usuarios WHERE id = $1', [id]);
  if (res.rows.length === 0) return null;

  const { valor, rendimento } = res.rows[0];
  return {
    investido: parseFloat(valor),
    rendimento: parseFloat(rendimento)
  };
}

async function registrarDeposito(userId, valor, txHash, fromAddress) {
  await pool.query('UPDATE usuarios SET valor = valor + $1 WHERE id = $2', [valor, userId]);

  if (txHash) {
    await pool.query(
      'INSERT INTO transacoes (hash, from_address, valor, user_id) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
      [txHash, fromAddress, valor, userId]
    );
  }
}

async function isTxRegistered(hash) {
  const res = await pool.query('SELECT 1 FROM transacoes WHERE hash = $1', [hash]);
  return res.rows.length > 0;
}

async function solicitarResgate(userId, valor) {
  await pool.query('INSERT INTO resgates (user_id, valor) VALUES ($1, $2)', [userId, valor]);
}

async function getAdminPanel() {
  const res = await pool.query(`
    SELECT COUNT(*) AS count,
           SUM(valor) AS total,
           SUM(rendimento) AS rendimento
    FROM usuarios
  `);
  const { count, total, rendimento } = res.rows[0];
  return {
    count: parseInt(count),
    total: parseFloat(total || 0),
    rendimento: parseFloat(rendimento || 0)
  };
}

async function getUserByAddress(fromAddress) {
  const res = await pool.query('SELECT * FROM usuarios WHERE carteira = $1', [fromAddress]);
  return res.rows[0];
}

module.exports = {
  inicializar,
  addUser,
  getUser,
  getCarteira,
  registrarDeposito,
  isTxRegistered,
  solicitarResgate,
  getAdminPanel,
  getUserByAddress
};