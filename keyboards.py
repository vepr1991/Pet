from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, WebAppInfo
import database as db


def get_main_kb(user_id, admin_id):
    # Твой базовый URL на GitHub
    base_url = "https://vepr1991.github.io/Pet"
    is_master = (user_id == admin_id) or db.is_master(user_id)

    buttons = []

    # 1. Кнопка для записи (теперь всегда с ID, чтобы всё подтягивалось)
    # Если зашел мастер или ты — кнопка ведёт на вашу же студию
    target_id = user_id if is_master else ""  # Для обычных клиентов пока пусто, или ID дефолтного мастера

    buttons.append([
        KeyboardButton(
            text="Записаться на груминг ✂️",
            web_app=WebAppInfo(url=f"{base_url}/client.html?master={user_id}")
        )
    ])

    # 2. Если мастер или админ — добавляем кнопки управления
    if is_master:
        buttons.append([
            KeyboardButton(text="⚙️ Панель управления", web_app=WebAppInfo(url=f"{base_url}/admin.html"))
        ])
        buttons.append([
            KeyboardButton(text="📊 Посмотреть записи (Админ)"),
            KeyboardButton(text="🔗 Моя ссылка")
        ])

    return ReplyKeyboardMarkup(keyboard=buttons, resize_keyboard=True)