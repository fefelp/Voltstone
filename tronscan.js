// ✅ tronscan.js const axios = require('axios');

const WALLET_ADDRESS = process.env.WALLET_ADDRESS.toLowerCase(); const TOKEN_CONTRACT = 'TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj'; // USDT TRC-20

async function getDeposits() { try { const url = https://apilist.tronscanapi.com/api/transaction?sort=-timestamp&count=true&limit=50&start=0&address=${WALLET_ADDRESS}; const { data } = await axios.get(url);

if (!data || !Array.isArray(data.data)) {
  console.log("⚠️ Invalid TronScan response");
  return [];
}

return data.data
  .filter(tx => tx.tokenInfo?.tokenId === TOKEN_CONTRACT && tx.toAddress?.toLowerCase() === WALLET_ADDRESS)
  .map(tx => ({
    hash: tx.hash,
    from: tx.ownerAddress,
    value: tx.tokenInfo.tokenDecimal
      ? parseFloat(tx.amount) / (10 ** parseInt(tx.tokenInfo.tokenDecimal))
      : 0,
    time: new Date(tx.timestamp)
  }));

} catch (error) { console.error("Error fetching deposits from TronScan:", error.message); return []; } }

module.exports = { getDeposits };

