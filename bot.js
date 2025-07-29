require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const db = require('./db');

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const ADMIN_ID = "5608086275";
const WALLET_ADDRESS = "0xEacfcC32F15f4055a6F0555C271B43FfB61Abc79";
const TOKEN_NAME = "USDT";
const APY = 20; // Anual, variável

// 🔄 Iniciar banco
db.inicializar();

// 👋 Start
bot.onText(/\/start/, async (msg) => {
  const user = msg.from;
  await db.query(
    `INSERT INTO usuarios (id, nome, username) 
     VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING`,
    [user.id, user.first_name, user.username]
  );

  bot.sendMessage(user.id,
    `👋 Olá ${user.first_name}!\n\n` +
    `💼 Este bot permite que você deposite ${TOKEN_NAME} e receba até ${APY}% ao ano com rendimento variável.\n\n` +
    `📥 Use /depositar para obter o endereço da carteira.\n` +
    `💰 Use /check para verificar seu depósito.\n` +
    `📊 Use /saldo para ver quanto você já tem e quanto rendeu.\n` +
    `🔐 Use /carteira para registrar sua carteira pessoal.`
  );
});

// 💸 Depositar
bot.onText(/\/depositar/, (msg) => {
  bot.sendMessage(msg.chat.id,
    `📥 Envie ${TOKEN_NAME} para o seguinte endereço:\n\n` +
    `\`${WALLET_ADDRESS}\`\n\n` +
    `🔍 Após enviar, use /check para verificar seu depósito.`,
    { parse_mode: 'Markdown' }
  );
});

// ✅ Check
bot.onText(/\/check/, async (msg) => {
  const res = await db.query(`SELECT valor FROM usuarios WHERE id = $1`, [msg.from.id]);
  const usuario = res.rows[0];
  if (usuario && usuario.valor > 0) {
    bot.sendMessage(msg.chat.id, `✅ Seu depósito já foi confirmado!`);
  } else {
    bot.sendMessage(msg.chat.id, `❌ Nenhum depósito encontrado ainda.`);
  }
});

// 💼 Saldo
bot.onText(/\/saldo/, async (msg) => {
  const res = await db.query(`SELECT * FROM usuarios WHERE id = $1`, [msg.from.id]);
  const usuario = res.rows[0];
  if (!usuario) return bot.sendMessage(msg.chat.id, `❌ Usuário não encontrado.`);

  bot.sendMessage(msg.chat.id,
    `💼 Carteira registrada: ${usuario.carteira || 'não registrada'}\n` +
    `💰 Valor depositado: ${usuario.valor.toFixed(2)} ${TOKEN_NAME}\n` +
    `📈 Rendimento acumulado: ${usuario.rendimento.toFixed(2)} ${TOKEN_NAME}`
  );
});

// 🧾 Registrar carteira
bot.onText(/\/carteira (.+)/, async (msg, match) => {
  const carteira = match[1];
  await db.query(`UPDATE usuarios SET carteira = $1 WHERE id = $2`, [carteira, msg.from.id]);
  bot.sendMessage(msg.chat.id, `✅ Carteira registrada: ${carteira}`);
});

// 👑 Admin
bot.onText(/\/admin/, async (msg) => {
  if (msg.from.id.toString() !== ADMIN_ID) return bot.sendMessage(msg.chat.id, `🚫 Acesso negado.`);

  const res1 = await db.query(`SELECT COUNT(*) FROM usuarios`);
  const res2 = await db.query(`SELECT COALESCE(SUM(valor),0) AS total FROM usuarios`);
  const res3 = await db.query(`SELECT COALESCE(SUM(rendimento),0) AS total FROM usuarios`);

  bot.sendMessage(msg.chat.id,
    `📊 Painel Administrativo\n\n` +
    `👥 Usuários: ${res1.rows[0].count}\n` +
    `💰 Total Investido: ${parseFloat(res2.rows[0].total).toFixed(2)} ${TOKEN_NAME}\n` +
    `📈 Total de Rendimento: ${parseFloat(res3.rows[0].total).toFixed(2)} ${TOKEN_NAME}`
  );
});