const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');

// Criação de tabela de usuários
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    username TEXT,
    first_name TEXT,
    joined_at TEXT
  )`);
});

function addUser(ctx) {
  const { id, username, first_name } = ctx.from;
  const joined_at = new Date().toISOString();

  db.run(
    `INSERT OR IGNORE INTO users (id, username, first_name, joined_at)
     VALUES (?, ?, ?, ?)`,
    [id, username || '', first_name || '', joined_at]
  );
}

module.exports = { db, addUser };