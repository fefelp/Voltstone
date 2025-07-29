const fs = require('fs');

const file = 'database.json';

function carregar() {
  if (!fs.existsSync(file)) fs.writeFileSync(file, '{}');
  return JSON.parse(fs.readFileSync(file));
}

function salvar(data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function addUser(id, username, nome) {
  const db = carregar();
  if (!db[id]) db[id] = { nome, username, valor: 0, rendimento: 0, historico: [] };
  salvar(db);
}

function getUser(id) {
  const db = carregar();
  return db[id];
}

function salvarCarteira(id, carteira) {
  const db = carregar();
  if (!db[id]) return;
  db[id].carteira = carteira;
  salvar(db);
}

function getCarteira(id) {
  const db = carregar();
  return db[id]?.carteira;
}

function registrarDeposito(id, valor) {
  const db = carregar();
  if (!db[id]) return;
  db[id].valor += valor;
  salvar(db);
}

function getHistorico(id) {
  const db = carregar();
  return db[id]?.historico || [];
}

function getTotalInvestido() {
  const db = carregar();
  return Object.values(db).reduce((soma, u) => soma + (u.valor || 0), 0);
}

function getTotalUsuarios() {
  const db = carregar();
  return Object.keys(db).length;
}

module.exports = {
  addUser,
  getUser,
  salvarCarteira,
  getCarteira,
  registrarDeposito,
  getHistorico,
  getTotalInvestido,
  getTotalUsuarios
};