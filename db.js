const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Inicializa as tabelas
async function inicializar() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGINT PRIMARY KEY,
      name TEXT,
      username TEXT,
      address TEXT
    );

    CREATE TABLE IF NOT EXISTS transacoes (
      id SERIAL PRIMARY KEY,
      chat_id BIGINT REFERENCES users(id),
      valor NUMERIC,
      hash TEXT UNIQUE,
      carteira TEXT,
      timestamp TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS resgates (
      id SERIAL PRIMARY KEY,
      chat_id BIGINT REFERENCES users(id),
      valor NUMERIC,
      solicitado_em TIMESTAMP DEFAULT NOW(),
      processado BOOLEAN DEFAULT FALSE
    );
  `);
}

async function addUser(id, name, username) {
  await pool.query(
    'INSERT INTO users (id, name, username) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING',
    [id, name, username]
  );
}

async function getUser(id) {
  const res = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return res.rows[0];
}

async function getUserByAddress(address) {
  const res = await pool.query('SELECT * FROM users WHERE LOWER(address) = LOWER($1)', [address]);
  return res.rows[0];
}

async function registrarCarteira(chatId, address) {
  await pool.query('UPDATE users SET address = $1 WHERE id = $2', [address, chatId]);
}

async function isTxRegistered(hash) {
  const res = await pool.query('SELECT 1 FROM transacoes WHERE hash = $1', [hash]);
  return res.rowCount > 0;
}

async function registrarDeposito(chatId, valor, hash, carteira) {
  await pool.query(
    'INSERT INTO transacoes (chat_id, valor, hash, carteira) VALUES ($1, $2, $3, $4)',
    [chatId, valor, hash, carteira]
  );
}

// Calcula rendimento proporcional a até 20% APY
async function getCarteira(chatId) {
  const res = await pool.query(
    'SELECT valor, timestamp FROM transacoes WHERE chat_id = $1',
    [chatId]
  );

  let investido = 0;
  let rendimento = 0;

  const now = new Date();

  for (const row of res.rows) {
    const valor = parseFloat(row.valor);
    const timestamp = new Date(row.timestamp);
    const dias = (now - timestamp) / (1000 * 60 * 60 * 24);

    const apy = 0.20; // 20% ao ano
    const rendimentoProporcional = valor * (Math.pow(1 + apy, dias / 365) - 1);

    investido += valor;
    rendimento += rendimentoProporcional;
  }

  return { investido, rendimento };
}

async function solicitarResgate(chatId, valor) {
  await pool.query(
    'INSERT INTO resgates (chat_id, valor) VALUES ($1, $2)',
    [chatId, valor]
  );
}

async function getAdminPanel() {
  const res = await pool.query('SELECT chat_id FROM transacoes');
  const usersSet = new Set(res.rows.map(r => r.chat_id));
  let total = 0;
  let rendimento = 0;

  for (const chatId of usersSet) {
    const { investido, rendimento: userRendimento } = await getCarteira(chatId);
    total += investido;
    rendimento += userRendimento;
  }

  return {
    total,
    rendimento,
    count: usersSet.size
  };
}

module.exports = {
  inicializar,
  addUser,
  getUser,
  getUserByAddress,
  registrarCarteira,
  isTxRegistered,
  registrarDeposito,
  getCarteira,
  solicitarResgate,
  getAdminPanel
};