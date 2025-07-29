const axios = require('axios');

const API_KEY = process.env.BSC_API_KEY;
const RECEIVER = process.env.WALLET_ADDRESS.toLowerCase();
const TOKEN_ADDRESS = '0x55d398326f99059ff775485246999027b3197955'; // USDT (BEP-20)

async function getDeposits() {
  try {
    const url = `https://api.bscscan.com/api?module=account&action=tokentx&contractaddress=${TOKEN_ADDRESS}&address=${RECEIVER}&sort=desc&apikey=${API_KEY}`;
    const res = await axios.get(url);

    if (!res.data || !res.data.result || !Array.isArray(res.data.result)) {
      console.log("⚠️ Invalid BSCScan response.");
      return [];
    }

    const transactions = res.data.result
      .filter(tx => tx.to.toLowerCase() === RECEIVER)
      .map(tx => ({
        hash: tx.hash,
        from: tx.from,
        value: parseFloat(tx.value) / 10 ** parseInt(tx.tokenDecimal),
        time: new Date(parseInt(tx.timeStamp) * 1000)
      }));

    return transactions;
  } catch (error) {
    console.error("Error fetching deposits:", error.message);
    return [];
  }
}

module.exports = { getDeposits };