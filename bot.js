require('dotenv').config();

const { Telegraf, Markup } = require('telegraf');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Inicializa banco SQLite
const dbPath = path.join(__dirname, 'database');
if (!fs.existsSync(dbPath)) fs.mkdirSync(dbPath);

const db = new sqlite3.Database(path.join(dbPath, 'voltstone.db'));

// Criação das tabelas se não existirem
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS usuarios (
    telegram_id TEXT PRIMARY KEY,
    nome TEXT,
    username TEXT,
    data_cadastro TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS depositos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id TEXT,
    valor REAL,
    data TEXT,
    txid TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS rendimentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id TEXT,
    rendimento_estimado REAL,
    rendimento_real REAL,
    data_referencia TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS saques (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id TEXT,
    valor REAL,
    carteira TEXT,
    status TEXT,
    data_solicitacao TEXT
  )`);
});

// Funções auxiliares
function formatarValor(valor) {
  return `${Number(valor).toFixed(2)} USDT`;
}

function hoje() {
  return new Date().toISOString().split('T')[0];
}

// Variáveis de ambiente
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = Number(process.env.ADMIN_ID);
const CARTEIRA_DEPOSITO = process.env.CARTEIRA_DEPOSITO;
const DEPOSITO_MINIMO = Number(process.env.DEPOSITO_MINIMO) || 50;

if (!BOT_TOKEN) {
  console.error('❌ Variável BOT_TOKEN não definida. Finalizando...');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// Registro usuário
function registrarUsuario(ctx) {
  const telegram_id = ctx.from.id.toString();
  const nome = ctx.from.first_name;
  const username = ctx.from.username || '';
  const data_cadastro = hoje();

  db.get('SELECT * FROM usuarios WHERE telegram_id = ?', [telegram_id], (err, row) => {
    if (err) return console.error(err);
    if (!row) {
      db.run(
        'INSERT INTO usuarios (telegram_id, nome, username, data_cadastro) VALUES (?, ?, ?, ?)',
        [telegram_id, nome, username, data_cadastro]
      );
    }
  });
}

// Comandos e handlers
bot.start((ctx) => {
  registrarUsuario(ctx);
  ctx.reply(
    `💰 *Ganhe até 20% APY* investindo em *USDT* com o *Voltstone Bot*! 
Totalmente automatizado, seguro e com retirada mensal. Comece agora mesmo.`,
    Markup.keyboard([
      ['📥 Depositar', '📈 Meus Rendimentos'],
      ['💸 Sacar', '📊 Ver Saldo'],
      ['📜 Histórico']
    ])
    .resize()
    .oneTime()
  );
});

bot.command('admin', (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;
  ctx.reply(
    '🔐 Painel do administrador',
    Markup.keyboard([
      ['➕ Confirmar Depósito', '📤 Confirmar Saque'],
      ['📊 Lançar Rendimento'],
      ['⬅️ Voltar']
    ])
    .resize()
  );
});

bot.hears('📥 Depositar', (ctx) => {
  ctx.reply(
    `Para investir, envie no mínimo *${formatarValor(DEPOSITO_MINIMO)}* em USDT (rede TRC-20) para a seguinte carteira:\n\n\`${CARTEIRA_DEPOSITO}\`\n\n📌 O crédito será validado em até 24h.`
  );
});

bot.hears('📊 Ver Saldo', (ctx) => {
  const id = ctx.from.id.toString();
  db.get(
    'SELECT SUM(valor) as total FROM depositos WHERE telegram_id = ?',
    [id],
    (err, row) => {
      if (err) return ctx.reply('Erro ao buscar saldo.');
      const total = row?.total || 0;
      ctx.reply(`💼 Seu saldo total depositado é: *${formatarValor(total)}*`);
    }
  );
});

bot.hears('📈 Meus Rendimentos', (ctx) => {
  const id = ctx.from.id.toString();
  db.get(
    'SELECT rendimento_estimado, data_referencia FROM rendimentos WHERE telegram_id = ? ORDER BY id DESC LIMIT 1',
    [id],
    (err, row) => {
      if (err || !row) return ctx.reply('⚠️ Nenhum rendimento estimado ainda.');
      ctx.reply(
        `📈 Rendimento estimado em ${row.data_referencia}:\n\n*${row.rendimento_estimado}%* sobre o valor investido.`
      );
    }
  );
});

