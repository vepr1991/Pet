import json
from aiogram import Router, F, types
from aiogram.filters import Command
import database as db
import keyboards as kb
from config import ADMIN_ID

router = Router()


# Обработка команды /start
@router.message(Command("start"))
async def cmd_start(message: types.Message):
    # Приветствуем пользователя и предлагаем воспользоваться Mini App кнопкой
    await message.answer(
        f"Привет, {message.from_user.first_name}! 🐾\n"
        "Добро пожаловать в PETGroom. Чтобы записаться на услуги, "
        "воспользуйтесь нашим новым мини-приложением ниже.",
        reply_markup=kb.get_main_kb(message.from_user.id, ADMIN_ID)
    )


# Обработка данных, пришедших из Mini App (после нажатия кнопки "Записаться" в форме)
@router.message(F.web_app_data)
async def process_web_app_data(message: types.Message):
    try:
        # Распаковываем JSON данные, отправленные через tg.sendData() из index.html
        data = json.loads(message.web_app_data.data)

        # Извлекаем данные из формы
        pet_type = data.get('pet_type', 'Питомец')
        breed_input = data.get('breed', 'Не указана')
        pet_name = data.get('pet_name', 'Не указано')
        service = data.get('service', 'Не выбрана')
        phone = data.get('phone', 'Не указан')
        date_time = data.get('date_time', 'Не указано')

        # Объединяем тип и породу для записи в существующую колонку breed
        full_pet_info = f"{pet_type}: {breed_input}"

        # Сохранение записи в базу данных SQLite
        db.add_appointment(
            user_id=message.from_user.id,
            breed=full_pet_info,
            pet_name=pet_name,
            service=service,
            date_time=date_time,
            phone=phone
        )

        # Подтверждение пользователю в чат
        await message.answer(
            f"✅ <b>Запись успешно создана!</b>\n\n"
            f"🐾 <b>Питомец:</b> {full_pet_info} ({pet_name})\n"
            f"✂️ <b>Услуга:</b> {service}\n"
            f"📅 <b>Время:</b> {date_time}\n"
            f"📞 <b>Телефон:</b> {phone}\n\n"
            f"Мастер свяжется с вами для подтверждения!",
            parse_mode="HTML",
            reply_markup=kb.get_main_kb(message.from_user.id, ADMIN_ID)
        )

        # Уведомление администратора о новой записи
        if ADMIN_ID:
            try:
                await message.bot.send_message(
                    ADMIN_ID,
                    f"🔔 <b>НОВАЯ ЗАПИСЬ ИЗ MINI APP!</b>\n\n"
                    f"👤 <b>Клиент:</b> {message.from_user.full_name}\n"
                    f"🐾 <b>Питомец:</b> {full_pet_info} ({pet_name})\n"
                    f"✂️ <b>Услуга:</b> {service}\n"
                    f"📅 <b>Время:</b> {date_time}\n"
                    f"📱 <b>Телефон:</b> {phone}",
                    parse_mode="HTML"
                )
            except Exception as e:
                print(f"Ошибка при отправке уведомления админу: {e}")

    except Exception as e:
        print(f"Ошибка обработки данных Web App: {e}")
        await message.answer(
            "Произошла ошибка при обработке данных из приложения. Попробуйте еще раз.",
            reply_markup=kb.get_main_kb(message.from_user.id, ADMIN_ID)
        )


# Хендлер для любого другого текста (подсказка пользователю)
@router.message(F.text)
async def handle_text(message: types.Message):
    await message.answer(
        "Пожалуйста, используйте кнопку в меню для записи ⬇️",
        reply_markup=kb.get_main_kb(message.from_user.id, ADMIN_ID)
    )