from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, WebAppInfo
import database as db


def get_main_kb(user_id, admin_id):
    base_url = "https://vepr1991.github.io/Pet"
    is_master = db.is_master(user_id)
    is_admin = (user_id == admin_id)

    buttons = []

    if is_admin:
        # Добавляем ID в ссылку для админа
        buttons.append(
            [KeyboardButton(text="⚙️ Админ-панель", web_app=WebAppInfo(url=f"{base_url}/admin.html?master={user_id}"))])
        buttons.append([KeyboardButton(text="📊 Посмотреть записи (Все)")])
        buttons.append([KeyboardButton(text="🔗 Моя ссылка")])

    elif is_master:
        # Добавляем ID в ссылку для мастера
        buttons.append([KeyboardButton(text="⚙️ Панель мастера",
                                       web_app=WebAppInfo(url=f"{base_url}/admin.html?master={user_id}"))])
        buttons.append([
            KeyboardButton(text="🔗 Моя ссылка"),
            KeyboardButton(text="✂️ Редактировать услуги",
                           web_app=WebAppInfo(url=f"{base_url}/admin.html?master={user_id}#services"))
        ])

    # 2. ШАГ: МАСТЕР (НЕТ В БАЗЕ)
    else:
        # Убрали кнопку "Записаться на груминг", оставили только регистрацию
        buttons.append([KeyboardButton(text="🤝 Стать партнером (Регистрация мастера)")])

    return ReplyKeyboardMarkup(keyboard=buttons, resize_keyboard=True)