const { Telegraf } = require('telegraf');
const fs = require('fs');
const { addUser } = require('./database');

// Carregar variáveis de ambiente
const env = JSON.parse(fs.readFileSync('./env.json'));
const { BOT_TOKEN, ADMIN_ID, CARTEIRA_USDT } = env;

// Inicializa o bot
const bot = new Telegraf(BOT_TOKEN);

// Comando /start
bot.start((ctx) => {
  addUser(ctx);
  ctx.reply(`Bem-vindo, ${ctx.from.first_name}! 🪙\nCarteira USDT: ${CARTEIRA_USDT}`);
});

// Comando /carteira
bot.command('carteira', (ctx) => {
  ctx.reply(`💰 Endereço da carteira USDT: ${CARTEIRA_USDT}`);
});

// Comando restrito ao admin
bot.command('usuarios', (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return ctx.reply('❌ Sem permissão.');

  const sqlite3 = require('sqlite3').verbose();
  const db = new sqlite3.Database('./database.db');

  db.all('SELECT * FROM users', (err, rows) => {
    if (err) return ctx.reply('Erro ao acessar o banco de dados.');
    if (!rows.length) return ctx.reply('Nenhum usuário encontrado.');

    const lista = rows.map(u => `👤 ${u.first_name} (@${u.username || 'sem_username'})`).join('\n');
    ctx.reply(`👥 Usuários registrados:\n\n${lista}`);
  });
});

// Inicializa polling
bot.launch();
console.log("✅ Bot está rodando...");

// Encerrar corretamente
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));