# 🤖 VoltStone Bot – Investimentos em USDT

Bot de Telegram para depósitos e rendimentos em USDT (BEP-20), com rendimento de até **20% APY** e controle via painel `/admin`.

---

## ⚙️ Funcionalidades

- Comandos interativos no Telegram:
  - `/start` – Inicia o bot
  - `💸 Depositar` – Exibe o endereço da carteira USDT
  - `💼 Saldo` – Mostra saldo investido e rendimento acumulado
  - `📈 Rendimentos` – Lista o histórico de rendimentos aplicados
  - `🔁 Resgatar` – Solicita retirada (manual pelo admin)
  - `/admin` – Mostra o painel com totais gerais (apenas admin)

- Armazena dados localmente em `database.json`
- Acesso exclusivo ao painel via ID do administrador
- Integração com Render para deploy automático

---

## 📦 Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/voltstone-bot.git
   cd voltstone-bot