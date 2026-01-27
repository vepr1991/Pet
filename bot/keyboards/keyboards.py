from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, WebAppInfo
from bot.database import requests as db

# Убедитесь, что этот URL правильный и ведет к папке с html файлами
BASE_URL = "https://vepr1991.github.io/Pet"


def get_main_kb(user_id, admin_id, for_master=None):
    u_id = int(user_id)
    # Исправлена обработка admin_id, если он None или строка
    a_id = int(admin_id) if admin_id and str(admin_id).isdigit() else 0

    is_master = db.is_master(u_id)
    is_admin = (u_id == a_id)

    # 1. КЛИЕНТСКИЙ ФЛОУ (Если переданы данные мастера)
    # Убрали проверку "not is_master", чтобы мастер мог видеть клиентскую кнопку,
    # если перешел по ссылке start (для теста)
    if for_master:
        studio = for_master.get('studio_name', 'студию')
        m_id = for_master.get('telegram_id')

        # Важно: URL должен вести на client.html (или index.html с редиректом)
        # И параметр master={m_id} обязателен!
        return ReplyKeyboardMarkup(keyboard=[
            [KeyboardButton(
                text=f"🐾 Записаться в {studio}",
                web_app=WebAppInfo(url=f"{BASE_URL}/client.html?master={m_id}")
            )]
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

    # 4. ГОСТЬ (Случайный вход)
    return ReplyKeyboardMarkup(keyboard=[
        [KeyboardButton(text="🤝 Стать партнером (Регистрация мастера)")]
    ], resize_keyboard=True)