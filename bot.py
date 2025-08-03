import json
import asyncio
from aiogram import Bot, Dispatcher, types
from aiogram.types import ParseMode
from aiogram.utils import executor
from database import load_balance, save_balance

# Carregar variáveis do arquivo
with open("env.json", "r") as f:
    config = json.load(f)

BOT_TOKEN = config["BOT_TOKEN"]
ADMIN_ID = config["ADMIN_ID"]
CARTEIRA_USDT = config["CARTEIRA_USDT"]

bot = Bot(token=BOT_TOKEN, parse_mode=ParseMode.HTML)
dp = Dispatcher(bot)

@dp.message_handler(commands=["start"])
async def start(message: types.Message):
    user_id = str(message.from_user.id)
    username = message.from_user.username or "usuário"
    balance = load_balance(user_id)
    text = (
        f"👋 Olá, {username}!\n"
        f"💼 Sua carteira é: <code>{CARTEIRA_USDT}</code>\n"
        f"💰 Seu saldo: <b>{balance} USDT</b>\n\n"
        f"Use /tap para ganhar 0.01 USDT!"
    )
    await message.answer(text)

@dp.message_handler(commands=["tap"])
async def tap(message: types.Message):
    user_id = str(message.from_user.id)
    balance = load_balance(user_id)
    balance += 0.01
    save_balance(user_id, balance)
    await message.answer(f"💸 Você ganhou 0.01 USDT!\nSaldo atual: <b>{balance:.2f} USDT</b>")

@dp.message_handler(commands=["saldo"])
async def saldo(message: types.Message):
    user_id = str(message.from_user.id)
    balance = load_balance(user_id)
    await message.answer(f"💰 Seu saldo atual é: <b>{balance:.2f} USDT</b>")

@dp.message_handler(commands=["admin"])
async def admin_cmd(message: types.Message):
    if message.from_user.id != ADMIN_ID:
        await message.reply("🚫 Você não tem permissão para isso.")
        return
    await message.reply("✅ Comando de admin executado com sucesso.")

if __name__ == "__main__":
    executor.start_polling(dp, skip_updates=True)