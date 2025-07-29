require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const db = require('./db');
const bscscan = require('./bscscan');

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// WebServer do Render
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (_, res) => res.send('✅ VoltStone Bot rodando...'));
app.listen(PORT, () => console.log(`🌐 Servidor Web ouvindo na porta ${PORT}`));

// Inicializa DB
(async () => await db.inicializar())();

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const name = msg.from.first_name;

  const user = await db.getUser(chatId);
  if (!user) await db.addUser(chatId, name);

  bot.sendMessage(chatId, `👋 Olá ${name}!\n\nBem-vindo ao VoltStone 💼\n💰 Rendimento até 20% APY!\nEscolha uma opção:`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "📥 Depositar", callback_data: "depositar" }],
        [{ text: "📊 Minha Carteira", callback_data: "carteira" }],
      ],
    },
  });
});

bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  if (data === 'depositar') {
    bot.sendMessage(chatId, `📥 Deposite USDT (BEP20) na carteira abaixo:\n\n<code>${process.env.WALLET_ADDRESS}</code>\n\n⚠️ Use somente a carteira cadastrada.`, {
      parse_mode: 'HTML',
    });
  }

  if (data === 'carteira') {
    const info = await db.getCarteira(chatId);
    bot.sendMessage(chatId, `📊 Sua carteira:\n\n💸 Investido: ${info.investido} USDT\n📈 Rendimento: ${info.rendimento} USDT`);
  }
});

bot.onText(/\/admin/, async (msg) => {
  const chatId = msg.chat.id;
  if (chatId.toString() !== process.env.ADMIN_ID) return;

  const stats = await db.getAdminPanel();
  bot.sendMessage(chatId, `📊 Painel Admin:\n👥 Usuários: ${stats.usuarios}\n💰 Investido: ${stats.investido} USDT\n📈 Rendimentos: ${stats.rendimento} USDT`);
});

// Monitoramento de depósitos
setInterval(async () => {
  const txs = await bscscan.getDepositos();
  for (let tx of txs) {
    const user = await db.getUserByAddress(tx.from);
    if (user && !(await db.txJaRegistrada(tx.hash))) {
      await db.registrarDeposito(user.id, tx.valor, tx.hash);
      bot.sendMessage(user.id, `✅ Depósito de ${tx.valor} USDT confirmado!`);
    }
  }
}, 60_000);