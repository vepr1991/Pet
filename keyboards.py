from aiogram.types import ReplyKeyboardMarkup, KeyboardButton


# Главное меню с разделением ролей
def get_main_kb(user_id, admin_id):
    if user_id == admin_id:
        # Клавиатура ТОЛЬКО для админа
        buttons = [[KeyboardButton(text="📊 Посмотреть записи (Админ)")]]
    else:
        # Клавиатура ТОЛЬКО для клиента
        buttons = [[KeyboardButton(text="Записаться на груминг ✂️")]]

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