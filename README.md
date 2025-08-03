# TrideUSDT Telegram Bot

Bot básico de Telegram com:
- Cadastro automático de usuários
- Envio de endereço de carteira USDT
- Comando de administração para ver usuários cadastrados

## Comandos principais

- `/start` → Mensagem de boas-vindas com carteira
- `/usuarios` → Lista todos os usuários (apenas ADMIN)

## Como rodar no Render (Web Service gratuito)

1. Faça deploy como **Web Service**
2. Defina os arquivos:
   - `bot.js`
   - `env.json`
   - `database.json`
   - `package.json`
3. O bot escutará uma porta falsa (`http`) para manter o serviço ativo.

✅ Pronto para plano gratuito sem precisar de Background Worker.