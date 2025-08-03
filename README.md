# VoltStonebot

Um bot simples de Telegram para exibir uma carteira USDT e listar usuários cadastrados.

## Comandos
- `/start` → Envia a carteira USDT
- `/usuarios` → Lista usuários (somente admin)

## Variáveis (em `env.json` ou via Render):
- `BOT_TOKEN` → Token do seu bot
- `ADMIN_ID` → ID do administrador
- `CARTEIRA_USDT` → Endereço da carteira

---

Feito com Node.js usando `node-telegram-bot-api`.