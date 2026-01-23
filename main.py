import asyncio
from aiogram import Bot, Dispatcher
from config import TOKEN
import database as db
from handlers import client, admin, master # Добавили master

async def main():
    db.init_db()

    bot = Bot(token=TOKEN)
    dp = Dispatcher()

    # Порядок регистрации роутеров: от частного к общему
    dp.include_router(admin.router)
    dp.include_router(master.router) # Новый роутер для мастеров
    dp.include_router(client.router)

    print("🚀 Бот запущен и готов к работе!")

    await bot.delete_webhook(drop_pending_updates=True)
    await dp.start_polling(bot)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except (KeyboardInterrupt, SystemExit):
        print("Бот выключается...")