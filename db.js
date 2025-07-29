require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const db = require('./db');
const bscscan = require('./bscscan');

// 🔧 Inicializa o banco de dados (cria tabelas se não existirem)
db.inicializar()
  .then(() => console.log("✅ Database initialized"))
  .catch(err => console.error("❌ Error initializing DB:", err));

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// 🌐 Web server para manter o Render ativo
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Voltstone bot running successfully.'));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// 🚀 Comando /start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const name = msg.from.first_name;
  const username = msg.from.username || "";

  const user = await db.getUser(chatId);
  if (!user) await db.addUser(chatId, name, username);

  const text = `
👋 Hello ${name}!

🚀 Welcome to VoltStone – your USDT (BEP-20) investment portal.

💰 Our project offers variable returns of up to 20% APY with full transparency.

📌 How it works:
1. Register your BEP-20 wallet
2. Send USDT to the official address
3. Track your investments, earnings and request withdrawals anytime

Choose an option below to get started:
  `;

  bot.sendMessage(chatId, text, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "📥 Deposit", callback_data: "depositar" }],
        [{ text: "📊 My Wallet", callback_data: "carteira" }],
        [{ text: "🔁 Withdraw", callback_data: "resgatar" }]
      ]
    }
  });
});

// 🎛️ Callback buttons
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  if (data === 'depositar') {
    bot.sendMessage(chatId, `📥 Send USDT (BEP-20) to this address:\n\n<code>${process.env.WALLET_ADDRESS}</code>\n\n⚠️ Only use the wallet registered in the system.`, {
      parse_mode: 'HTML'
    });
  }

  if (data === 'carteira') {
    const info = await db.getCarteira(chatId);
    if (!info) {
      return bot.sendMessage(chatId, '⚠️ You have not made any deposit yet.');
    }

    bot.sendMessage(chatId, `
📊 Your Wallet:
💸 Invested: ${info.investido.toFixed(2)} USDT
📈 Estimated Yield: ${info.rendimento.toFixed(2)} USDT
`, { parse_mode: 'HTML' });
  }

  if (data === 'resgatar') {
    const info = await db.getCarteira(chatId);
    if (!info || info.investido <= 0) {
      return bot.sendMessage(chatId, '⚠️ You have no available balance to withdraw.');
    }

    await db.solicitarResgate(chatId, info.investido);
    bot.sendMessage(chatId, `🔁 Withdrawal request of ${info.investido.toFixed(2)} USDT registered successfully.\n⏳ Please wait for manual processing.`);
  }
});

// 🔐 Admin panel
bot.onText(/\/admin/, async (msg) => {
  const chatId = msg.chat.id.toString();
  if (chatId !== process.env.ADMIN_ID) return;

  const { total, rendimento, count } = await db.getAdminPanel();

  bot.sendMessage(chatId, `
📊 Admin Panel:

👥 Registered Users: ${count}
💰 Total Invested: ${total.toFixed(2)} USDT
📈 Total Yield: ${rendimento.toFixed(2)} USDT
`);
});

// 🔄 Check new deposits every 60 seconds
setInterval(async () => {
  try {
    const txs = await bscscan.getDeposits();
    for (let tx of txs) {
      const user = await db.getUserByAddress(tx.from);
      if (user) {
        const alreadyRegistered = await db.isTxRegistered(tx.hash);
        if (!alreadyRegistered) {
          await db.registrarDeposito(user.id, tx.value, tx.hash, tx.from);
          bot.sendMessage(user.id, `✅ Deposit of ${tx.value} USDT confirmed!\n🎉 You’re now earning up to 20% APY.`);
        }
      }
    }
  } catch (err) {
    console.error("Error checking deposits:", err.message);
  }
}, 60 * 1000);