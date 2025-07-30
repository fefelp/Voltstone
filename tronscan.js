const axios = require('axios');

const RECEIVER = process.env.WALLET_ADDRESS?.trim().toLowerCase();
const TOKEN = 'TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7'; // USDT (TRC-20)

async function getDeposits() {
  try {
    if (!RECEIVER) {
      console.error("❌ WALLET_ADDRESS not defined in .env");
      return [];
    }

    const url = `https://apilist.tronscanapi.com/api/token_trc20/transfers?limit=20&sort=-timestamp&relatedAddress=${RECEIVER}`;
    const res = await axios.get(url, {
      headers: {
        'accept': 'application/json',
        'user-agent': 'Mozilla/5.0' // evita bloqueios por falta de UA
      }
    });

    if (!res.data || !res.data.data || !Array.isArray(res.data.data)) {
      console.log("⚠️ Invalid TronScan response.");
      return [];
    }

    const transactions = res.data.data
      .filter(tx =>
        tx.to_address?.toLowerCase() === RECEIVER &&
        tx.token_info?.tokenId === TOKEN
      )
      .map(tx => ({
        hash: tx.transaction_id,
        from: tx.from_address,
        value: parseFloat(tx.quant) / 1_000_000,
        time: new Date(tx.block_ts)
      }));

    return transactions;
  } catch (error) {
    console.error("❌ Error fetching deposits:", error.message);
    return [];
  }
}

module.exports = { getDeposits };