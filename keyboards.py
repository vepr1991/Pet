from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, WebAppInfo
import database as db


def get_main_kb(user_id, admin_id):
    # Основные URL (замените на свои актуальные ссылки на GitHub Pages)
    # На client.html мы как раз и сделаем ваш выбор "Мастер/Клиент"
    app_url = "https://vepr1991.github.io/Pet/index.html"

    # 1. Проверяем: является ли пользователь Главным Админом или Мастером в базе
    is_user_master = (user_id == admin_id) or db.is_master(user_id)

    if is_user_master:
        # Клавиатура для МАСТЕРА
        buttons = [
            [KeyboardButton(text="⚙️ Панель управления", web_app=WebAppInfo(url=app_url))],
            [KeyboardButton(text="📋 Посмотреть записи (текст)")]
        ]
    else:
        # Клавиатура для КЛИЕНТА
        buttons = [
            [KeyboardButton(text="Записаться на груминг ✂️", web_app=WebAppInfo(url=app_url))]
        ]

    return ReplyKeyboardMarkup(
        keyboard=buttons,
        resize_keyboard=True,
        input_field_placeholder="Выберите действие..."
    )