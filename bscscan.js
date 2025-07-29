const axios = require('axios');
const db = require('./db');

const API_KEY = process.env.BSC_API_KEY;
const RECEIVER = process.env.WALLET_ADDRESS.toLowerCase();
const TOKEN_ADDRESS = '0x55d398326f99059ff775485246999027b3197955'; // USDT BEP20

async function getDeposits() {
  try {
    const url = `https://api.bscscan.com/api?module=account&action=tokentx&contractaddress=${TOKEN_ADDRESS}&address=${RECEIVER}&sort=desc&apikey=${API_KEY}`;
    const res = await axios.get(url);

    if (!res.data || !res.data.result || !Array.isArray(res.data.result)) {
      console.log("⚠️ BSCScan retornou dados inválidos.");
      return [];
    }

    const txs = res.data.result
      .filter(tx => tx.to.toLowerCase() === RECEIVER)
      .map(tx => ({
        hash: tx.hash,
        from: tx.from,
        value: parseFloat(tx.value) / 10 ** parseInt(tx.tokenDecimal),
        time: new Date(parseInt(tx.timeStamp) * 1000)
      }));

    return txs;
  } catch (err) {
    console.error("Erro ao buscar depósitos:", err.message);
    return [];
  }
}

module.exports = { getDeposits };