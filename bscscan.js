const axios = require('axios');
const db = require('./db');

const API_KEY = process.env.BSC_API_KEY;
const RECEIVER = process.env.WALLET_ADDRESS.toLowerCase();
const TOKEN_ADDRESS = '0x55d398326f99059ff775485246999027b3197955'; // USDT BEP20

// 🔍 Busca transações BEP-20 para a carteira configurada
async function getDepositos() {
  try {
    const url = `https://api.bscscan.com/api?module=account&action=tokentx&contractaddress=${TOKEN_ADDRESS}&address=${RECEIVER}&sort=desc&apikey=${API_KEY}`;
    const res = await axios.get(url);

    const txs = res.data.result;

    if (!Array.isArray(txs)) {
      console.error('⚠️ Resposta inesperada da BscScan:', res.data);
      return [];
    }

    const filtradas = txs.filter(tx =>
      tx.to.toLowerCase() === RECEIVER &&
      parseFloat(tx.value) > 0
    ).map(tx => ({
      hash: tx.hash,
      from: tx.from,
      value: parseFloat(tx.value) / 10 ** parseInt(tx.tokenDecimal)
    }));

    return filtradas;
  } catch (err) {
    console.error('❌ Erro ao buscar depósitos:', err.message);
    return [];
  }
}

module.exports = { getDepositos };