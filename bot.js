require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const db = require('./db');
const tronscan = require('./tronscan');

const bot = new TelegramBot(process.env.BOT_TOKEN, { webHook: { port: process.env.PORT || 3000 } });

// 🧠 Idiomas
const userLang = {};
const texts = require('./texts'); // se quiser, separe os textos nesse arquivo ou use inline como já usava

// Conecta Webhook
bot.setWebHook(`${process.env.BASE_URL}/bot${process.env.BOT_TOKEN}`);

const app = express();
app.use(express.json());
app.post(`/bot${process.env.BOT_TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

app.get('/', (req, res) => res.send('Tride USDT Webhook running!'));

// Banco de dados
db.inicializar()
  .then(() => console.log("✅ Database initialized"))
  .catch(err => console.error("❌ Error initializing DB:", err));

// Comandos e callbacks
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, texts.en.languagePrompt, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🇧🇷 Português", callback_data: "lang_pt" }],
        [{ text: "🇺🇸 English", callback_data: "lang_en" }],
        [{ text: "🇪🇸 Español", callback_data: "lang_es" }]
      ]
    }
  });
});

bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  if (data.startsWith('lang_')) {
    const lang = data.split('_')[1];
    userLang[chatId] = lang;

    const { welcome, deposit, wallet, withdraw } = texts[lang];
    const user = await db.getUser(chatId);
    if (!user) await db.addUser(chatId, query.from.first_name, query.from.username || "");

    return bot.sendMessage(chatId, welcome, {
      reply_markup: {
        inline_keyboard: [
          [{ text: deposit, callback_data: "depositar" }],
          [{ text: wallet, callback_data: "carteira" }],
          [{ text: withdraw, callback_data: "resgatar" }]
        ]
      }
    });
  }

  const lang = userLang[chatId] || 'en';
  const t = texts[lang];

  if (data === 'depositar') {
    return bot.sendMessage(chatId, t.sendDepositInfo(process.env.WALLET_ADDRESS), { parse_mode: 'HTML' });
  }

  if (data === 'carteira') {
    const info = await db.getCarteira(chatId);
    if (!info) return bot.sendMessage(chatId, t.noDeposit);
    return bot.sendMessage(chatId, t.walletInfo(info), { parse_mode: 'HTML' });
  }

  if (data === 'resgatar') {
    const info = await db.getCarteira(chatId);
    if (!info || info.investido <= 0) return bot.sendMessage(chatId, t.noBalance);
    await db.solicitarResgate(chatId, info.investido);
    return bot.sendMessage(chatId, t.withdrawalRequested(info.investido));
  }
});

// Verificação de depósitos TRONSCAN a cada 60s
setInterval(async () => {
  try {
    const txs = await tronscan.getDeposits();
    for (let tx of txs) {
      const user = await db.getUserByAddress(tx.from);
      if (user) {
        const exists = await db.isTxRegistered(tx.hash);
        if (!exists) {
          await db.registrarDeposito(user.id, tx.value, tx.hash, tx.from);
          const lang = userLang[user.id] || 'en';
          bot.sendMessage(user.id, texts[lang].depositConfirmed(tx.value));
        }
      }
    }
  } catch (err) {
    console.error("❌ Error checking deposits:", err.message);
  }
}, 60 * 1000);