bot.hears('💸 Sacar', (ctx) => {
  ctx.reply('🔗 Envie sua carteira TRC-20 (USDT):');
  bot.on('text', (ctx2) => {
    if (!ctx2.message || !ctx2.message.text) return;
    const carteira = ctx2.message.text.trim();
    ctx2.reply('💰 Qual valor deseja sacar?');
    bot.on('text', (ctx3) => {
      if (!ctx3.message || !ctx3.message.text) return;
      const valor = parseFloat(ctx3.message.text);
      if (isNaN(valor) || valor <= 0) return ctx3.reply('❌ Valor inválido.');

      db.run(
        'INSERT INTO saques (telegram_id, valor, carteira, status, data_solicitacao) VALUES (?, ?, ?, ?, ?)',
        [ctx3.from.id.toString(), valor, carteira, 'pendente', hoje()]
      );
      ctx3.reply('✅ Solicitação de saque enviada! Será processada em até 48h.');
    });
  });
});

bot.hears('📜 Histórico', (ctx) => {
  const id = ctx.from.id.toString();
  db.all(
    'SELECT * FROM depositos WHERE telegram_id = ? ORDER BY data DESC LIMIT 5',
    [id],
    (err, rows) => {
      if (err || rows.length === 0) return ctx.reply('⚠️ Nenhum histórico encontrado.');
      let msg = '📜 Últimos depósitos:\n\n';
      rows.forEach((r) => {
        msg += `💵 ${formatarValor(r.valor)} em ${r.data}\n`;
      });
      ctx.reply(msg);
    }
  );
});

// Admin confirma depósito
bot.hears('➕ Confirmar Depósito', (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;
  ctx.reply('👤 Envie o @username do usuário:');
  bot.on('text', (ctx2) => {
    const user = ctx2.message.text.replace('@', '');
    db.get('SELECT telegram_id FROM usuarios WHERE username = ?', [user], (err, row) => {
      if (err || !row) return ctx2.reply('❌ Usuário não encontrado.');
      const id = row.telegram_id;
      ctx2.reply('💵 Qual valor foi depositado?');
      bot.on('text', (ctx3) => {
        const valor = parseFloat(ctx3.message.text);
        if (isNaN(valor)) return ctx3.reply('❌ Valor inválido.');
        db.run(
          'INSERT INTO depositos (telegram_id, valor, data) VALUES (?, ?, ?)',
          [id, valor, hoje()]
        );
        ctx3.reply('✅ Depósito confirmado!');
      });
    });
  });
});

// Admin lança rendimento
bot.hears('📊 Lançar Rendimento', (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;
  ctx.reply('👤 Envie o @username:');
  bot.on('text', (ctx2) => {
    const user = ctx2.message.text.replace('@', '');
    db.get('SELECT telegram_id FROM usuarios WHERE username = ?', [user], (err, row) => {
      if (err || !row) return ctx2.reply('❌ Usuário não encontrado.');
      const id = row.telegram_id;
      ctx2.reply('📈 Qual rendimento estimado (%)?');
      bot.on('text', (ctx3) => {
        const rendimento = parseFloat(ctx3.message.text);
        if (isNaN(rendimento)) return ctx3.reply('❌ Valor inválido.');
        db.run(
          'INSERT INTO rendimentos (telegram_id, rendimento_estimado, data_referencia) VALUES (?, ?, ?)',
          [id, rendimento, hoje()]
        );
        ctx3.reply('✅ Rendimento registrado.');
      });
    });
  });
});

// Admin confirma saque
bot.hears('📤 Confirmar Saque', (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;
  ctx.reply('🔍 Função não implementada: atualize manualmente no banco de dados.');
});

bot.launch().then(() => {
  console.log('🤖 Voltstone Bot está rodando...');
}).catch((err) => {
  console.error('Erro ao iniciar o bot:', err);
  process.exit(1);
});