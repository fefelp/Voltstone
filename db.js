const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 🚀 Cria as tabelas se não existirem
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
      id SERIAL PRIMARY KEY,
      tx_hash TEXT UNIQUE,
      from_address TEXT,
      to_address TEXT,
      valor NUMERIC,
      user_id BIGINT REFERENCES usuarios(id),
      registrado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function getUser(id) {
  const res = await pool.query('SELECT * FROM usuarios WHERE id = $1', [id]);
  return res.rows[0];
}

async function addUser(id, nome) {
  return pool.query('INSERT INTO usuarios (id, nome) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING', [id, nome]);
}

async function registrarDeposito(id, valor, hash, from = '') {
  await pool.query('UPDATE usuarios SET valor = valor + $1 WHERE id = $2', [valor, id]);
  await pool.query('INSERT INTO transacoes (tx_hash, from_address, to_address, valor, user_id) VALUES ($1, $2, $3, $4, $5)',
    [hash, from, process.env.WALLET_ADDRESS, valor, id]);
}

async function isTxRegistered(hash) {
  const res = await pool.query('SELECT * FROM transacoes WHERE tx_hash = $1', [hash]);
  return res.rowCount > 0;
}

async function getCarteira(id) {
  const res = await pool.query('SELECT valor, rendimento FROM usuarios WHERE id = $1', [id]);
  return res.rows[0] || { investido: 0, rendimento: 0 };
}

async function getAdminPanel() {
  const totalRes = await pool.query('SELECT SUM(valor) AS total, SUM(rendimento) AS rendimento FROM usuarios');
  const countRes = await pool.query('SELECT COUNT(*) FROM usuarios');

  return {
    total: parseFloat(totalRes.rows[0].total) || 0,
    rendimento: parseFloat(totalRes.rows[0].rendimento) || 0,
    count: parseInt(countRes.rows[0].count)
  };
}

async function registrarRendimento(id, percentual, valor) {
  await pool.query('UPDATE usuarios SET rendimento = rendimento + $1 WHERE id = $2', [valor, id]);
  await pool.query('INSERT INTO rendimentos (user_id, percentual, valor) VALUES ($1, $2, $3)', [id, percentual, valor]);
}

async function getHistoricoRendimentos(id) {
  const res = await pool.query('SELECT percentual, valor, data FROM rendimentos WHERE user_id = $1 ORDER BY data DESC LIMIT 10', [id]);
  return res.rows;
}

async function solicitarResgate(id, valor) {
  await pool.query('INSERT INTO resgates (user_id, valor) VALUES ($1, $2)', [id, valor]);
}

module.exports = {
  inicializar,
  getUser,
  addUser,
  getCarteira,
  registrarDeposito,
  isTxRegistered,
  getAdminPanel,
  registrarRendimento,
  getHistoricoRendimentos,
  solicitarResgate
};