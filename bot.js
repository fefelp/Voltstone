require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const db = require('./db');
const tronscan = require('./tronscan');

db.inicializar()
  .then(() => console.log("✅ Database initialized"))
  .catch(err => console.error("❌ Error initializing DB:", err));

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Tride USDT bot is live.'));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Language memory
const userLang = {};

const texts = {
  en: {
    welcome: `👋 Welcome to Tride USDT – your secure passive income platform on the TRC-20 network.

🚀 How it works:
1. Register your TRC-20 wallet
2. Send USDT to the official address
3. Track your balance and request withdrawals anytime

Your funds can yield up to 20% APY!`,
    deposit: "📥 Deposit",
    wallet: "📊 My Wallet",
    withdraw: "🔁 Withdraw",
    sendDepositInfo: (address) => `📥 Send USDT (TRC-20) to:\n\n<code>${address}</code>\n\n⚠️ Use only your registered wallet.`,
    walletInfo: (data) => `📊 Wallet Overview:\n💸 Invested: ${data.investido.toFixed(2)} USDT\n📈 Yield: ${data.rendimento.toFixed(2)} USDT`,
    noDeposit: "⚠️ You haven't made any deposit yet.",
    noBalance: "⚠️ You have no available balance to withdraw.",
    withdrawalRequested: (amount) => `🔁 Withdrawal of ${amount.toFixed(2)} USDT requested. Please wait for processing.`,
    depositConfirmed: (amount) => `✅ Deposit of ${amount} USDT confirmed!\n🎉 You are now earning passive income.`,
    languagePrompt: "🌐 Please select your language:"
  },
  pt: {
    welcome: `👋 Bem-vindo ao Tride USDT – sua plataforma segura de renda passiva na rede TRC-20.

🚀 Como funciona:
1. Registre sua carteira TRC-20
2. Envie USDT para o endereço oficial
3. Acompanhe seu saldo e solicite saques a qualquer momento

Seus fundos podem render até 20% APY!`,
    deposit: "📥 Depositar",
    wallet: "📊 Minha Carteira",
    withdraw: "🔁 Resgatar",
    sendDepositInfo: (address) => `📥 Envie USDT (TRC-20) para a carteira:\n\n<code>${address}</code>\n\n⚠️ Use apenas sua carteira registrada.`,
    walletInfo: (data) => `📊 Sua Carteira:\n💸 Investido: ${data.investido.toFixed(2)} USDT\n📈 Rendimento: ${data.rendimento.toFixed(2)} USDT`,
    noDeposit: "⚠️ Você ainda não fez nenhum depósito.",
    noBalance: "⚠️ Você não tem saldo disponível para resgate.",
    withdrawalRequested: (amount) => `🔁 Solicitação de resgate de ${amount.toFixed(2)} USDT registrada. Aguarde o processamento.`,
    depositConfirmed: (amount) => `✅ Depósito de ${amount} USDT confirmado!\n🎉 Agora você está gerando renda passiva.`,
    languagePrompt: "🌐 Por favor, selecione seu idioma:"
  },
  es: {
    welcome: `👋 Bienvenido a Tride USDT – tu plataforma segura de ingresos pasivos en la red TRC-20.

🚀 Cómo funciona:
1. Registra tu cartera TRC-20
2. Envía USDT a la dirección oficial
3. Revisa tu saldo y solicita retiros cuando quieras

Tus fondos pueden generar hasta 20% APY!`,
    deposit: "📥 Depositar",
    wallet: "📊 Mi Billetera",
    withdraw: "🔁 Retirar",
    sendDepositInfo: (address) => `📥 Envía USDT (TRC-20) a:\n\n<code>${address}</code>\n\n⚠️ Usa solo tu cartera registrada.`,
    walletInfo: (data) => `📊 Tu Billetera:\n💸 Invertido: ${data.investido.toFixed(2)} USDT\n📈 Rendimiento: ${data.rendimento.toFixed(2)} USDT`,
    noDeposit: "⚠️ Aún no has realizado ningún depósito.",
    noBalance: "⚠️ No tienes saldo disponible para retirar.",
    withdrawalRequested: (amount) => `🔁 Solicitud de retiro de ${amount.toFixed(2)} USDT enviada. Espera el procesamiento.`,
    depositConfirmed: (amount) => `✅ Depósito de ${amount} USDT confirmado!\n🎉 Ya estás generando ingresos pasivos.`,
    languagePrompt: "🌐 Por favor selecciona tu idioma:"
  }
};

// /start — idioma
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

// language selection + comandos
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

// Verificar novos depósitos via TRONSCAN a cada 60s
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