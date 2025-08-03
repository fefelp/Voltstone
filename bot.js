import TelegramBot from 'node-telegram-bot-api';
import fs from 'fs';
import http from 'http';

// Carrega variáveis do env.json
const config = JSON.parse(fs.readFileSync('./env.json', 'utf-8'));
const { BOT_TOKEN, ADMIN_ID, CARTEIRA_USDT } = config;

// Inicializa o bot em modo polling
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Carrega ou cria o database
const dbPath = './database.json';
let database = { users: [] };

try {
  if (fs.existsSync(dbPath)) {
    database = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  } else {
    fs.writeFileSync(dbPath, JSON.stringify(database, null, 2));
  }
} catch (err) {
  console.error("Erro ao carregar o banco de dados:", err);
}

// Salva database
function salvarDB() {
  fs.writeFileSync(dbPath, JSON.stringify(database, null, 2));
}

// Início
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const user = { id: chatId, username: msg.from.username || 'sem_username' };

  if (!database.users.find(u => u.id === chatId)) {
    database.users.push(user);
    salvarDB();
  }

  bot.sendMessage(chatId, `👋 Olá! Seja bem-vindo.\nCarteira USDT para depósitos:\n\n${CARTEIRA_USDT}`);
});

// Comando só para o admin
bot.onText(/\/usuarios/, (msg) => {
  const chatId = msg.chat.id;
  if (chatId.toString() !== ADMIN_ID.toString()) return;

  const lista = database.users.map(u => `• ${u.username} (${u.id})`).join('\n');
  const resposta = lista || 'Nenhum usuário registrado ainda.';
  bot.sendMessage(chatId, `👥 Lista de usuários:\n\n${resposta}`);
});

// ⚠️ Servidor HTTP obrigatório para Render Web Service
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('Bot está rodando!');
}).listen(PORT, () => {
  console.log(`Servidor HTTP escutando na porta ${PORT}`);
});