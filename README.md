# VoltstoneBot

Bot Telegram de rendimento passivo em USDT com até 20% APY.

## Configuração

### Variáveis de ambiente (Render)

Configure as variáveis de ambiente no painel do Render:

- `BOT_TOKEN` = Seu token do Bot Telegram (ex: 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11)
- `ADMIN_ID` = Seu ID do Telegram (ex: 5608086275)
- `CARTEIRA_DEPOSITO` = Endereço da carteira TRC-20 para depósitos (ex: TVmzjRPgjYt7c1E59z6AtG9U2kZYKex4JZ)
- `DEPOSITO_MINIMO` = Valor mínimo para depósito em USDT (ex: 50)

### Instalação e execução local

1. Clone o repositório
2. Crie arquivo `.env` com as variáveis acima
3. Rode `npm install`
4. Rode `npm start`

---

## Funcionalidades

- Cadastro automático pelo Telegram ID
- Visualização de saldo, rendimentos e histórico
- Depósito manual via carteira TRC-20
- Solicitação de saque
- Painel admin para confirmar depósitos, lançar rendimentos e saques manualmente

---

## Atenção

Este bot não movimenta fundos automaticamente. Toda operação deve ser feita manualmente pelo administrador.

Use com responsabilidade.