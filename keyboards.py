from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, WebAppInfo
import database as db

def get_main_kb(user_id, admin_id):
    app_url = "https://vepr1991.github.io/Pet/index.html"
    is_master = (user_id == admin_id) or db.is_master(user_id)

    if is_master:
        buttons = [
            [KeyboardButton(text="⚙️ Панель управления", web_app=WebAppInfo(url=app_url))],
            [KeyboardButton(text="📊 Посмотреть записи (Админ)"), KeyboardButton(text="🔗 Моя ссылка")]
        ]
    else:
        buttons = [[KeyboardButton(text="Записаться на груминг ✂️", web_app=WebAppInfo(url=app_url))]]

    return ReplyKeyboardMarkup(keyboard=buttons, resize_keyboard=True)