const TelegramBot = require('node-telegram-bot-api');

// Use sua token do BotFather aqui
const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

const carteiraBase = 'TXXXX...USDT'; // endereço fixo ou base
const apy = 20;
const rendimentoDiario = ((1 + apy / 100) ** (1 / 365) - 1) * 100;

const usuarios = {};

function gerarProjecao(valor, dias) {
  let montante = valor;
  for (let i = 0; i < dias; i++) {
    montante *= 1 + rendimentoDiario / 100;
  }
  return montante.toFixed(2);
}

bot.onText(/\/start|.*/, (msg) => {
  const chatId = msg.chat.id;
  const nome = msg.from.first_name || 'investidor';

  if (!usuarios[chatId]) {
    usuarios[chatId] = {
      id: chatId,
      endereco: `${carteiraBase}`, // Pode incluir o ID se quiser personalizar
      historico: [],
    };
  }

  const mensagemBoasVindas = `
👋 Olá ${nome}, seja bem-vindo ao *Bot de Rendimento USDT*!  

💸 *Ganhe 20% ao ano (APY)* de forma simples e automática.

📲 Envie USDT para o endereço abaixo e acompanhe seu rendimento diretamente por aqui. Use as opções abaixo:
`;

  const opcoes = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📥 Depósito', callback_data: 'deposito' },
          { text: '📤 Saque', callback_data: 'saque' }
        ],
        [
          { text: '📈 Rendimento', callback_data: 'rendimento' },
          { text: '📊 Projeção', callback_data: 'projecao' }
        ],
        [
          { text: '🕓 Histórico', callback_data: 'historico' }
        ]
      ]
    },
    parse_mode: 'Markdown'
  };

  bot.sendMessage(chatId, mensagemBoasVindas, opcoes);
});

bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const usuario = usuarios[chatId];

  if (!usuario) return;

  const acao = query.data;

  switch (acao) {
    case 'deposito':
      bot.sendMessage(chatId, `💰 Envie USDT para o endereço abaixo:\n\n\`${usuario.endereco}\``, {
        parse_mode: 'Markdown'
      });
      break;

    case 'saque':
      bot.sendMessage(chatId, `🚧 *Função de saque em desenvolvimento.*`, {
        parse_mode: 'Markdown'
      });
      break;

    case 'rendimento':
      bot.sendMessage(chatId, `📈 O rendimento atual é de *20% ao ano (APY)*.\nIsso representa aproximadamente *${rendimentoDiario.toFixed(4)}% ao dia*.`, {
        parse_mode: 'Markdown'
      });
      break;

    case 'projecao':
      const valorInicial = 1000;
      const dias = 365;
      const futuro = gerarProjecao(valorInicial, dias);
      bot.sendMessage(chatId, `🔮 Projeção de rendimento com *20% APY*:\n\nInvestindo *1000 USDT* por *1 ano*, você terá aproximadamente *${futuro} USDT*.`, {
        parse_mode: 'Markdown'
      });
      break;

    case 'historico':
      const h = usuario.historico;
      if (h.length === 0) {
        bot.sendMessage(chatId, '📄 Seu histórico está vazio no momento.');
      } else {
        const texto = h.map((item, i) => `#${i + 1} - ${item}`).join('\n');
        bot.sendMessage(chatId, `📄 Histórico:\n\n${texto}`);
      }
      break;
  }

  bot.answerCallbackQuery(query.id);
});