// bscscan.js
const axios = require('axios');
const db = require('./db');

const API_KEY = process.env.BSC_API_KEY;
const RECEIVER = process.env.WALLET_ADDRESS.toLowerCase();
const USDT = '0x55d398326f99059ff775485246999027b3197955'; // USDT BEP20

async function getDepositos() {
  try {
    const url = `https://api.bscscan.com/api?module=account&action=tokentx&contractaddress=${USDT}&address=${RECEIVER}&sort=desc&apikey=${API_KEY}`;
    const res = await axios.get(url);

    const txs = res.data.result;

    if (!Array.isArray(txs)) {
      console.error("❌ Resposta inesperada da BscScan:", res.data);
      return [];
    }

    return txs
      .filter(tx =>
        tx.to.toLowerCase() === RECEIVER &&
        tx.tokenSymbol === 'USDT'
      )
      .map(tx => ({
        hash: tx.hash,
        from: tx.from,
        value: parseFloat(tx.value) / 10 ** tx.tokenDecimal
      }));
  } catch (e) {
    console.error("Erro ao buscar depósitos:", e.message);
    return [];
  }
}

module.exports = { getDepositos };