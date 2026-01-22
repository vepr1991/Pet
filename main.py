import asyncio
from aiogram import Bot, Dispatcher
from config import TOKEN
import database as db
from handlers import client, admin


async def main():
    db.init_db()

    bot = Bot(token=TOKEN)
    dp = Dispatcher()

    # Сначала ПРОВЕРЯЕМ АДМИНА, потом КЛИЕНТА
    dp.include_router(admin.router)  # Перенесли вверх
    dp.include_router(client.router)

    print("🚀 Бот запущен и готов к работе!")

    # Очищаем очередь сообщений, чтобы не отвечать на старые «тыки»
    await bot.delete_webhook(drop_pending_updates=True)
    await dp.start_polling(bot)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except (KeyboardInterrupt, SystemExit):
        # Это заставит бота закрыть сессию корректно и быстро
        print("Бот выключается...")