// bot.js require('dotenv').config(); const TelegramBot = require('node-telegram-bot-api'); const express = require('express'); const db = require('./db'); const bscscan = require('./bscscan');

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// Web server para manter o bot vivo no Render const app = express(); const PORT = process.env.PORT || 3000; app.get('/', (req, res) => res.send('VoltStone Bot rodando com sucesso.')); app.listen(PORT, () => console.log(Servidor escutando na porta ${PORT}));

// Mensagem de boas-vindas com marketing bot.onText(//start/, async (msg) => { const chatId = msg.chat.id; const nome = msg.from.first_name; const user = await db.getUser(chatId); if (!user) await db.addUser(chatId, nome);

const mensagem = `👋 Olá, ${nome}!

🚀 Bem-vindo ao VoltStone Bot!

💵 Aqui você pode investir em USDT (BEP20) e obter rendimentos de até 20% APY de forma segura, transparente e automatizada.

🔹 Como funciona?

1. Clique em "\uD83D\uDCB6 Depositar" para obter o endereço da carteira.


2. Envie USDT (BEP-20) para começar a render.


3. Acompanhe sua carteira, rendimento e histórico de forma simples.



📈 Totalmente gerenciado via Telegram!

Escolha uma opção abaixo para começar:`;

bot.sendMessage(chatId, mensagem, { parse_mode: 'Markdown', reply_markup: { inline_keyboard: [ [{ text: "\uD83D\uDCB6 Depositar", callback_data: "depositar" }], [{ text: "\uD83D\uDCCA Minha Carteira", callback_data: "carteira" }], [{ text: "\uD83D\uDCB3 Solicitar Saque", callback_data: "resgatar" }] ] } }); });

// Callback dos botões bot.on('callback_query', async (query) => { const chatId = query.message.chat.id; const data = query.data;

if (data === 'depositar') { bot.sendMessage(chatId, `\uD83D\uDCB6 Para investir, envie USDT (BEP20) para:

\uD83D\uDC5B `${process.env.WALLET_ADDRESS}`

⚠️ Use apenas essa rede: BEP20 (BSC).`, { parse_mode: 'Markdown' }); }

if (data === 'carteira') { const info = await db.getCarteira(chatId); if (!info) { bot.sendMessage(chatId, 'Nenhuma carteira conectada ainda. Envie USDT para começar.'); return; } bot.sendMessage(chatId, `\uD83D\uDCCA Sua Carteira:

💰 Investido: ${info.investido} USDT 📈 Rendimento estimado: ${info.rendimento} USDT`, { parse_mode: 'Markdown' }); }

if (data === 'resgatar') { bot.sendMessage(chatId, '🔁 Seu pedido de saque foi registrado.\n\nUm administrador irá processar em breve.', { parse_mode: 'Markdown' }); await db.solicitarSaque(chatId); } });

// Painel do admin bot.onText(//admin/, async (msg) => { const chatId = msg.chat.id; if (chatId.toString() !== process.env.ADMIN_ID) return;

const { total, rendimento, count } = await db.getAdminPanel(); bot.sendMessage(chatId, `\uD83D\uDCCA Painel do Admin:

👥 Usuários: ${count} 💰 Total investido: ${total.toFixed(2)} USDT 📈 Rendimento total: ${rendimento.toFixed(2)} USDT`, { parse_mode: 'Markdown' }); });

// Monitoramento de transações a cada 60s setInterval(async () => { const txs = await bscscan.getDepositos(); for (let tx of txs) { const user = await db.getUserByAddress(tx.from); if (user) { const exists = await db.isTxRegistered(tx.hash); if (!exists) { await db.registrarDeposito(user.id, tx.value, tx.hash); bot.sendMessage(user.id, ✅ Depósito de ${tx.value} USDT recebido com sucesso!\n\nAgora você começa a render até 20% APY!); } } } }, 60 * 1000);

