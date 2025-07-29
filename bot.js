const TelegramBot = require('node-telegram-bot-api');
const { getDeposits } = require('./bscscan');
const db = require('./utils');
const TOKEN = process.env.BOT_TOKEN || 'SEU_TOKEN_AQUI';

const bot = new TelegramBot(TOKEN, { polling: true });
const ADMIN_ID = '5608086275'; // seu ID

// /start
bot.onText(/\/start/, (msg) => {
  const id = msg.from.id;
  const firstName = msg.from.first_name;
  db.addUser(id, msg.from.username, firstName);

  const text = `👋 Olá, *${firstName}*!\n\n` +
               `💼 *VoltStone Bot* é uma carteira digital de rendimento com USDT (BEP20).\n` +
               `📈 Você pode investir, acompanhar seus rendimentos e gerenciar sua carteira.\n\n` +
               `Escolha uma opção abaixo:`;

  const options = {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '💸 Depositar', callback_data: 'depositar' }, { text: '📊 Saldo', callback_data: 'saldo' }],
        [{ text: '🔍 Verificar', callback_data: 'check' }, { text: '📈 Rendimentos', callback_data: 'rendimentos' }],
        [{ text: '👤 Perfil', callback_data: 'perfil' }]
      ]
    }
  };

  bot.sendMessage(id, text, options);
});

// Botões inline
bot.on('callback_query', async (query) => {
  const data = query.data;
  const msg = query.message;

  switch (data) {
    case 'depositar':
      bot.sendMessage(msg.chat.id, `💳 Envie USDT para a carteira:\n\`\`\`\n0xEacfcC32F15f4055a6F0555C271B43FfB61Abc79\n\`\`\`\nUse /check após enviar.`, { parse_mode: 'Markdown' });
      break;

    case 'saldo':
      const saldo = db.getUser(msg.from.id);
      if (!saldo) return bot.sendMessage(msg.chat.id, `❌ Nenhum saldo registrado.`);
      bot.sendMessage(msg.chat.id,
        `💼 *Seu saldo:*\n\n` +
        `💰 Investido: ${saldo.valor || 0} USDT\n📈 Rendimento: ${saldo.rendimento || 0} USDT`, { parse_mode: 'Markdown' });
      break;

    case 'check':
      const carteira = db.getCarteira(msg.from.id);
      if (!carteira) return bot.sendMessage(msg.chat.id, `❗ Registre sua carteira primeiro com /carteira`);
      const resultado = await getDeposits(carteira, msg.from.id);
      bot.sendMessage(msg.chat.id, resultado);
      break;

    case 'perfil':
      const perfil = db.getUser(msg.from.id);
      if (!perfil) return bot.sendMessage(msg.chat.id, `❌ Você ainda não tem um perfil.`);
      bot.sendMessage(msg.chat.id,
        `👤 *Perfil de Investidor*\n\n` +
        `🆔 ID: ${msg.from.id}\n` +
        `📛 Nome: ${perfil.nome}\n` +
        `🏦 Carteira: ${perfil.carteira || 'não registrada'}\n` +
        `💰 Investido: ${perfil.valor || 0} USDT\n` +
        `📈 Rendimento: ${perfil.rendimento || 0} USDT`, { parse_mode: 'Markdown' });
      break;

    case 'rendimentos':
      const hist = db.getHistorico(msg.from.id);
      if (!hist || hist.length === 0) {
        bot.sendMessage(msg.chat.id, `📭 Nenhum rendimento registrado ainda.`);
      } else {
        let texto = "📈 *Histórico de Rendimentos:*\n\n";
        hist.forEach(item => {
          texto += `🗓 ${item.data} → +${item.percentual}% = +${item.valor} USDT\n`;
        });
        bot.sendMessage(msg.chat.id, texto, { parse_mode: 'Markdown' });
      }
      break;
  }

  bot.answerCallbackQuery(query.id);
});

// /carteira 0x...
bot.onText(/\/carteira (0x[a-fA-F0-9]{40})/, (msg, match) => {
  const id = msg.from.id;
  const carteira = match[1];
  db.salvarCarteira(id, carteira);
  bot.sendMessage(id, `✅ Carteira registrada com sucesso:\n\`${carteira}\``, { parse_mode: 'Markdown' });
});

// /admin
bot.onText(/\/admin/, (msg) => {
  if (msg.from.id.toString() !== ADMIN_ID) return;
  const total = db.getTotalInvestido();
  const users = db.getTotalUsuarios();
  bot.sendMessage(msg.chat.id,
    `📊 *Painel Administrativo*\n\n` +
    `👥 Usuários: ${users}\n` +
    `💰 Total Investido: ${total} USDT`, { parse_mode: 'Markdown' });
});