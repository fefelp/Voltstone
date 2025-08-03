const { Telegraf, Markup } = require('telegraf');
const { db, init } = require('./db');
const config = require('./config');
const { formatarValor, hoje } = require('./helpers');

init();
const bot = new Telegraf(config.botToken);

// Cria usuário se ainda não existir
function registrarUsuario(ctx) {
  const telegram_id = ctx.from.id.toString();
  const nome = ctx.from.first_name;
  const username = ctx.from.username || '';
  const data_cadastro = hoje();

  db.get('SELECT * FROM usuarios WHERE telegram_id = ?', [telegram_id], (err, row) => {
    if (!row) {
      db.run(
        'INSERT INTO usuarios (telegram_id, nome, username, data_cadastro) VALUES (?, ?, ?, ?)',
        [telegram_id, nome, username, data_cadastro]
      );
    }
  });
}

// Menu principal
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

// Comando /admin
bot.command('admin', (ctx) => {
  if (ctx.from.id !== config.adminId) return;
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

// Botões principais
bot.hears('📥 Depositar', (ctx) => {
  ctx.reply(
    `Para investir, envie no mínimo *${formatarValor(config.depositoMinimo)}* em USDT (rede TRC-20) para a seguinte carteira:\n\n\`${config.carteiraDeposito}\`\n\n📌 O crédito será validado em até 24h.`
  );
});

bot.hears('📊 Ver Saldo', (ctx) => {
  const id = ctx.from.id;
  db.get(
    'SELECT SUM(valor) as total FROM depositos WHERE telegram_id = ?',
    [id],
    (err, row) => {
      const total = row?.total || 0;
      ctx.reply(`💼 Seu saldo total depositado é: *${formatarValor(total)}*`);
    }
  );
});

bot.hears('📈 Meus Rendimentos', (ctx) => {
  const id = ctx.from.id;
  db.get(
    'SELECT rendimento_estimado, data_referencia FROM rendimentos WHERE telegram_id = ? ORDER BY id DESC LIMIT 1',
    [id],
    (err, row) => {
      if (!row) {
        return ctx.reply('⚠️ Nenhum rendimento estimado ainda.');
      }
      ctx.reply(
        `📈 Rendimento estimado em ${row.data_referencia}:\n\n*${row.rendimento_estimado}%* sobre o valor investido.`
      );
    }
  );
});

bot.hears('💸 Sacar', (ctx) => {
  ctx.reply('🔗 Envie sua carteira TRC-20 (USDT):');
  bot.on('text', (ctx2) => {
    const carteira = ctx2.message.text;
    ctx2.reply('💰 Qual valor deseja sacar?');
    bot.on('text', (ctx3) => {
      const valor = parseFloat(ctx3.message.text);
      if (isNaN(valor) || valor <= 0) return ctx3.reply('❌ Valor inválido.');

      db.run(
        'INSERT INTO saques (telegram_id, valor, carteira, status, data_solicitacao) VALUES (?, ?, ?, ?, ?)',
        [ctx3.from.id, valor, carteira, 'pendente', hoje()]
      );
      ctx3.reply('✅ Solicitação de saque enviada! Será processada em até 48h.');
    });
  });
});

bot.hears('📜 Histórico', (ctx) => {
  const id = ctx.from.id;
  db.all(
    'SELECT * FROM depositos WHERE telegram_id = ? ORDER BY data DESC LIMIT 5',
    [id],
    (err, rows) => {
      if (!rows.length) return ctx.reply('⚠️ Nenhum histórico encontrado.');
      let msg = '📜 Últimos depósitos:\n\n';
      rows.forEach((r) => {
        msg += `💵 ${formatarValor(r.valor)} em ${r.data}\n`;
      });
      ctx.reply(msg);
    }
  );
});

// Admin: Confirmar depósito
bot.hears('➕ Confirmar Depósito', (ctx) => {
  if (ctx.from.id !== config.adminId) return;
  ctx.reply('👤 Envie o @username do usuário:');
  bot.on('text', (ctx2) => {
    const user = ctx2.message.text.replace('@', '');
    db.get('SELECT telegram_id FROM usuarios WHERE username = ?', [user], (err, row) => {
      if (!row) return ctx2.reply('❌ Usuário não encontrado.');
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

// Admin: Lançar rendimento
bot.hears('📊 Lançar Rendimento', (ctx) => {
  if (ctx.from.id !== config.adminId) return;
  ctx.reply('👤 Envie o @username:');
  bot.on('text', (ctx2) => {
    const user = ctx2.message.text.replace('@', '');
    db.get('SELECT telegram_id FROM usuarios WHERE username = ?', [user], (err, row) => {
      if (!row) return ctx2.reply('❌ Usuário não encontrado.');
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

// Admin: Confirmar saque
bot.hears('📤 Confirmar Saque', (ctx) => {
  if (ctx.from.id !== config.adminId) return;
  ctx.reply('🔍 Função não implementada: use o banco para atualizar o status de saque manualmente.');
});

bot.launch();
console.log('🤖 Voltstone Bot está rodando...');