from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, WebAppInfo
import database as db

# Указываем базовый адрес вашего сайта здесь
BASE_URL = "https://vepr1991.github.io/Pet"

def get_main_kb(user_id, admin_id):
    is_master = db.is_master(user_id)
    # Проверка на админа (сравнение чисел)
    is_admin = (int(user_id) == int(admin_id)) if admin_id else False

    buttons = []

    # 1. ШАГ: ГЛОБАЛЬНЫЙ АДМИН (ВЫ)
    if is_admin:
        buttons.append([KeyboardButton(text="📊 Посмотреть записи (Все)")])
        # Используем BASE_URL здесь
        buttons.append([KeyboardButton(text="⚙️ Админ-панель", web_app=WebAppInfo(url=f"{BASE_URL}/admin.html?master={user_id}"))])
        buttons.append([KeyboardButton(text="🔗 Моя ссылка")])

    # 2. ШАГ: ЗАРЕГИСТРИРОВАННЫЙ МАСТЕР
    elif is_master:
        buttons.append([KeyboardButton(text="⚙️ Панель мастера", web_app=WebAppInfo(url=f"{BASE_URL}/admin.html?master={user_id}"))])
        buttons.append([
            KeyboardButton(text="🔗 Моя ссылка"),
            KeyboardButton(text="✂️ Редактировать услуги", web_app=WebAppInfo(url=f"{BASE_URL}/admin.html?master={user_id}#services"))
        ])

    # 3. ШАГ: НОВЫЙ ПОЛЬЗОВАТЕЛЬ (КЛИЕНТ)
    else:
        # Для обычного человека оставляем только кнопку регистрации мастера
        buttons.append([KeyboardButton(text="🤝 Стать партнером (Регистрация мастера)")])

    return ReplyKeyboardMarkup(keyboard=buttons, resize_keyboard=True)