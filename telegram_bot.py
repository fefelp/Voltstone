import os
import logging
from datetime import datetime
from telegram import Update
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes
import database as db

# Configurações
BOT_TOKEN = os.getenv("BOT_TOKEN")
WALLET_ADDRESS = os.getenv("WALLET_ADDRESS", "SUA_CARTEIRA_USDT")
TOKEN_NAME = "USDT"
RENDIMENTO_MAXIMO = 20.0  # APY

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Comandos do bot
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    db.add_user(user.id, user.username, user.first_name)

    text = (
        f"👋 Olá {user.first_name}!\n\n"
        f"💼 Este bot permite que você deposite {TOKEN_NAME} e receba até {RENDIMENTO_MAXIMO}% APY com rendimento variável.\n\n"
        f"💰 Use /depositar para obter o endereço da carteira.\n"
        f"📊 Use /check para verificar seu depósito.\n"
        f"💼 Use /saldo para ver quanto você tem e quanto já rendeu.\n"
        f"📈 Use /rendimentos para ver o histórico de rendimentos."
    )
    await update.message.reply_text(text)

async def depositar(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        f"📥 Envie {TOKEN_NAME} para a carteira abaixo:\n\n`{WALLET_ADDRESS}`\n\n"
        f"🔍 Após enviar, use /check para verificar seu depósito.",
        parse_mode="Markdown"
    )

async def check(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    found = db.check_payment(user.id)
    if found:
        await update.message.reply_text("✅ Depósito confirmado e registrado com sucesso!")
    else:
        await update.message.reply_text("❌ Depósito não encontrado. Verifique se enviou corretamente.")

async def saldo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    info = db.get_user_investment(user.id)
    if info:
        valor = info["valor_depositado"]
        rendimento = info["rendimento_total"]
        data = info["data_deposito"].strftime("%d/%m/%Y")
        await update.message.reply_text(
            f"💼 Investimento registrado desde {data}\n"
            f"💰 Valor depositado: {valor:.2f} {TOKEN_NAME}\n"
            f"📈 Rendimento acumulado: {rendimento:.2f} {TOKEN_NAME}"
        )
    else:
        await update.message.reply_text("❌ Nenhum investimento encontrado.")

async def rendimentos(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    historico = db.get_rendimento_historico(user.id)
    if not historico:
        await update.message.reply_text("📭 Nenhum rendimento registrado ainda.")
        return

    texto = "📊 Histórico de rendimentos:\n"
    for item in historico:
        data = item["data"].strftime("%d/%m/%Y")
        perc = item["percentual"]
        valor = item["valor"]
        texto += f"• {data}: +{perc:.2f}% → +{valor:.2f} {TOKEN_NAME}\n"

    await update.message.reply_text(texto)

# Execução principal
async def main():
    app = ApplicationBuilder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("depositar", depositar))
    app.add_handler(CommandHandler("check", check))
    app.add_handler(CommandHandler("saldo", saldo))
    app.add_handler(CommandHandler("rendimentos", rendimentos))
    logger.info("Bot iniciado com sucesso!")
    await app.run_polling()

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())