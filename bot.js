const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const db = require('./db');

const env = JSON.parse(fs.readFileSync('./env.json'));
const bot = new TelegramBot(env.BOT_TOKEN, { polling: true });

function calcularRendimento(balance) {
  const apy = 0.20;
  const dailyRate = Math.pow(1 + apy, 1 / 365) - 1;
  return +(balance * dailyRate).toFixed(6);
}

function enviarMenu(chatId) {
  bot.sendMessage(chatId, "📋 *Menu principal*", {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "💼 Carteira", callback_data: "carteira" }],
        [{ text: "📈 Rendimento", callback_data: "rendimento" }],
        [{ text: "📊 Projeção", callback_data: "projecao" }],
        [{ text: "📜 Histórico", callback_data: "historico" }],
        [{ text: "💸 Saque", callback_data: "saque" }]
      ]
    }
  });
}

bot.onText(/\/start/, (msg) => {
  const id = msg.from.id;
  if (!db.usuarios[id]) {
    db.usuarios[id] = { balance: 0 };
    db.historico[id] = [];
  }
  bot.sendMessage(id, `👋 Bem-vindo, ${msg.from.first_name}!\n\nSeu bot está ativo.`)
    .then(() => enviarMenu(id));
});

bot.on('message', (msg) => {
  const id = msg.chat.id;
  if (msg.text === '/start') return;
  enviarMenu(id);
});

bot.on("callback_query", (query) => {
  const id = query.from.id;
  const data = query.data;
  const user = db.usuarios[id] || { balance: 0 };
  if (!db.usuarios[id]) {
    db.usuarios[id] = { balance: 0 };
    db.historico[id] = [];
  }

  if (data === "carteira") {
    bot.sendMessage(id, `💼 Sua carteira USDT:\n\`${env.CARTEIRA_USDT}\``, { parse_mode: "Markdown" });
  }

  if (data === "rendimento") {
    const ganho = calcularRendimento(user.balance);
    user.balance += ganho;
    db.historico[id].push({ tipo: "rendimento", valor: ganho, data: new Date() });
    bot.sendMessage(id, `📈 Você recebeu *${ganho.toFixed(6)} USDT* hoje.`, { parse_mode: "Markdown" });
  }

  if (data === "projecao") {
    const dias = 30;
    let saldo = user.balance;
    const apy = 0.20;
    const dailyRate = Math.pow(1 + apy, 1 / 365) - 1;
    for (let i = 0; i < dias; i++) saldo += saldo * dailyRate;
    bot.sendMessage(id, `📊 Projeção em 30 dias: *${saldo.toFixed(6)} USDT*`, { parse_mode: "Markdown" });
  }

  if (data === "historico") {
    const hist = db.historico[id];
    if (!hist.length) return bot.sendMessage(id, "📜 Sem histórico ainda.");
    const texto = hist.map((h, i) =>
      `${i + 1}. ${h.tipo.toUpperCase()}: ${h.valor.toFixed(6)} em ${new Date(h.data).toLocaleDateString()}`
    ).join('\n');
    bot.sendMessage(id, `📜 Histórico:\n\n${texto}`);
  }

  if (data === "saque") {
    bot.sendMessage(id, "💸 Para solicitar saque, envie seu endereço e valor para o admin.");
  }
});