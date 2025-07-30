const axios = require('axios');

const RECEIVER = process.env.WALLET_ADDRESS;
const USDT_CONTRACT = 'TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj'; // USDT TRC-20

async function getDeposits() {
  try {
    const url = `https://apilist.tronscanapi.com/api/token_trc20/transfers?limit=50&start=0&sort=-timestamp&toAddress=${RECEIVER}&contract_address=${USDT_CONTRACT}`;
    const res = await axios.get(url);

    if (!res.data || !res.data.data || !Array.isArray(res.data.data)) {
      console.log("⚠️ Invalid TronScan response.");
      return [];
    }

    const transactions = res.data.data.map(tx => ({
      hash: tx.transaction_id,
      from: tx.from_address,
      value: parseFloat(tx.quant) / 1e6, // 6 casas decimais
      time: new Date(tx.block_ts)
    }));

    return transactions;
  } catch (error) {
    console.error("Error fetching Tron deposits:", error.message);
    return [];
  }
}

module.exports = { getDeposits };