from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, WebAppInfo
import database as db

BASE_URL = "https://vepr1991.github.io/Pet"  # Твой адрес на GitHub


def get_main_kb(user_id, admin_id, for_master=None):
    u_id = int(user_id)
    a_id = int(admin_id) if admin_id else None

    # 1. Сценарий: Глобальный админ
    if a_id and u_id == a_id:
        return ReplyKeyboardMarkup(keyboard=[
            [KeyboardButton(text="📊 Посмотреть записи (Все)")],
            [KeyboardButton(text="⚙️ Админ-панель", web_app=WebAppInfo(url=f"{BASE_URL}/admin.html?master={u_id}"))],
            [KeyboardButton(text="🔗 Моя ссылка")]
        ], resize_keyboard=True)

    # 2. Сценарий: Зарегистрированный мастер
    if db.is_master(u_id):
        return ReplyKeyboardMarkup(keyboard=[
            [KeyboardButton(text="⚙️ Панель мастера", web_app=WebAppInfo(url=f"{BASE_URL}/admin.html?master={u_id}"))],
            [KeyboardButton(text="🔗 Моя ссылка"),
             KeyboardButton(text="✂️ Услуги", web_app=WebAppInfo(url=f"{BASE_URL}/admin.html?master={u_id}#services"))]
        ], resize_keyboard=True)

    # 3. Сценарий: КЛИЕНТ (зашел по ссылке мастера)
    if for_master:
        studio = for_master.get('studio_name', 'студию')
        m_id = for_master.get('telegram_id')
        return ReplyKeyboardMarkup(keyboard=[
            [KeyboardButton(text=f"🐾 Записаться в {studio}",
                            web_app=WebAppInfo(url=f"{BASE_URL}/client.html?master={m_id}"))],
            [KeyboardButton(text="🤝 Стать партнером (Для студий)")]
        ], resize_keyboard=True)

    # 4. Сценарий: Случайный прохожий
    return ReplyKeyboardMarkup(keyboard=[
        [KeyboardButton(text="🤝 Стать партнером (Регистрация мастера)")]
    ], resize_keyboard=True)