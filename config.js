// config.js
module.exports = {
  botToken: process.env.BOT_TOKEN,
  adminId: Number(process.env.ADMIN_ID),
  carteiraDeposito: process.env.CARTEIRA_DEPOSITO,
  depositoMinimo: Number(process.env.DEPOSITO_MINIMO) || 50
};