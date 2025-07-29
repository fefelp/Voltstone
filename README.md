# 🤖 Volt Stone - Bot de Investimento em USDT (Telegram)

Volt Stone é um bot de investimento simples e interativo no Telegram que permite que usuários depositem **USDT (Tether)** e acompanhem seus rendimentos ao longo do tempo.

💼 **Rendimento variável de até 20% APY**  
📈 Visualização de saldo e rendimento  
🔐 Controle administrativo completo via Telegram  

---

## 🚀 Funcionalidades

- `/start` — Apresentação interativa com botões
- `/depositar` — Mostra a carteira para envio do investimento
- `/check` — Verifica se o depósito foi recebido (registro manual)
- `/saldo` — Mostra quanto o usuário tem e quanto já rendeu
- `/rendimentos` — Lista o histórico de rendimentos
- `/resgatar` — Solicita saque (registrado manualmente)

---

## ⚙️ Como usar (usuário comum)

1. Inicie o bot com `/start`
2. Envie **USDT** para o endereço informado via `/depositar`
3. Após o envio, use `/check` para confirmar (registro feito pelo admin)
4. Consulte seu investimento via `/saldo` e `/rendimentos`
5. Solicite saque com `/resgatar` (o admin processa manualmente)

---

## 🔐 Comandos de administrador (apenas para o ID autorizado)

> Admin ID configurado: **5608086275**

| Comando | Descrição |
|--------|-----------|
| `/admin` | Mostra os comandos administrativos |
| `/adddep @usuario valor` | Registra depósito para um usuário |
| `/addrend @usuario percentual` | Aplica rendimento percentual |
| `/veruser @usuario` | Consulta o investimento do usuário |

---

## 🧠 Como funciona o rendimento

- O rendimento **não é automático**.
- O administrador aplica manualmente um percentual ao capital investido (ex: 2% ao mês).
- Os rendimentos são registrados com **data, percentual aplicado e valor obtido**.

---

## 🛠️ Como rodar o bot no Render

1. Crie um repositório no GitHub com os seguintes arquivos:
   - `telegram_bot.py`
   - `database.py`
   - `requirements.txt`
   - `Procfile`

2. No [Render.com](https://render.com):
   - Crie um novo serviço do tipo **Background Worker**
   - Conecte ao repositório (se estiver público, não precisa token)
   - Configure as variáveis de ambiente:
     - `BOT_TOKEN`: token do bot do Telegram
     - `WALLET_ADDRESS`: endereço da carteira USDT (TRC20 ou ERC20)

---

## 📂 Estrutura do banco de dados (SQLite)

- `usuarios` — dados de cada investidor
- `investimentos` — valores e saldos
- `rendimentos` — histórico de ganhos aplicados
- `resgates` — solicitações de saque pendentes

---

## 🛡️ Segurança

- Nenhuma transação é feita automaticamente pelo bot.
- Todos os depósitos e saques são **manuais**, com registros no sistema.
- O objetivo é educacional e demonstração de uso de bots no Telegram com base em criptoativos.

---

## 📧 Contato

Este projeto é mantido por um desenvolvedor independente.  
Para fins **educacionais e de demonstração**.  
Uso por sua conta e risco.
