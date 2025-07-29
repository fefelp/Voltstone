const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 🚀 Inicializa e cria as tabelas
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
      from_address TEXT,
      valor NUMERIC,
      user_id BIGINT REFERENCES usuarios(id),
      data TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// ➕ Adiciona novo usuário
async function addUser(id, nome, username = '') {
  await pool.query(
    'INSERT INTO usuarios (id, nome, username) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
    [id, nome, username]
  );
}

// 🔍 Busca usuário por ID
async function getUser(id) {
  const result = await pool.query('SELECT * FROM usuarios WHERE id = $1', [id]);
  return result.rows[0];
}

// 📥 Registra depósito (incrementa valores + salva tx)
async function registrarDeposito(userId, valor, txHash = null, from_address = null) {
  await pool.query(
    'UPDATE usuarios SET valor = valor + $1 WHERE id = $2',
    [valor, userId]
  );

  if (txHash) {
    await pool.query(
      'INSERT INTO transacoes (hash, from_address, valor, user_id) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
      [txHash, from_address, valor, userId]
    );
  }
}

// ✅ Verifica se a transação já foi registrada
async function isTxRegistered(hash) {
  const result = await pool.query('SELECT 1 FROM transacoes WHERE hash = $1', [hash]);
  return result.rows.length > 0;
}

// 📊 Retorna carteira do usuário (investido + rendimento)
async function getCarteira(userId) {
  const result = await pool.query('SELECT valor, rendimento FROM usuarios WHERE id = $1', [userId]);
  if (result.rows.length === 0) {
    return { investido: 0, rendimento: 0 };
  }

  const { valor, rendimento } = result.rows[0];
  return {
    investido: parseFloat(valor) || 0,
    rendimento: parseFloat(rendimento) || 0
  };
}

// 🧠 Painel do Admin
async function getAdminPanel() {
  const result = await pool.query('SELECT COUNT(*) AS count, SUM(valor) AS total, SUM(rendimento) AS rendimento FROM usuarios');
  const { count, total, rendimento } = result.rows[0];
  return {
    count: parseInt(count),
    total: parseFloat(total) || 0,
    rendimento: parseFloat(rendimento) || 0
  };
}

// 🔍 Busca usuário por endereço de carteira
async function getUserByAddress(fromAddress) {
  const result = await pool.query('SELECT * FROM usuarios WHERE LOWER(carteira) = LOWER($1)', [fromAddress]);
  return result.rows[0];
}

// 💸 Solicita resgate
async function solicitarResgate(userId, valor) {
  await pool.query(
    'INSERT INTO resgates (user_id, valor) VALUES ($1, $2)',
    [userId, valor]
  );
}

module.exports = {
  query: (text, params) => pool.query(text, params),
  inicializar,
  addUser,
  getUser,
  registrarDeposito,
  isTxRegistered,
  getCarteira,
  getAdminPanel,
  getUserByAddress,
  solicitarResgate
};