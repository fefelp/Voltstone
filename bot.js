require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const db = require('./db');
const tronscan = require('./tronscan');

db.inicializar()
  .then(() => console.log("✅ Database initialized"))
  .catch(err => console.error("❌ Error initializing DB:", err));

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// Keep service alive
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Tride USDT bot is live.'));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Store user language
const userLang = {};

// Multilingual support
const texts = {
  en: {
    welcome: `👋 Welcome to Tride USDT – your secure passive income platform on the TRC-20 network.\n\n🚀 How it works:\n1. Register your TRC-20 wallet\n2. Send USDT to the official wallet address\n3. Track your balance and request withdrawals at any time\n\nChoose an option below to begin:`,
    deposit: "📥 Deposit",
    wallet: "📊 My Wallet",
    withdraw: "🔁 Withdraw",
    sendDepositInfo: (address) => `📥 Send USDT (TRC-20) to the following wallet:\n\n<code>${address}</code>\n\n⚠️ Only use your registered wallet.`,
    walletInfo: (data) => `📊 Wallet Overview:\n💸 Invested: ${data.investido.toFixed(2)} USDT\n📈 Yield: ${data.rendimento.toFixed(2)} USDT`,
    noDeposit: "⚠️ You haven't made any deposits yet.",
    noBalance: "⚠️ You have no available balance to withdraw.",
    withdrawalRequested: (amount) => `🔁 Withdrawal of ${amount.toFixed(2)} USDT requested. Please wait for processing.`,
    depositConfirmed: (amount) => `✅ Deposit of ${amount} USDT confirmed!\n🎉 You are now earning passive income.`,
  },
  pt: {
    welcome: `👋 Bem-vindo ao Tride USDT – sua plataforma segura de renda passiva na rede TRC-20.\n\n🚀 Como funciona:\n1. Registre sua carteira TRC-20\n2. Envie USDT para o endereço oficial\n3. Acompanhe seu saldo e solicite saques a qualquer momento\n\nEscolha uma opção abaixo para começar:`,
    deposit: "📥 Depositar",
    wallet: "📊 Minha Carteira",
    withdraw: "🔁 Resgatar",
    sendDepositInfo: (address) => `📥 Envie USDT (TRC-20) para a seguinte carteira:\n\n<code>${address}</code>\n\n⚠️ Use apenas a carteira registrada.`,
    walletInfo: (data) => `📊 Sua Carteira:\n💸 Investido: ${data.investido.toFixed(2)} USDT\n📈 Rendimento: ${data.rendimento.toFixed(2)} USDT`,
    noDeposit: "⚠️ Você ainda não fez nenhum depósito.",
    noBalance: "⚠️ Você não tem saldo disponível para resgate.",
    withdrawalRequested: (amount) => `🔁 Resgate de ${amount.toFixed(2)} USDT solicitado. Aguarde o processamento.`,
    depositConfirmed: (amount) => `✅ Depósito de ${amount} USDT confirmado!\n🎉 Você começou a gerar renda passiva.`,
  },
  es: {
    welcome: `👋 Bienvenido a Tride USDT – tu plataforma segura de ingresos pasivos en la red TRC-20.\n\n🚀 Cómo funciona:\n1. Registra tu cartera TRC-20\n2. Envía USDT a la dirección oficial\n3. Revisa tu saldo y solicita retiros cuando quieras\n\nElige una opción para comenzar:`,
    deposit: "📥 Depositar",
    wallet: "📊 Mi Billetera",
    withdraw: "🔁 Retirar",
    sendDepositInfo: (address) => `📥 Envía USDT (TRC-20) a la siguiente dirección:\n\n<code>${address}</code>\n\n⚠️ Usa solo tu cartera registrada.`,
    walletInfo: (data) => `📊 Tu Billetera:\n💸 Invertido: ${data.investido.toFixed(2)} USDT\n📈 Rendimiento: ${data.rendimento.toFixed(2)} USDT`,
    noDeposit: "⚠️ Aún no has realizado ningún depósito.",
    noBalance: "⚠️ No tienes saldo disponible para retirar.",
    withdrawalRequested: (amount) => `🔁 Retiro de ${amount.toFixed(2)} USDT solicitado. Espera el procesamiento.`,
    depositConfirmed: (amount) => `✅ Depósito de ${amount} USDT confirmado!\n🎉 Comenzaste a generar ingresos pasivos.`,
  }
};

// /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "🌐 Please select your language / Por favor selecione seu idioma / Por favor selecciona tu idioma:", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🇧🇷 Português", callback_data: "lang_pt" }],
        [{ text: "🇺🇸 English", callback_data: "lang_en" }],
        [{ text: "🇪🇸 Español", callback_data: "lang_es" }]
      ]
    }
  });
});

// Callbacks (language & menu)
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  if (data.startsWith("lang_")) {
    const lang = data.split("_")[1];
    userLang[chatId] = lang;

    const t = texts[lang];
    const user = await db.getUser(chatId);
    if (!user) await db.addUser(chatId, query.from.first_name, query.from.username || "");

    return bot.sendMessage(chatId, t.welcome, {
      reply_markup: {
        inline_keyboard: [
          [{ text: t.deposit, callback_data: "depositar" }],
          [{ text: t.wallet, callback_data: "carteira" }],
          [{ text: t.withdraw, callback_data: "resgatar" }]
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

// Auto-check deposits
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
    console.error("Error checking deposits:", err.message);
  }
}, 60 * 1000);