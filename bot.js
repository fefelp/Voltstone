require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const db = require('./db');
const bscscan = require('./bscscan');

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// 🌐 Web server for uptime (Render)
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Voltstone Bot is running successfully.'));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// 🚀 /start command
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const name = msg.from.first_name;
  const username = msg.from.username || "";

  const user = await db.getUser(chatId);
  if (!user) await db.addUser(chatId, name, username);

  const welcomeText = `
👋 Hello ${name}!

🚀 Welcome to VoltStone – your USDT (BEP-20) investment portal.

💰 Our project offers dynamic yields up to 20% APY with full transparency.

📌 How it works:
1. Register your BEP-20 wallet
2. Send USDT to our official address
3. Track your investments, earnings, and request withdrawals anytime

Choose an option below to continue:
`;

  bot.sendMessage(chatId, welcomeText, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "📥 Deposit", callback_data: "deposit" }],
        [{ text: "📊 My Wallet", callback_data: "wallet" }],
        [{ text: "🔁 Withdraw", callback_data: "withdraw" }]
      ]
    }
  });
});

// 🎛️ Inline button handlers
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  if (data === 'deposit') {
    bot.sendMessage(chatId, `📥 Send USDT (BEP-20) to this address:\n\n<code>${process.env.WALLET_ADDRESS}</code>\n\n⚠️ Make sure to send only from your registered wallet.`, {
      parse_mode: 'HTML'
    });
  }

  if (data === 'wallet') {
    const info = await db.getWalletInfo(chatId);
    if (!info) {
      return bot.sendMessage(chatId, '⚠️ No deposits found yet.');
    }

    bot.sendMessage(chatId, `
📊 Wallet Overview:
💸 Invested: ${info.invested.toFixed(2)} USDT
📈 Estimated Earnings: ${info.earnings.toFixed(2)} USDT
`, { parse_mode: 'HTML' });
  }

  if (data === 'withdraw') {
    const info = await db.getWalletInfo(chatId);
    if (!info || info.invested <= 0) {
      return bot.sendMessage(chatId, '⚠️ You have no available balance to withdraw.');
    }

    await db.requestWithdrawal(chatId, info.invested);
    bot.sendMessage(chatId, `🔁 Withdrawal request of ${info.invested.toFixed(2)} USDT registered successfully.\n⏳ Await manual processing.`);
  }
});

// 🔐 /admin command (restricted)
bot.onText(/\/admin/, async (msg) => {
  const chatId = msg.chat.id.toString();
  if (chatId !== process.env.ADMIN_ID) return;

  const { total, earnings, count } = await db.getAdminPanel();

  bot.sendMessage(chatId, `
📊 Admin Panel:

👥 Total Users: ${count}
💰 Total Invested: ${total.toFixed(2)} USDT
📈 Total Earnings: ${earnings.toFixed(2)} USDT
`);
});

// 🔄 Check for new deposits every 60s
setInterval(async () => {
  try {
    const transactions = await bscscan.getDeposits();
    for (let tx of transactions) {
      const user = await db.getUserByAddress(tx.from);
      if (user) {
        const alreadyRegistered = await db.isTxRegistered(tx.hash);
        if (!alreadyRegistered) {
          await db.registerDeposit(user.id, tx.value, tx.hash, tx.from);
          bot.sendMessage(user.id, `✅ Deposit of ${tx.value} USDT confirmed!\n🎉 You're now earning up to 20% APY.`);
        }
      }
    }
  } catch (err) {
    console.error("Error while checking deposits:", err.message);
  }
}, 60 * 1000);