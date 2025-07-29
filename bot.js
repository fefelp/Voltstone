// 📁 bot.js require('dotenv').config(); const TelegramBot = require('node-telegram-bot-api'); const express = require('express'); const db = require('./db'); const bscscan = require('./bscscan');

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// 🌐 Servidor web para manter Render ativo const app = express(); const PORT = process.env.PORT || 3000; app.get('/', (req, res) => res.send('VoltStone Bot ativo')); app.listen(PORT, () => console.log(Servidor na porta ${PORT}));

// 🤖 Mensagem de boas-vindas estilizada bot.onText(//start/, async (msg) => { const chatId = msg.chat.id; const name = msg.from.first_name; const username = msg.from.username || "";

const user = await db.getUser(chatId); if (!user) await db.addUser(chatId, name, username);

const welcome = `👋 Olá <b>${name}</b>!

✨ Bem-vindo ao <b>VoltStone</b>, o bot de investimento em USDT (BEP20).

♻ Rendimento estimado: <b>até 20% APY</b>

<b>Como funciona:</b>

1. Registre sua carteira BNB (BEP-20)


2. Deposite USDT na carteira do bot


3. Aguarde confirmação e comece a render


4. Solicite resgate quando desejar



Escolha uma opção abaixo para continuar:`;

bot.sendMessage(chatId, welcome, { parse_mode: "HTML", reply_markup: { inline_keyboard: [ [{ text: "💳 Registrar Carteira", callback_data: "registrar" }], [{ text: "📅 Depositar", callback_data: "depositar" }], [{ text: "📊 Minha Carteira", callback_data: "carteira" }], [{ text: "🔄 Resgatar", callback_data: "resgatar" }] ] } }); });

// 🔍 Callback de botões interativos bot.on('callback_query', async (query) => { const chatId = query.message.chat.id; const data = query.data;

if (data === 'registrar') { bot.sendMessage(chatId, 'Por favor, envie seu endereço de carteira BNB (BEP20):'); bot.once('message', async (msg) => { const address = msg.text.trim(); await db.registrarCarteira(chatId, address); bot.sendMessage(chatId, 💼 Carteira registrada com sucesso: <code>${address}</code>, { parse_mode: 'HTML' }); }); }

if (data === 'depositar') { const address = process.env.WALLET_ADDRESS; bot.sendMessage(chatId, `📅 Envie USDT (BEP20) para:

<code>${address}</code>

Apenas de carteiras registradas!`, { parse_mode: 'HTML' }); }

if (data === 'carteira') { const info = await db.getCarteira(chatId); if (info) { bot.sendMessage(chatId, `📊 Sua Carteira:

💸 Investido: ${info.investido} USDT 📈 Rendimento estimado: ${info.rendimento} USDT`, { parse_mode: 'HTML' }); } else { bot.sendMessage(chatId, 'Nenhuma informação encontrada. Registre sua carteira primeiro.'); } }

if (data === 'resgatar') { bot.sendMessage(chatId, 'Informe o valor a resgatar (em USDT):'); bot.once('message', async (msg) => { const valor = parseFloat(msg.text.replace(',', '.')); if (isNaN(valor)) return bot.sendMessage(chatId, 'Valor inválido. Tente novamente.'); await db.solicitarResgate(chatId, valor); bot.sendMessage(chatId, ✉️ Solicitação de resgate de ${valor} USDT registrada.); }); } });

// 🔒 Painel administrativo bot.onText(//admin/, async (msg) => { const chatId = msg.chat.id; if (chatId.toString() !== process.env.ADMIN_ID) return; const { total, rendimento, count } = await db.getAdminPanel(); bot.sendMessage(chatId, `📊 Painel Admin:

📋 Total Investido: ${total.toFixed(2)} USDT 📈 Rendimento Total: ${rendimento.toFixed(2)} USDT 👥 Usuários: ${count}`); });

// ⌚ Loop de verificador de transações setInterval(async () => { const txs = await bscscan.getDepositos(); for (let tx of txs) { const user = await db.getUserByAddress(tx.from); if (user) { const jaTem = await db.isTxRegistered(tx.hash); if (!jaTem) { await db.registrarDeposito(user.chat_id, tx.value, tx.hash); bot.sendMessage(user.chat_id, ✅ Depósito de ${tx.value} USDT recebido! ✨ Agora você está rendendo com a VoltStone.); } } } }, 60 * 1000);

