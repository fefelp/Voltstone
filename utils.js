// utils.js

function formatarValor(valor) {
  return parseFloat(valor).toFixed(2) + ' USDT';
}

function formatarData(dataISO) {
  const data = new Date(dataISO);
  return data.toLocaleDateString('pt-BR');
}

function calcularRendimento(valor, percentual) {
  return parseFloat((valor * (percentual / 100)).toFixed(2));
}

module.exports = {
  formatarValor,
  formatarData,
  calcularRendimento
};