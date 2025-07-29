import os
import logging
from datetime import datetime
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ApplicationBuilder, CommandHandler, ContextTypes, CallbackQueryHandler
import database as db

# Configurações básicas
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BOT_TOKEN = os.getenv("BOT_TOKEN")
WALLET_ADDRESS = os.getenv("WALLET_ADDRESS", "SUA_CARTEIRA_USDT")
TOKEN_NAME = "USDT"
RENDIMENTO_MAX_APY = 20.0  # até 20% ao ano
ADMIN_ID = 5608086275  # Seu ID do Telegram

db.inicializar_banco()

# Comandos de usuário
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    db.registrar_usuario(user.id, user.username, user.first_name)

    keyboard = [
        [InlineKeyboardButton("💰 Saldo", callback_data='saldo')],
        [InlineKeyboardButton("📈 Rendimentos", callback_data='rendimentos')],
        [InlineKeyboardButton("📤 Resgatar", callback_data='resgatar')],
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    text = (
        f"👋 Olá {user.first_name}!\n\n"
        f"💼 Este bot permite que você deposite {TOKEN_NAME} e receba até {RENDIMENTO_MAX_APY}% APY com rendimento variável.\n\n"
        f"💰 Use /depositar para obter o endereço da carteira.\n"
        f"📊 Use os botões abaixo para consultar sua conta."
    )
    await update.message.reply_text(text, reply_markup=reply_markup)

async def depositar(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        f"📥 Para investir, envie {TOKEN_NAME} para:\n`{WALLET_ADDRESS}`\n\n"
        f"🔍 Após o envio, envie uma mensagem para o administrador para confirmar.",
        parse_mode="Markdown"
    )

async def handle_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    user_id = query.from_user.id

    if query.data == "saldo":
        info = db.get_investimento(user_id)
        if info:
            data = datetime.fromisoformat(info["data"]).strftime("%d/%m/%Y")
            await query.edit_message_text(
                f"💼 *Seu investimento*\n\n"
                f"📅 Desde: {data}\n"
                f"💵 Valor: {info['valor']:.2f} {TOKEN_NAME}\n"
                f"📈 Rendimento: {info['rendimento']:.2f} {TOKEN_NAME}",
                parse_mode="Markdown"
            )
        else:
            await query.edit_message_text("❌ Nenhum investimento encontrado.")

    elif query.data == "rendimentos":
        historico = db.get_historico_rendimento(user_id)
        if not historico:
            await query.edit_message_text("📭 Nenhum rendimento registrado.")
            return

        texto = "📊 *Histórico de Rendimentos*\n\n"
        for item in historico:
            data = datetime.fromisoformat(item["data"]).strftime("%d/%m/%Y")
            texto += f"• {data}: +{item['percentual']:.2f}% → +{item['valor']:.2f} {TOKEN_NAME}\n"

        await query.edit_message_text(texto, parse_mode="Markdown")

    elif query.data == "resgatar":
        await query.edit_message_text(
            f"⚠️ Deseja solicitar resgate de todo seu saldo?\n\n"
            f"👉 Confirme com /confirmar ou cancele com /cancelar"
        )

async def confirmar(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    info = db.get_investimento(user_id)
    if info:
        total = info["valor"] + info["rendimento"]
        db.registrar_resgate(user_id, total)
        await update.message.reply_text(f"✅ Solicitação de resgate de {total:.2f} {TOKEN_NAME} registrada.")
    else:
        await update.message.reply_text("❌ Nenhum investimento encontrado.")

async def cancelar(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("❌ Resgate cancelado.")

# Comandos administrativos
async def admin(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id != ADMIN_ID:
        return await update.message.reply_text("⛔ Acesso negado.")
    await update.message.reply_text(
        "🔐 Comandos de admin:\n"
        "/adddep @usuario valor\n"
        "/addrend @usuario percentual\n"
        "/veruser @usuario"
    )

async def adddep(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id != ADMIN_ID:
        return
    try:
        username = context.args[0].replace("@", "")
        valor = float(context.args[1])
        user_id = db.get_usuario_por_username(username)
        if user_id:
            db.registrar_deposito(user_id, valor)
            await update.message.reply_text(f"✅ Depósito de {valor:.2f} adicionado para @{username}")
        else:
            await update.message.reply_text("❌ Usuário não encontrado.")
    except:
        await update.message.reply_text("❌ Uso: /adddep @usuario valor")

async def addrend(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id != ADMIN_ID:
        return
    try:
        username = context.args[0].replace("@", "")
        percentual = float(context.args[1])
        user_id = db.get_usuario_por_username(username)
        info = db.get_investimento(user_id)
        if user_id and info:
            rendimento = (info["valor"] + info["rendimento"]) * (percentual / 100)
            db.registrar_rendimento(user_id, percentual, rendimento)
            await update.message.reply_text(f"✅ Rendimento de {percentual}% aplicado para @{username}")
        else:
            await update.message.reply_text("❌ Usuário ou investimento não encontrado.")
    except:
        await update.message.reply_text("❌ Uso: /addrend @usuario percentual")

async def veruser(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.effective_user.id != ADMIN_ID:
        return
    try:
        username = context.args[0].replace("@", "")
        user_id = db.get_usuario_por_username(username)
        info = db.get_investimento(user_id)
        if info:
            await update.message.reply_text(
                f"📌 @{username}\n"
                f"💵 Valor: {info['valor']:.2f}\n"
                f"📈 Rendimento: {info['rendimento']:.2f}\n"
                f"📅 Desde: {datetime.fromisoformat(info['data']).strftime('%d/%m/%Y')}"
            )
        else:
            await update.message.reply_text("❌ Nenhum investimento encontrado.")
    except:
        await update.message.reply_text("❌ Uso: /veruser @usuario")

# Inicialização
async def main():
    app = ApplicationBuilder().token(BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("depositar", depositar))
    app.add_handler(CommandHandler("confirmar", confirmar))
    app.add_handler(CommandHandler("cancelar", cancelar))

    app.add_handler(CommandHandler("admin", admin))
    app.add_handler(CommandHandler("adddep", adddep))
    app.add_handler(CommandHandler("addrend", addrend))
    app.add_handler(CommandHandler("veruser", veruser))

    app.add_handler(CallbackQueryHandler(handle_callback))

    logger.info("✅ Bot Volt Stone iniciado com sucesso.")
    await app.run_polling()

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
