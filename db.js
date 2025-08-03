const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Cria pasta /database se não existir
const dbPath = path.join(__dirname, 'database');
if (!fs.existsSync(dbPath)) {
  fs.mkdirSync(dbPath);
}

const db = new sqlite3.Database(path.join(dbPath, 'voltstone.db'));

// Criação das tabelas
const init = () => {
  db.run(`CREATE TABLE IF NOT EXISTS usuarios (
    telegram_id TEXT PRIMARY KEY,
    nome TEXT,
    username TEXT,
    carteira TEXT,
    data_cadastro TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS depositos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id TEXT,
    valor REAL,
    data TEXT,
    txid TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS rendimentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id TEXT,
    rendimento_estimado REAL,
    rendimento_real REAL,
    data_referencia TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS saques (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id TEXT,
    valor REAL,
    carteira TEXT,
    status TEXT,
    data_solicitacao TEXT
  )`);
};

module.exports = { db, init };