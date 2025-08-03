const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

// Caminho dos arquivos
const ENV_FILE = path.join(__dirname, 'env.json');
const DB_FILE = path.join(__dirname, 'database.json');

// Carrega env.json
const { BOT_TOKEN, ADMIN_ID, CARTEIRA_USDT } = JSON.parse(fs.readFileSync(ENV_FILE));

// Cria bot
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Carrega banco (ou cria)
let db = { usuarios: [] };
if (fs.existsSync(DB_FILE)) {
  db = JSON.parse(fs.readFileSync(DB_FILE));
}

// Comando /start
bot.onText(/\/start/, (msg) => {
  const userId = msg.from.id;
  const name = msg.from.first_name;

  const jaRegistrado = db.usuarios.find(u => u.id === userId);

  if (!jaRegistrado) {
    db.usuarios.push({ id: userId, nome: name, data: new Date().toISOString() });
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  }

  const text = `👋 Olá ${name}!\n\n💰 Endereço da carteira USDT:\n\`${CARTEIRA_USDT}\`\n\nCopie e envie para quem for depositar.`;

  bot.sendMessage(userId, text, { parse_mode: 'Markdown' });
});

// Comando /usuarios (só admin)
bot.onText(/\/usuarios/, (msg) => {
  if (msg.from.id.toString() !== ADMIN_ID.toString()) return;

  const texto = db.usuarios.map(u => `• ${u.nome} (ID: ${u.id})`).join('\n') || 'Nenhum usuário ainda.';
  bot.sendMessage(msg.chat.id, `👥 *Usuários cadastrados:*\n\n${texto}`, { parse_mode: 'Markdown' });
});