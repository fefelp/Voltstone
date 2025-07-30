const texts = {
  en: {
    languagePrompt: "Please choose your language:",
    welcome: "Welcome to Tride USDT!",
    deposit: "💰 Deposit",
    wallet: "📁 Wallet",
    withdraw: "💸 Withdraw",
    noDeposit: "You don’t have any deposits yet.",
    noBalance: "You have no balance available to withdraw.",
    depositConfirmed: (amount) => `✅ Your deposit of ${amount} USDT has been confirmed!`,
    sendDepositInfo: (wallet) => `Please send your USDT deposit to this wallet:\n\n<code>${wallet}</code>`,
    walletInfo: (info) => `💼 Wallet info:\nInvested: ${info.investido} USDT`,
    withdrawalRequested: (value) => `✅ Your withdrawal of ${value} USDT has been requested.`,
  },
  pt: {
    languagePrompt: "Escolha seu idioma:",
    welcome: "Bem-vindo ao Tride USDT!",
    deposit: "💰 Depositar",
    wallet: "📁 Carteira",
    withdraw: "💸 Resgatar",
    noDeposit: "Você ainda não tem depósitos.",
    noBalance: "Você não tem saldo disponível para resgatar.",
    depositConfirmed: (amount) => `✅ Seu depósito de ${amount} USDT foi confirmado!`,
    sendDepositInfo: (wallet) => `Por favor, envie seu depósito USDT para esta carteira:\n\n<code>${wallet}</code>`,
    walletInfo: (info) => `💼 Carteira:\nInvestido: ${info.investido} USDT`,
    withdrawalRequested: (value) => `✅ Seu resgate de ${value} USDT foi solicitado.`,
  },
  es: {
    languagePrompt: "Elige tu idioma:",
    welcome: "¡Bienvenido a Tride USDT!",
    deposit: "💰 Depositar",
    wallet: "📁 Billetera",
    withdraw: "💸 Retirar",
    noDeposit: "Aún no tienes depósitos.",
    noBalance: "No tienes saldo disponible para retirar.",
    depositConfirmed: (amount) => `✅ Tu depósito de ${amount} USDT ha sido confirmado.`,
    sendDepositInfo: (wallet) => `Por favor, envía tu depósito USDT a esta billetera:\n\n<code>${wallet}</code>`,
    walletInfo: (info) => `💼 Billetera:\nInvertido: ${info.investido} USDT`,
    withdrawalRequested: (value) => `✅ Tu retiro de ${value} USDT ha sido solicitado.`,
  }
};

module.exports = texts;