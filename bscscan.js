const axios = require('axios');
const db = require('./utils');

const API_KEY = process.env.BSCSCAN_API_KEY || '8UQRFDKK3NK4RQDGG7D6SI6ZADXW41H5MC';
const RECEIVER = '0xEacfcC32F15f4055a6F0555C271B43FfB61Abc79'.toLowerCase();
const TOKEN_ADDRESS = '0x55d398326f99059ff775485246999027b3197955'; // USDT BEP20

async function getDeposits(fromAddress, userId) {
  try {
    const url = `https://api.bscscan.com/api?module=account&action=tokentx&contractaddress=${TOKEN_ADDRESS}&address=${RECEIVER}&sort=desc&apikey=${API_KEY}`;
    const res = await axios.get(url);
    const txs = res.data.result;

    const userTxs = txs.filter(tx =>
      tx.from.toLowerCase() === fromAddress.toLowerCase() &&
      tx.to.toLowerCase() === RECEIVER
    );

    if (userTxs.length === 0) return '❌ Nenhum depósito seu foi encontrado.';

    const nova = userTxs[0]; // último depósito
    const valor = parseFloat(nova.value) / 10 ** parseInt(nova.tokenDecimal);

    db.registrarDeposito(userId, valor);
    return `✅ Depósito de ${valor} USDT confirmado com sucesso!`;
  } catch (err) {
    console.error('Erro BscScan:', err.message);
    return '❗ Erro ao consultar a blockchain.';
  }
}

module.exports = { getDeposits };