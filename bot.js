const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

const env = JSON.parse(fs.readFileSync('./env.json', 'utf-8'));
const BOT_TOKEN = env.BOT_TOKEN;
const ADMIN_ID = env.ADMIN_ID;
const CARTEIRA_USDT = env.CARTEIRA_USDT;

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Função para calcular rendimento baseado em 20% APY
function calcularRendimentos(apy = 20) {
  const rendimentoMensal = (Math.pow(1 + apy / 100, 1 / 12) - 1) * 100;
  const rendimentoDiario = (Math.pow(1 + apy / 100, 1 / 365) - 1) * 100;
  return {
    apy,
    mensal: rendimentoMensal.toFixed(2),
    diario: rendimentoDiario.toFixed(4)
  };
}

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const nome = msg.from.first_name || "usuário";
  const rendimento = calcularRendimentos();

  const mensagem = `
👋 Olá, ${nome}!

🎉 Bem-vindo ao TrideUSDT — sua carteira de rendimento automático!

📥 Sua carteira USDT para depósitos:
\`\`\`
${CARTEIRA_USDT}
\`\`\`

📈 Rendimento atual:
- 🔁 *${rendimento.apy}% APY* (anual)
- 📅 ~ *${rendimento.mensal}% ao mês*
- 📆 ~ *${rendimento.diario}% ao dia*

💸 Digite *saque* para solicitar retirada.
📊 Digite *histórico* para ver suas movimentações.
🔮 Digite *projeção* para simular seus ganhos.
📞 Ajuda: fale com @seu_admin_username

✅ Seu saldo é atualizado diariamente.
  `;

  bot.sendMessage(chatId, mensagem, { parse_mode: "Markdown" });
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const texto = msg.text.toLowerCase();

  if (texto.includes("saque")) {
    bot.sendMessage(chatId, "💸 Para solicitar um saque, envie o valor desejado e sua carteira USDT TRC20.");
  } else if (texto.includes("histórico")) {
    bot.sendMessage(chatId, "📊 Seu histórico estará disponível em breve. Mantenha-se atualizado!");
  } else if (texto.includes("projecao") || texto.includes("projeção")) {
    const rendimento = calcularRendimentos();
    bot.sendMessage(chatId, `🔮 Com um APY de ${rendimento.apy}%, seu investimento pode render aproximadamente:\n\n📅 ${rendimento.mensal}% ao mês\n📆 ${rendimento.diario}% ao dia`);
  }
});