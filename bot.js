require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const db = require('./db');
const bscscan = require('./bscscan');

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// 🚀 Web server para manter Render ativo
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Voltstone bot rodando.'));
app.listen(PORT, () => console.log(`Servidor escutando na porta ${PORT}`));

// 📦 Início do bot
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const name = msg.from.first_name;

  const user = await db.getUser(chatId);
  if (!user) await db.addUser(chatId, name);

  bot.sendMessage(chatId, `👋 Olá ${name}!\n\n💼 Este é o VoltStone, seu bot de investimento em USDT.\n💰 Rendimento estimado: até 20% APY.\n\nEscolha uma opção abaixo:`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "📥 Depositar", callback_data: "depositar" }],
        [{ text: "📊 Minha Carteira", callback_data: "carteira" }],
      ],
    },
  });
});

// 📍 Callback dos botões
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  if (data === 'depositar') {
    bot.sendMessage(chatId, `📥 Para investir, envie USDT (BEP20) para este endereço:\n\n👜 <code>${process.env.CARTEIRA}</code>\n\n⚠️ Use somente a carteira registrada.`, {
      parse_mode: 'HTML',
    });
  }

  if (data === 'carteira') {
    const info = await db.getCarteira(chatId);
    bot.sendMessage(chatId, `📊 Sua Carteira:\n\n💸 Investido: ${info.investido} USDT\n📈 Rendimento estimado: ${info.rendimento} USDT`, {
      parse_mode: 'HTML',
    });
  }
});

// 🔐 Comando admin
bot.onText(/\/admin/, async (msg) => {
  const chatId = msg.chat.id;
  if (chatId.toString() !== process.env.ADMIN_ID) return;

  const { total, rendimento, count } = await db.getAdminPanel();
  bot.sendMessage(chatId, `📊 Painel do Admin:\n\n👥 Usuários: ${count}\n💰 Total investido: ${total.toFixed(2)} USDT\n📈 Rendimento total: ${rendimento.toFixed(2)} USDT`);
});

// ✅ Verificador automático de transações a cada 60s
setInterval(async () => {
  const txs = await bscscan.getDepositos();
  for (let tx of txs) {
    const user = await db.getUserByAddress(tx.from);
    if (user) {
      const alreadyRegistered = await db.isTxRegistered(tx.hash);
      if (!alreadyRegistered) {
        await db.registrarDeposito(user.chat_id, tx.value, tx.hash);
        bot.sendMessage(user.chat_id, `✅ Recebemos seu depósito de ${tx.value} USDT!\n🎉 Agora você começa a render até 20% APY!`);
      }
    }
  }
}, 60 * 1000);