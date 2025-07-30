// tronscan.js const axios = require('axios');

const RECEIVER = process.env.WALLET_ADDRESS.toLowerCase(); const TOKEN_ID = '1002000'; // USDT-TRC20 token ID

async function getDeposits() { try { const url = https://apilist.tronscanapi.com/api/token_trc20/transfers?limit=50&sort=-timestamp&filterTokenValue=1&relatedAddress=${RECEIVER}; const res = await axios.get(url);

if (!res.data || !res.data.data || !Array.isArray(res.data.data)) {
  console.log("⚠️ Invalid TronScan response.");
  return [];
}

const transactions = res.data.data
  .filter(tx => tx.to_address?.toLowerCase() === RECEIVER && tx.tokenInfo.tokenId === TOKEN_ID)
  .map(tx => ({
    hash: tx.transaction_id,
    from: tx.from_address,
    value: parseFloat(tx.quant) / 10 ** parseInt(tx.tokenInfo.tokenDecimal),
    time: new Date(tx.block_timestamp)
  }));

return transactions;

} catch (error) { console.error("Error fetching TRON deposits:", error.message); return []; } }

module.exports = { getDeposits };

