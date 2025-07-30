const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function inicializar() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGINT PRIMARY KEY,
      name TEXT,
      username TEXT,
      wallet TEXT
    );
    
    CREATE TABLE IF NOT EXISTS deposits (
      id SERIAL PRIMARY KEY,
      user_id BIGINT REFERENCES users(id),
      hash TEXT UNIQUE,
      amount NUMERIC,
      address TEXT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS withdrawals (
      id SERIAL PRIMARY KEY,
      user_id BIGINT REFERENCES users(id),
      amount NUMERIC,
      status TEXT DEFAULT 'pending',
      requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function getUser(chatId) {
  const res = await pool.query('SELECT * FROM users WHERE id = $1', [chatId]);
  return res.rows[0];
}

async function addUser(chatId, name, username) {
  await pool.query(
    'INSERT INTO users (id, name, username) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING',
    [chatId, name, username]
  );
}

async function getUserByAddress(address) {
  const res = await pool.query('SELECT * FROM users WHERE LOWER(wallet) = $1', [address.toLowerCase()]);
  return res.rows[0];
}

async function registrarDeposito(userId, amount, hash, address) {
  await pool.query(
    'INSERT INTO deposits (user_id, amount, hash, address) VALUES ($1, $2, $3, $4)',
    [userId, amount, hash, address.toLowerCase()]
  );
  // Também atualiza a carteira do usuário
  await pool.query(
    'UPDATE users SET wallet = $1 WHERE id = $2',
    [address.toLowerCase(), userId]
  );
}

async function isTxRegistered(hash) {
  const res = await pool.query('SELECT id FROM deposits WHERE hash = $1', [hash]);
  return res.rowCount > 0;
}

async function getCarteira(userId) {
  const res = await pool.query(`
    SELECT 
      COALESCE(SUM(amount), 0) AS investido,
      COALESCE(SUM(amount * 0.2), 0) AS rendimento
    FROM deposits WHERE user_id = $1
  `, [userId]);
  return res.rows[0];
}

async function solicitarResgate(userId, amount) {
  await pool.query(
    'INSERT INTO withdrawals (user_id, amount) VALUES ($1, $2)',
    [userId, amount]
  );
}

async function getAdminPanel() {
  const totalQuery = await pool.query('SELECT COALESCE(SUM(amount), 0) AS total FROM deposits');
  const rendimentoQuery = await pool.query('SELECT COALESCE(SUM(amount * 0.2), 0) AS rendimento FROM deposits');
  const countQuery = await pool.query('SELECT COUNT(*) FROM users');

  return {
    total: parseFloat(totalQuery.rows[0].total),
    rendimento: parseFloat(rendimentoQuery.rows[0].rendimento),
    count: parseInt(countQuery.rows[0].count)
  };
}

module.exports = {
  inicializar,
  getUser,
  addUser,
  getUserByAddress,
  registrarDeposito,
  isTxRegistered,
  getCarteira,
  solicitarResgate,
  getAdminPanel
};