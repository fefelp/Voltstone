const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 🔧 Initialize tables
async function initialize() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGINT PRIMARY KEY,
      name TEXT,
      username TEXT,
      wallet TEXT,
      invested NUMERIC DEFAULT 0,
      earnings NUMERIC DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS deposits (
      hash TEXT PRIMARY KEY,
      from_address TEXT,
      value NUMERIC,
      user_id BIGINT REFERENCES users(id),
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS withdrawals (
      id SERIAL PRIMARY KEY,
      user_id BIGINT REFERENCES users(id),
      value NUMERIC,
      status TEXT DEFAULT 'pending',
      requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// ➕ Add new user
async function addUser(id, name, username = '') {
  await pool.query(
    'INSERT INTO users (id, name, username) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
    [id, name, username]
  );
}

// 🔍 Get user
async function getUser(id) {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0];
}

// 📥 Register deposit
async function registerDeposit(userId, value, txHash, fromAddress) {
  await pool.query(
    'UPDATE users SET invested = invested + $1 WHERE id = $2',
    [value, userId]
  );

  await pool.query(
    'INSERT INTO deposits (hash, from_address, value, user_id) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
    [txHash, fromAddress, value, userId]
  );
}

// ✅ Check if TX is already recorded
async function isTxRegistered(hash) {
  const res = await pool.query('SELECT 1 FROM deposits WHERE hash = $1', [hash]);
  return res.rows.length > 0;
}

// 📊 Get wallet info
async function getWalletInfo(userId) {
  const res = await pool.query('SELECT invested, earnings FROM users WHERE id = $1', [userId]);
  if (res.rows.length === 0) return null;

  const { invested, earnings } = res.rows[0];
  return { invested: parseFloat(invested), earnings: parseFloat(earnings) };
}

// 📤 Request withdrawal
async function requestWithdrawal(userId, value) {
  await pool.query('INSERT INTO withdrawals (user_id, value) VALUES ($1, $2)', [userId, value]);
}

// 👮 Admin dashboard
async function getAdminPanel() {
  const res = await pool.query('SELECT COUNT(*) AS count, SUM(invested) AS total, SUM(earnings) AS earnings FROM users');
  const { count, total, earnings } = res.rows[0];
  return {
    count: parseInt(count),
    total: parseFloat(total) || 0,
    earnings: parseFloat(earnings) || 0
  };
}

// 🔍 Find user by wallet address
async function getUserByAddress(wallet) {
  const res = await pool.query('SELECT * FROM users WHERE wallet = $1', [wallet]);
  return res.rows[0];
}

module.exports = {
  initialize,
  addUser,
  getUser,
  registerDeposit,
  isTxRegistered,
  getWalletInfo,
  requestWithdrawal,
  getAdminPanel,
  getUserByAddress
};