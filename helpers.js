function formatarValor(valor) {
  return `${Number(valor).toFixed(2)} USDT`;
}

function hoje() {
  const hoje = new Date();
  return hoje.toISOString().split("T")[0]; // Exemplo: 2025-08-03
}

module.exports = {
  formatarValor,
  hoje
};