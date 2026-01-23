from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, WebAppInfo
import database as db


def get_main_kb(user_id, admin_id):
    base_url = "https://vepr1991.github.io/Pet"
    is_master = (user_id == admin_id) or db.is_master(user_id)

    buttons = []

    # Если это мастер или ты (админ) — добавляем спец. кнопки
    if is_master:
        buttons.append([KeyboardButton(text="⚙️ Панель управления", web_app=WebAppInfo(url=f"{base_url}/admin.html"))])
        buttons.append([KeyboardButton(text="📊 Посмотреть записи (Админ)"), KeyboardButton(text="🔗 Моя ссылка")])

    # Кнопка записи должна быть У ВСЕХ, чтобы ты мог тестировать клиентский путь
    buttons.append([KeyboardButton(text="Записаться на груминг ✂️", web_app=WebAppInfo(url=f"{base_url}/index.html"))])

    return ReplyKeyboardMarkup(keyboard=buttons, resize_keyboard=True)