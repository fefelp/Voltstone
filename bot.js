// bot.js

require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');
const path = require('path');
const {
  formatarValor,
  formatarData,
  calcularRendimento
} = require('./utils');

const bot = new Telegraf(process.env.BOT_TOKEN);
const DB_PATH = path.join(__dirname, 'database.json');
const WALLET_ADDRESS = process.env.WALLET_ADDRESS || 'SEU_ENDERECO_USDT';
const ADMIN_ID = '5608086275';
const RENDIMENTO_APY = 20;

// Funções utilitárias de banco
function carregarDB() {
  return JSON.parse(fs.readFileSync(DB_PATH));
}

function salvarDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function registrarUsuario(id, nome, username) {
  const db = carregarDB();
  if (!db.usuarios[id]) {
    db.usuarios[id] = {
      nome,
      username,
      valor_depositado: 0,
      rendimento_total: 0,
      data_deposito: new Date().toISOString(),
      historico: [],
      resgate_solicitado: false
    };
    salvarDB(db);
  }
}

// Comandos
bot.start((ctx) => {
  registrarUsuario(ctx.from.id, ctx.from.first_name, ctx.from.username);
  ctx.reply(
    `👋 Olá ${ctx.from.first_name}!\n\n` +
      `💼 Este é o VoltStone, seu bot de investimento em USDT.\n` +
      `💰 Rendimento estimado: até ${RENDIMENTO_APY}% APY.\n\n` +
      `Escolha uma opção abaixo:`,
    Markup.keyboard([
      ['💸 Depositar', '💼 Saldo'],
      ['📈 Rendimentos', '🔁 Resgatar']
    ])
      .resize()
      .oneTime()
  );
});

bot.hears('💸 Depositar', (ctx) => {
  ctx.reply(
    `📥 Envie USDT (BEP-20) para este endereço:\n\n` +
      `\`${WALLET_ADDRESS}\`\n\n` +
      `🔍 Após enviar, envie uma mensagem para confirmar.`,
    { parse_mode: 'Markdown' }
  );
});

bot.hears('💼 Saldo', (ctx) => {
  const db = carregarDB();
  const user = db.usuarios[ctx.from.id];
  if (!user || user.valor_depositado <= 0) {
    ctx.reply('❌ Nenhum depósito encontrado.');
    return;
  }

  ctx.reply(
    `💼 Depósito: ${formatarValor(user.valor_depositado)}\n` +
      `📈 Rendimento acumulado: ${formatarValor(user.rendimento_total)}\n` +
      `📅 Desde: ${formatarData(user.data_deposito)}`
  );
});

bot.hears('📈 Rendimentos', (ctx) => {
  const db = carregarDB();
  const user = db.usuarios[ctx.from.id];
  if (!user || user.historico.length === 0) {
    ctx.reply('📭 Nenhum rendimento registrado ainda.');
    return;
  }

  let texto = '📊 Histórico de Rendimentos:\n\n';
  user.historico.forEach((item) => {
    texto += `• ${formatarData(item.data)}: +${item.percentual}% → +${formatarValor(item.valor)}\n`;
  });
  ctx.reply(texto);
});

bot.hears('🔁 Resgatar', (ctx) => {
  const db = carregarDB();
  const user = db.usuarios[ctx.from.id];
  if (!user || user.valor_depositado <= 0) {
    ctx.reply('❌ Você não tem saldo para resgatar.');
    return;
  }

  user.resgate_solicitado = true;
  salvarDB(db);

  ctx.reply('✅ Sua solicitação de resgate foi registrada.');

  bot.telegram.sendMessage(
    ADMIN_ID,
    `🔔 Solicitação de resgate:\n` +
      `👤 ${user.nome} (@${user.username})\n` +
      `🆔 ID: ${ctx.from.id}\n` +
      `💰 Total: ${formatarValor(user.valor_depositado + user.rendimento_total)}`
  );
});

bot.command('admin', (ctx) => {
  if (ctx.from.id.toString() !== ADMIN_ID) {
    ctx.reply('🚫 Acesso negado.');
    return;
  }

  const db = carregarDB();
  const totalUsuarios = Object.keys(db.usuarios).length;
  let totalInvestido = 0;
  let totalRendimento = 0;

  Object.values(db.usuarios).forEach((u) => {
    totalInvestido += u.valor_depositado;
    totalRendimento += u.rendimento_total;
  });

  ctx.reply(
    `📊 Painel do Admin:\n\n` +
      `👥 Usuários: ${totalUsuarios}\n` +
      `💰 Total investido: ${formatarValor(totalInvestido)}\n` +
      `📈 Rendimento total: ${formatarValor(totalRendimento)}`
  );
});

bot.launch();
console.log('🤖 VoltStone Bot ativo!');