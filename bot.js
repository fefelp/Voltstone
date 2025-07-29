require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const db = require('./db');
const bscscan = require('./bscscan');

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// 🌐 Web server para manter o Render ativo
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Voltstone bot rodando com sucesso.'));
app.listen(PORT, () => console.log(`Servidor ativo na porta ${PORT}`));

// 🚀 Comando /start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const name = msg.from.first_name;
  const username = msg.from.username || "";

  const user = await db.getUser(chatId);
  if (!user) await db.addUser(chatId, name, username);

  const text = `
👋 Olá ${name}!

🚀 Bem-vindo ao VoltStone – o seu portal de investimentos em USDT (BEP-20).

💰 Nosso projeto oferece rendimentos variáveis de até 20% APY, com total transparência.

📌 Como funciona:
1. Registre sua carteira BEP-20
2. Envie USDT para o endereço oficial
3. Acompanhe seus investimentos, rendimentos e solicite resgates quando quiser

Escolha uma opção abaixo para começar:
  `;

  bot.sendMessage(chatId, text, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "📥 Depositar", callback_data: "depositar" }],
        [{ text: "📊 Minha Carteira", callback_data: "carteira" }],
        [{ text: "🔁 Resgatar", callback_data: "resgatar" }]
      ]
    }
  });
});

// 🎛️ Callback dos botões
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  if (data === 'depositar') {
    bot.sendMessage(chatId, `📥 Envie USDT (BEP-20) para este endereço:\n\n<code>${process.env.WALLET_ADDRESS}</code>\n\n⚠️ Use somente a carteira registrada no sistema.`, {
      parse_mode: 'HTML'
    });
  }

  if (data === 'carteira') {
    const info = await db.getCarteira(chatId);
    if (!info) {
      return bot.sendMessage(chatId, '⚠️ Você ainda não fez nenhum depósito.');
    }

    bot.sendMessage(chatId, `
📊 Sua Carteira:
💸 Investido: ${info.valor.toFixed(2)} USDT
📈 Rendimento estimado: ${info.rendimento.toFixed(2)} USDT
`, { parse_mode: 'HTML' });
  }

  if (data === 'resgatar') {
    const info = await db.getCarteira(chatId);
    if (!info || info.valor <= 0) {
      return bot.sendMessage(chatId, '⚠️ Você não possui saldo disponível para resgate.');
    }

    await db.solicitarResgate(chatId, info.valor);
    bot.sendMessage(chatId, `🔁 Solicitação de resgate no valor de ${info.valor.toFixed(2)} USDT registrada com sucesso.\n⏳ Aguarde o processamento manual.`);
  }
});

// 🔐 Comando /admin (somente para o administrador)
bot.onText(/\/admin/, async (msg) => {
  const chatId = msg.chat.id.toString();
  if (chatId !== process.env.ADMIN_ID) return;

  const { total, rendimento, count } = await db.getAdminPanel();

  bot.sendMessage(chatId, `
📊 Painel do Administrador:

👥 Usuários registrados: ${count}
💰 Total investido: ${total.toFixed(2)} USDT
📈 Rendimento total: ${rendimento.toFixed(2)} USDT
`);
});

// 🔄 Verificador de depósitos a cada 60 segundos
setInterval(async () => {
  try {
    const txs = await bscscan.getDepositos();
    for (let tx of txs) {
      const user = await db.getUserByAddress(tx.from);
      if (user) {
        const alreadyRegistered = await db.isTxRegistered(tx.hash);
        if (!alreadyRegistered) {
          await db.registrarDeposito(user.chat_id, tx.value, tx.hash);
          bot.sendMessage(user.chat_id, `✅ Depósito de ${tx.value} USDT confirmado!\n🎉 Agora você começa a render até 20% APY.`);
        }
      }
    }
  } catch (err) {
    console.error("Erro ao buscar depósitos:", err.message);
  }
}, 60 * 1000);