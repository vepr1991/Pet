from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, WebAppInfo


def get_main_kb(user_id, admin_id):
    # Укажите здесь URL, где вы разместите index.html (например, GitHub Pages)
    web_app_url = "https://ваш-логин.github.io/ваш-репозиторий/"

    if user_id == admin_id:
        buttons = [[KeyboardButton(text="📊 Посмотреть записи (Админ)")]]
    else:
        buttons = [[
            KeyboardButton(
                text="Записаться на груминг ✂️",
                web_app=WebAppInfo(url=web_app_url)
            )
        ]]
    return ReplyKeyboardMarkup(keyboard=buttons, resize_keyboard=True)


# Остальные клавиатуры (услуги и контакт) остаются без изменений
def get_services_kb():
    buttons = [
        [KeyboardButton(text="Полный комплекс"), KeyboardButton(text="Гигиена")],
        [KeyboardButton(text="Стрижка когтей"), KeyboardButton(text="Мытьё")],
        [KeyboardButton(text="❌ Отмена")]
    ]
    return ReplyKeyboardMarkup(keyboard=buttons, resize_keyboard=True)


def get_contact_kb():
    buttons = [[KeyboardButton(text="📱 Отправить контакт", request_contact=True)]]
    return ReplyKeyboardMarkup(keyboard=buttons, resize_keyboard=True, one_time_keyboard=True)