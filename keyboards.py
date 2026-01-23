from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, WebAppInfo
import database as db


def get_main_kb(user_id, admin_id):
    # Базовый URL твоего GitHub Pages
    base_url = "https://vepr1991.github.io/Pet"

    # Бот уже знает роль пользователя из базы
    is_master = (user_id == admin_id) or db.is_master(user_id)

    if is_master:
        # МАСТЕР идет сразу в админку, минуя index.html
        buttons = [
            [KeyboardButton(text="⚙️ Панель управления", web_app=WebAppInfo(url=f"{base_url}/admin.html"))],
            [KeyboardButton(text="📊 Посмотреть записи (Админ)"), KeyboardButton(text="🔗 Моя ссылка")]
        ]
    else:
        # КЛИЕНТ идет в роутер (который может содержать рекламу или выбор салона)
        buttons = [
            [KeyboardButton(text="Записаться на груминг ✂️", web_app=WebAppInfo(url=f"{base_url}/index.html"))]
        ]

    return ReplyKeyboardMarkup(keyboard=buttons, resize_keyboard=True)