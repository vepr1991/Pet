from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, WebAppInfo
import database as db

def get_main_kb(user_id, admin_id):
    base_url = "https://vepr1991.github.io/Pet"
    is_master = db.is_master(user_id) # Проверка в таблице masters
    is_admin = (user_id == admin_id)

    buttons = []

    # 1. ШАГ: ВЫ (ГЛОБАЛЬНЫЙ АДМИН)
    if is_admin:
        # Убираем "Тест записи", оставляем только управление и проверку
        buttons.append([KeyboardButton(text="📊 Посмотреть записи (Все)")])
        buttons.append([KeyboardButton(text="⚙️ Админ-панель", web_app=WebAppInfo(url=f"{base_url}/admin.html"))])
        buttons.append([KeyboardButton(text="🔗 Моя ссылка")])

    # 3. ШАГ: ЗАРЕГИСТРИРОВАННЫЙ МАСТЕР (уже есть в базе)
    elif is_master:
        buttons.append([KeyboardButton(text="⚙️ Панель мастера", web_app=WebAppInfo(url=f"{base_url}/admin.html"))])
        buttons.append([
            KeyboardButton(text="🔗 Моя ссылка"),
            KeyboardButton(text="✂️ Редактировать услуги", web_app=WebAppInfo(url=f"{base_url}/admin.html#services"))
        ])

    # 2. ШАГ: МАСТЕР (НЕТ В БАЗЕ)
    else:
        # Убрали кнопку "Записаться на груминг", оставили только регистрацию
        buttons.append([KeyboardButton(text="🤝 Стать партнером (Регистрация мастера)")])

    return ReplyKeyboardMarkup(keyboard=buttons, resize_keyboard=True)