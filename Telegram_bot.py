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
        [InlineKeyboardButton("📈 Rendimentos", callback_data='
