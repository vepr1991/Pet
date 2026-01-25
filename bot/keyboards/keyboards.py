from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, WebAppInfo
from bot.database import requests as db

BASE_URL = "https://vepr1991.github.io/Pet"


def get_main_kb(user_id, admin_id, for_master=None):
    u_id = int(user_id)
    a_id = int(admin_id) if admin_id else None

    is_master = db.is_master(u_id)
    is_admin = (u_id == a_id)

    # 1. ЧИСТЫЙ КЛИЕНТСКИЙ ФЛОУ (Приоритет №1)
    if for_master and not is_master and not is_admin:
        studio = for_master.get('studio_name', 'студию')
        m_id = for_master.get('telegram_id')
        return ReplyKeyboardMarkup(keyboard=[
            [KeyboardButton(
                text=f"🐾 Записаться в {studio}",
                web_app=WebAppInfo(url=f"{BASE_URL}/index.html?master={m_id}")
            )]
            # УБРАЛИ кнопку "Стать партнером" отсюда, чтобы не путать клиента
        ], resize_keyboard=True)

    # 2. АДМИН
    if is_admin:
        return ReplyKeyboardMarkup(keyboard=[
            [KeyboardButton(text="📊 Посмотреть записи (Все)")],
            [KeyboardButton(text="⚙️ Админ-панель", web_app=WebAppInfo(url=f"{BASE_URL}/admin.html?master={u_id}"))],
            [KeyboardButton(text="🔗 Моя ссылка")]
        ], resize_keyboard=True)

    # 3. МАСТЕР
    if is_master:
        return ReplyKeyboardMarkup(keyboard=[
            [KeyboardButton(text="⚙️ Панель мастера", web_app=WebAppInfo(url=f"{BASE_URL}/admin.html?master={u_id}"))],
            [KeyboardButton(text="🔗 Моя ссылка")]
        ], resize_keyboard=True)

    # 4. СЛУЧАЙНЫЙ ВХОД (Не клиент и не мастер)
    return ReplyKeyboardMarkup(keyboard=[
        [KeyboardButton(text="🤝 Стать партнером (Регистрация мастера)")]
    ], resize_keyboard=True)