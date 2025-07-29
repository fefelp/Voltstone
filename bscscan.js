const axios = require('axios');
const db = require('./db');

const API_KEY = process.env.BSC_API_KEY;
const RECEIVER = process.env.WALLET_ADDRESS.toLowerCase();
const TOKEN_ADDRESS = '0x55d398326f99059ff775485246999027b3197955'; // USDT BEP20

// 🔁 Verifica depósitos para a carteira do bot
async function getDepositos() {
  try {
    const url = `https://api.bscscan.com/api?module=account&action=tokentx&contractaddress=${TOKEN_ADDRESS}&address=${RECEIVER}&sort=desc&apikey=${API_KEY}`;
    const res = await axios.get(url);

    // Verifica se os dados vieram corretamente
    if (!res.data || res.data.status !== '1' || !Array.isArray(res.data.result)) {
      console.error('⚠️ Resposta inválida da BscScan:', res.data.message || res.data.result);
      return [];
    }

    const txs = res.data.result;

    // Filtra apenas transações recebidas
    return txs
      .filter(tx => tx.to.toLowerCase() === RECEIVER)
      .map(tx => ({
        hash: tx.hash,
        from: tx.from,
        value: parseFloat(tx.value) / 10 ** parseInt(tx.tokenDecimal),
        timestamp: Number(tx.timeStamp),
      }));
  } catch (err) {
    console.error('❌ Erro ao buscar transações:', err.message);
    return [];
  }
}

module.exports = { getDepositos };